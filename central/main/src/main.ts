import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import * as settings from 'electron-settings';
import { createLogger } from './logger.js';
import { ServerManager } from './server/server-manager.js';
import { SCCentral } from './apps/sccentral.js';
import { SCCoach } from './apps/sccoach.js';
import { registerIpcHandlers } from './ipc/ipc-handlers.js';

const logger = createLogger('main');

let mainWindow: BrowserWindow | null = null;
let serverManager: ServerManager | null = null;

const appType = process.argv.includes('coach') ? 'coach' : 'central';

async function createWindow() {
    const bounds = (await settings.get('windowBounds')) as unknown as Electron.Rectangle | undefined;

    mainWindow = new BrowserWindow({
        width: bounds?.width ?? 1400,
        height: bounds?.height ?? 900,
        x: bounds?.x,
        y: bounds?.y,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
        title: appType === 'coach' ? 'XeroScout 4 — Coach' : 'XeroScout 4 — Central',
    });

    mainWindow.loadFile(path.join(__dirname, '..', '..', '..', 'renderer', 'dist', 'index.html'));

    mainWindow.on('close', async () => {
        if (mainWindow) {
            await settings.set('windowBounds', JSON.parse(JSON.stringify(mainWindow.getBounds())));
        }
    });

    mainWindow.on('closed', () => { mainWindow = null; });

    if (process.env.NODE_ENV === 'development') {
        mainWindow.webContents.openDevTools();
    }
}

async function main() {
    await app.whenReady();

    // Start the NestJS server as a child process
    serverManager = new ServerManager(logger);
    await serverManager.start();

    // Create the appropriate app personality
    const xeroApp = appType === 'coach'
        ? new SCCoach(serverManager.getBaseUrl(), logger)
        : new SCCentral(serverManager.getBaseUrl(), logger);

    await createWindow();

    if (mainWindow) {
        registerIpcHandlers(xeroApp, mainWindow, ipcMain, logger);
        xeroApp.setWindow(mainWindow);
        await xeroApp.init();
    }

    app.on('activate', async () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            await createWindow();
        }
    });
}

app.on('window-all-closed', async () => {
    if (serverManager) {
        await serverManager.stop();
    }
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

main().catch(err => {
    logger.error('Fatal error during startup', { error: err instanceof Error ? err.stack : String(err) });
    process.exit(1);
});
