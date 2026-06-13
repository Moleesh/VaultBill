/** @format */

import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { BuilderStore } from '../../../electron/BuilderStore.js';
import { CredentialStore } from '../../../electron/CredentialStore.js';
import { DesktopRecordStore } from '../../../electron/RecordStore.js';
import { SettingsStore } from '../../../electron/SettingsStore.js';

export type HostedSessionTestHarness = {
    readonly cleanup: () => void;
    readonly credentialStore: CredentialStore;
    readonly directory: string;
    readonly databasePath: string;
    readonly builderStore: BuilderStore;
    readonly recordStore: DesktopRecordStore;
    readonly settingsStore: SettingsStore;
};

export const createHostedSessionTestHarness = (): HostedSessionTestHarness => {
    const directory = mkdtempSync(path.join(tmpdir(), 'vaultbill-hosted-session-'));
    const databasePath = path.join(directory, 'vaultbill.sqlite');
    const credentialStore = new CredentialStore(databasePath, {
        encryptString: (value) => Buffer.from(value),
        decryptString: (value) => value.toString('utf8'),
    });
    const recordStore = new DesktopRecordStore(databasePath);
    const builderStore = new BuilderStore(databasePath);
    const settingsStore = new SettingsStore(databasePath);
    return {
        cleanup: () => {
            recordStore.close();
            credentialStore.close();
            builderStore.close();
            settingsStore.close();
            rmSync(directory, { recursive: true, force: true });
        },
        credentialStore,
        directory,
        databasePath,
        builderStore,
        recordStore,
        settingsStore,
    };
};

export const encodeSecret = (value: string): string =>
    Buffer.from(value, 'utf8').toString('base64');
