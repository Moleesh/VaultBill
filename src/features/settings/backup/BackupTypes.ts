/** @format */

export type BackupFileName =
    | 'manifest.json'
    | 'database.sqlite'
    | 'database.sqlite.enc'
    | 'checksums.json';

export type BackupPackage = {
    readonly fileName: string;
    readonly files: Readonly<Record<BackupFileName, Uint8Array | undefined>>;
    readonly recoveryKey?: string;
};

export type BackupManifest = {
    readonly Product: 'VaultBill';
    readonly CreatedAt: string;
    readonly Encrypted: boolean;
    readonly DatabaseFile: 'database.sqlite' | 'database.sqlite.enc';
    readonly Encryption?: BackupEncryptionMetadata;
};

export type BackupEncryptionMetadata = {
    readonly Algorithm: 'AES-GCM';
    readonly PayloadIv: string;
    readonly PasswordWrap?: WrappedBackupKey;
    readonly RecoveryWrap: WrappedBackupKey;
};

export type WrappedBackupKey = {
    readonly Salt: string;
    readonly Iv: string;
    readonly WrappedKey: string;
};

export type BackupChecksums = Readonly<Record<string, string>>;

export type BackupCreateInput = {
    readonly databaseBytes: Uint8Array;
    readonly now: Date;
    readonly password?: string;
    readonly encryptionEnabled: boolean;
};

export type RestoreBackupInput = {
    readonly backupPackage: BackupPackage;
    readonly password?: string;
    readonly recoveryKey?: string;
};
