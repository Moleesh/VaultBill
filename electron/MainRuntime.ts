/** @format */

/**
 * Electron window, tray, and runtime lifecycle helpers.
 */

import {
    app,
    BrowserWindow,
    Menu,
    nativeImage,
    shell,
    Tray,
    type OpenDialogOptions,
    type SaveDialogOptions,
} from 'electron';
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { embeddedDesktopAppUrl, mainState, hostedAppUrl } from './MainState.js';

const getDevServerUrl = (): string | undefined =>
    process.argv
        .find((argument) => argument.startsWith('--dev-server-url='))
        ?.replace('--dev-server-url=', '');

const appendDesktopRuntimeMarker = (urlValue: string): string => {
    const url = new URL(urlValue);
    url.searchParams.set('runtime', 'desktop');
    return url.toString();
};

/** Reads the packaged license verifier embedded into the desktop build. */
export const readLicenseVerifier = (): string => {
    try {
        const packageJson = JSON.parse(
            readFileSync(path.join(app.getAppPath(), 'package.json'), 'utf8'),
        ) as {
            vaultBillLicenseVerifier?: string;
        };
        return packageJson.vaultBillLicenseVerifier ?? '';
    } catch {
        return '';
    }
};

/** Creates the main fullscreen workspace window and loads the active app URL. */
export const createWindow = async () => {
    mainState.mainWindow = new BrowserWindow({
        width: 1440,
        height: 900,
        minWidth: 320,
        minHeight: 568,
        title: mainState.identity.appName,
        frame: false,
        fullscreen: true,
        autoHideMenuBar: true,
        titleBarOverlay: {
            color: '#edf8f5',
            symbolColor: '#18302c',
            height: 48,
        },
        backgroundColor: '#edf8f5',
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            preload: path.join(mainState.currentDirectory, 'Preload.js'),
            sandbox: true,
        },
    });
    mainState.mainWindow.on('close', (event) => {
        if (!mainState.isQuitting) {
            event.preventDefault();
            mainState.mainWindow?.hide();
        }
    });
    mainState.mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('https://')) void shell.openExternal(url);
        return { action: 'deny' };
    });
    mainState.mainWindow.webContents.on('will-navigate', (event, url) => {
        const devServerUrl = getDevServerUrl();
        const allowedOrigin = devServerUrl
            ? new URL(devServerUrl).origin
            : new URL(hostedAppUrl()).origin;
        if (!url.startsWith(allowedOrigin)) event.preventDefault();
    });
    const devServerUrl = getDevServerUrl();
    if (devServerUrl) await mainState.mainWindow.loadURL(appendDesktopRuntimeMarker(devServerUrl));
    else await mainState.mainWindow.loadURL(embeddedDesktopAppUrl());
};

/** Creates the tray icon and menu used while VaultBill continues running in the background. */
export const createTray = () => {
    const icon = nativeImage.createFromPath(
        path.join(mainState.currentDirectory, '../build/icon.png'),
    );
    mainState.tray = new Tray(icon);
    mainState.tray.setToolTip('VaultBill is hosting the local workspace');
    mainState.tray.setContextMenu(
        Menu.buildFromTemplate([
            {
                label: 'Open VaultBill',
                click: () => {
                    mainState.mainWindow?.show();
                    mainState.mainWindow?.focus();
                },
            },
            { label: `Hosted web: ${hostedAppUrl()}`, enabled: false },
            {
                label: mainState.hostedWebSettings.lanEnabled
                    ? `LAN access: enabled on port ${String(mainState.hostedWebSettings.port)}`
                    : 'LAN access: disabled',
                enabled: false,
            },
            { type: 'separator' },
            {
                label: 'Quit VaultBill',
                click: () => {
                    mainState.isQuitting = true;
                    app.quit();
                },
            },
        ]),
    );
    mainState.tray.on('double-click', () => mainState.mainWindow?.show());
};

/** Rebuilds the tray so hosted-web status text stays in sync after settings changes. */
export const refreshTray = () => {
    mainState.tray?.destroy();
    mainState.tray = undefined;
    createTray();
};

/** Closes background services and stores exactly once during runtime shutdown. */
export const closeRuntime = async () => {
    if (mainState.runtimeClosePromise) return mainState.runtimeClosePromise;
    mainState.runtimeClosePromise = (async () => {
        if (mainState.trialTimer) clearInterval(mainState.trialTimer);
        mainState.trialTimer = undefined;
        const server = mainState.localApiServer;
        mainState.localApiServer = undefined;
        await server?.stop();
        mainState.recordStore?.close();
        mainState.recordStore = undefined;
        mainState.credentialStore?.close();
        mainState.credentialStore = undefined;
        mainState.builderStore?.close();
        mainState.builderStore = undefined;
        mainState.settingsStore?.close();
        mainState.settingsStore = undefined;
    })();
    return mainState.runtimeClosePromise;
};

/** Relaunches the Electron application after a short delay. */
export const restartApplication = () => {
    setTimeout(() => {
        app.relaunch();
        app.exit(0);
    }, 150);
};

/** Runs a destructive runtime mutation, then restarts the application once cleanup finishes. */
export const scheduleRuntimeMutation = (mutation: () => Promise<void> | void) => {
    setTimeout(() => {
        void closeRuntime()
            .then(async () => {
                await mutation();
                restartApplication();
            })
            .catch((error: unknown) => {
                console.error('VaultBill could not complete the requested data operation.', error);
            });
    }, 250);
};

/** Creates the save-dialog options used for desktop backup exports. */
export const createDialogOptions = (defaultFileName: string): SaveDialogOptions => ({
    defaultPath: defaultFileName,
    filters: [{ name: 'VaultBill backup', extensions: ['zip'] }],
});

/** Creates the open-dialog options used for desktop backup restore imports. */
export const createRestoreOptions = (): OpenDialogOptions => ({
    properties: ['openFile'],
    filters: [{ name: 'VaultBill backup', extensions: ['zip'] }],
});
