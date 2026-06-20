/** @format */

// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest';

const browserWindowMock = vi.fn();
const loadURLMock = vi.fn();
const windowOnMock = vi.fn();
const setWindowOpenHandlerMock = vi.fn();
const webContentsOnMock = vi.fn();
let lastBrowserWindowOptions: Record<string, unknown> | undefined;

vi.mock('electron', () => {
    class BrowserWindowMock {
        readonly on = windowOnMock;
        readonly loadURL = loadURLMock;
        readonly webContents = {
            on: webContentsOnMock,
            setWindowOpenHandler: setWindowOpenHandlerMock,
        };

        constructor(options: unknown) {
            lastBrowserWindowOptions = options as Record<string, unknown>;
            browserWindowMock(options);
        }
    }

    return {
        app: {
            getPath: vi.fn(),
        },
        BrowserWindow: BrowserWindowMock,
        Menu: {
            buildFromTemplate: vi.fn(),
            setApplicationMenu: vi.fn(),
        },
        nativeImage: {
            createFromPath: vi.fn(),
        },
        shell: {
            openExternal: vi.fn(),
        },
        Tray: vi.fn(),
    };
});

describe('MainRuntime createWindow', () => {
    beforeEach(async () => {
        vi.resetModules();
        browserWindowMock.mockClear();
        loadURLMock.mockClear();
        windowOnMock.mockClear();
        setWindowOpenHandlerMock.mockClear();
        webContentsOnMock.mockClear();
        lastBrowserWindowOptions = undefined;
        process.argv = [
            ...process.argv.filter((argument) => !argument.startsWith('--dev-server-url=')),
            '--dev-server-url=http://localhost:5173',
        ];

        const { mainState } = await import('../MainState.js');
        mainState.currentDirectory = 'C:/VaultBill/electron';
        mainState.identity = { appName: 'VaultBill' };
        mainState.mainWindow = undefined;
    });

    it('creates the desktop window with native chrome controls in the title bar overlay', async () => {
        const { createWindow } = await import('../MainRuntime.js');
        const { mainState } = await import('../MainState.js');

        await createWindow();

        expect(browserWindowMock).toHaveBeenCalledTimes(1);
        expect(lastBrowserWindowOptions).toMatchObject({
            frame: false,
            fullscreen: true,
            autoHideMenuBar: true,
            titleBarOverlay: {
                color: '#edf8f5',
                symbolColor: '#18302c',
                height: 48,
            },
            webPreferences: {
                contextIsolation: true,
                nodeIntegration: false,
                sandbox: true,
            },
        });
        expect(mainState.mainWindow).toBeDefined();
        expect(loadURLMock).toHaveBeenCalledWith('http://localhost:5173');
        expect(windowOnMock).toHaveBeenCalledWith('close', expect.any(Function));
        expect(setWindowOpenHandlerMock).toHaveBeenCalledTimes(1);
        expect(webContentsOnMock).toHaveBeenCalledWith('will-navigate', expect.any(Function));
    });
});
