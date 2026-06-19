/** @format */

import type { BrowserWindow, Tray } from 'electron';

import type { BackupService } from './BackupService.js';
import type { BuilderStore } from './BuilderStore.js';
import type { CredentialStore } from './CredentialStore.js';
import type { DesktopRecordStore } from './RecordStore.js';
import type { SettingsStore } from './SettingsStore.js';
import type { LocalApiServer } from './server/LocalApiServer.js';
import { defaultHostedWebPort } from './server/LocalApiSecurity.js';

export const hostedAppUrl = (): string =>
    `http://127.0.0.1:${String(mainState.hostedWebSettings.port)}`;

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
    recordStore: DesktopRecordStore | undefined;
    credentialStore: CredentialStore | undefined;
    builderStore: BuilderStore | undefined;
    settingsStore: SettingsStore | undefined;
    backupService: BackupService | undefined;
    localApiServer: LocalApiServer | undefined;
    mainWindow: BrowserWindow | undefined;
    tray: Tray | undefined;
    hostedWebSettings: HostedWebSettings;
    isQuitting: boolean;
    trialTimer: NodeJS.Timeout | undefined;
    runtimeClosePromise: Promise<void> | undefined;
};

export const mainState: MainState = {
    currentDirectory: '',
    identity: { appName: 'VaultBill' },
    recordStore: undefined,
    credentialStore: undefined,
    builderStore: undefined,
    settingsStore: undefined,
    backupService: undefined,
    localApiServer: undefined,
    mainWindow: undefined,
    tray: undefined,
    hostedWebSettings: { lanEnabled: false, passwordRequired: true, port: defaultHostedWebPort },
    isQuitting: false,
    trialTimer: undefined,
    runtimeClosePromise: undefined,
};
