/** @format */

import type { BrowserWindow, Tray } from 'electron';

import type { BackupService } from './BackupService.js';
import type { BuilderStore } from './BuilderStore.js';
import type { CredentialStore } from './CredentialStore.js';
import type { DesktopRecordStore } from './RecordStore.js';
import type { SettingsStore } from './SettingsStore.js';
import type { LocalApiServer } from './server/LocalApiServer.js';

export const hostedAppUrl = 'http://127.0.0.1:4317';

export type MainIdentity = {
    readonly appName: string;
};

export type HostedWebSettings = {
    lanEnabled: boolean;
    passwordRequired: boolean;
    port: number;
};

export type MainState = {
    currentDirectory: string;
    identity: MainIdentity;
    recordStore?: DesktopRecordStore;
    credentialStore?: CredentialStore;
    builderStore?: BuilderStore;
    settingsStore?: SettingsStore;
    backupService?: BackupService;
    localApiServer?: LocalApiServer;
    mainWindow?: BrowserWindow;
    tray?: Tray;
    hostedWebSettings: HostedWebSettings;
    isQuitting: boolean;
    trialTimer?: NodeJS.Timeout;
    runtimeClosePromise?: Promise<void>;
};

export const mainState: MainState = {
    currentDirectory: '',
    identity: { appName: 'VaultBill' },
    hostedWebSettings: { lanEnabled: false, passwordRequired: true, port: 4317 },
    isQuitting: false,
};

