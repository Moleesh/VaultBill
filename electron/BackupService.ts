/** @format */

import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate';
import { randomBytes } from 'node:crypto';
import {
    copyFileSync,
    existsSync,
    mkdirSync,
    readFileSync,
    renameSync,
    rmSync,
    writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

import {
    ManifestSchema,
    buildChecksums,
    decryptDatabase,
    encryptDatabase,
    validateChecksums,
    validateDatabase,
} from './BackupServiceSupport.js';

export type BackupCreationResult = {
    readonly cancelled: boolean;
    readonly filePath?: string;
    readonly recoveryKey?: string;
};

export type PreparedRestore = {
    readonly cancelled: boolean;
    readonly databasePath?: string;
};

export type BackupDialogAdapter = {
    readonly chooseBackupDestination: (defaultFileName: string) => Promise<string | undefined>;
    readonly chooseRestoreSource: () => Promise<string | undefined>;
};

export type BackupArchive = {
    readonly bytes: Uint8Array;
    readonly recoveryKey?: string;
};

export class BackupService {
    public constructor(
        private readonly databasePath: string,
        private readonly dialogs: BackupDialogAdapter,
    ) {}

    public create = async (
        encryptionEnabled: boolean,
        password?: string,
    ): Promise<BackupCreationResult> => {
        const timestamp = new Date()
            .toISOString()
            .slice(0, 16)
            .replace('T', '-')
            .replaceAll(':', '-');
        const filePath = await this.dialogs.chooseBackupDestination(
            `vaultbill-backup-${timestamp}.zip`,
        );
        if (!filePath) return { cancelled: true };
        const archive = this.createArchive(encryptionEnabled, password);
        writeFileSync(filePath, archive.bytes);
        return {
            cancelled: false,
            filePath,
            ...(archive.recoveryKey ? { recoveryKey: archive.recoveryKey } : {}),
        };
    };

    public createArchive = (encryptionEnabled: boolean, password?: string): BackupArchive => {
        const snapshotPath = this.#snapshotPath('create');
        this.#createSnapshot(snapshotPath);
        try {
            const databaseBytes = new Uint8Array(readFileSync(snapshotPath));
            const encrypted = encryptionEnabled
                ? encryptDatabase(databaseBytes, password)
                : undefined;
            const manifest = {
                Product: 'VaultBill',
                CreatedAt: new Date().toISOString(),
                Encrypted: Boolean(encrypted),
                DatabaseFile: encrypted ? 'database.sqlite.enc' : 'database.sqlite',
                ...(encrypted ? { Encryption: encrypted.metadata } : {}),
            };
            const databaseFile = manifest.DatabaseFile;
            const files: Record<string, Uint8Array> = {
                'manifest.json': strToU8(JSON.stringify(manifest)),
                [databaseFile]: encrypted?.bytes ?? databaseBytes,
            };
            files['checksums.json'] = strToU8(JSON.stringify(buildChecksums(files)));
            return {
                bytes: zipSync(files, { level: 6 }),
                ...(encrypted ? { recoveryKey: encrypted.recoveryKey } : {}),
            };
        } finally {
            rmSync(snapshotPath, { force: true });
        }
    };

    public prepareRestore = async (
        password?: string,
        recoveryKey?: string,
    ): Promise<PreparedRestore> => {
        const selectedPath = await this.dialogs.chooseRestoreSource();
        if (!selectedPath) return { cancelled: true };
        return {
            cancelled: false,
            databasePath: this.prepareRestoreArchive(
                new Uint8Array(readFileSync(selectedPath)),
                password,
                recoveryKey,
            ),
        };
    };

    public prepareRestoreArchive = (
        archiveBytes: Uint8Array,
        password?: string,
        recoveryKey?: string,
    ): string => {
        const files = unzipSync(archiveBytes);
        const manifestBytes = files['manifest.json'];
        const checksumBytes = files['checksums.json'];
        if (!manifestBytes || !checksumBytes) throw new Error('Backup metadata is incomplete.');
        const manifest = ManifestSchema.parse(JSON.parse(strFromU8(manifestBytes)));
        validateChecksums(files, JSON.parse(strFromU8(checksumBytes)) as Record<string, string>);
        const payload = files[manifest.DatabaseFile];
        if (!payload) throw new Error(`Backup ${manifest.DatabaseFile} is missing.`);
        if (manifest.Encrypted && !manifest.Encryption) {
            throw new Error('Encrypted backup metadata is missing.');
        }
        const databaseBytes =
            manifest.Encrypted && manifest.Encryption
                ? decryptDatabase(payload, manifest.Encryption, password, recoveryKey)
                : payload;
        const restorePath = this.#snapshotPath('restore');
        writeFileSync(restorePath, databaseBytes);
        try {
            validateDatabase(restorePath);
            return restorePath;
        } catch (error) {
            rmSync(restorePath, { force: true });
            throw error;
        }
    };

    public replaceDatabase = (preparedDatabasePath: string) => {
        const previousPath = `${this.databasePath}.before-restore`;
        const replacementPath = `${this.databasePath}.restore-${randomBytes(8).toString('hex')}`;
        rmSync(previousPath, { force: true });
        copyFileSync(preparedDatabasePath, replacementPath);
        try {
            if (existsSync(this.databasePath)) copyFileSync(this.databasePath, previousPath);
            this.#removeDatabaseFiles();
            renameSync(replacementPath, this.databasePath);
            rmSync(preparedDatabasePath, { force: true });
        } catch (error) {
            rmSync(replacementPath, { force: true });
            if (!existsSync(this.databasePath) && existsSync(previousPath)) {
                copyFileSync(previousPath, this.databasePath);
            }
            throw error;
        }
    };

    public resetDatabase = () => {
        this.#removeDatabaseFiles();
        rmSync(`${this.databasePath}.before-restore`, { force: true });
    };

    #createSnapshot = (snapshotPath: string) => {
        rmSync(snapshotPath, { force: true });
        const database = new DatabaseSync(this.databasePath);
        try {
            database.exec(`VACUUM INTO '${snapshotPath.replaceAll("'", "''")}';`);
        } finally {
            database.close();
        }
    };

    #snapshotPath = (purpose: string): string => {
        const directory = path.join(tmpdir(), 'vaultbill-backups');
        mkdirSync(directory, { recursive: true });
        return path.join(directory, `${purpose}-${randomBytes(12).toString('hex')}.sqlite`);
    };

    #removeDatabaseFiles = () => {
        rmSync(this.databasePath, { force: true });
        rmSync(`${this.databasePath}-wal`, { force: true });
        rmSync(`${this.databasePath}-shm`, { force: true });
    };
}
