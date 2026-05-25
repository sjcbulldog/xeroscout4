import { IpcMain, BrowserWindow } from 'electron';
import { Logger } from 'winston';
import { SCBase } from '../apps/scbase.js';
import { SCCentral } from '../apps/sccentral.js';

export function registerIpcHandlers(
    xeroApp: SCBase,
    win: BrowserWindow,
    ipcMain: IpcMain,
    logger: Logger,
): void {
    // ── Navigation ────────────────────────────────────────────────────────────
    ipcMain.handle('get-nav-data', async () => {
        return xeroApp.buildNavData();
    });

    ipcMain.handle('splitter-changed', async (_e, pos: number) => {
        await xeroApp.splitterChanged(pos);
    });

    // ── Info ──────────────────────────────────────────────────────────────────
    ipcMain.handle('get-info-data', async () => {
        return xeroApp.getInfoData();
    });

    // ── Commands ──────────────────────────────────────────────────────────────
    ipcMain.handle('execute-command', async (_e, cmd: string, ...args: unknown[]) => {
        logger.info('execute-command', { cmd, args });
        const central = xeroApp as unknown as SCCentral;
        try {
            switch (cmd) {
                case 'create-event':         return central.commandCreateEvent?.();
                case 'open-event':           return central.commandOpenEvent?.();
                case 'select-event':         return central.commandSelectEvent?.(args[0] as string);
                case 'lock-event':           return central.commandLockEvent?.();
                case 'import-ba':            return central.commandImportFromBA?.();
                case 'import-statbotics':    return central.commandImportStatbotics?.();
                case 'sync-to-cloud':        return central.commandSyncToCloud?.(args[0] as string, args[1] as string);
                default:
                    logger.warn('Unknown command', { cmd });
                    return { error: `Unknown command: ${cmd}` };
            }
        } catch (err) {
            logger.error('Command failed', { cmd, error: err });
            return { error: String(err) };
        }
    });

    // ── Forms ─────────────────────────────────────────────────────────────────
    ipcMain.handle('get-form', async (_e, purpose: 'team' | 'match') => {
        const event = (xeroApp as SCBase & { currentEvent: unknown }).currentEvent as { teamFormJson?: string; matchFormJson?: string } | null;
        if (!event) return null;
        const json = purpose === 'team' ? event.teamFormJson : event.matchFormJson;
        return json ? JSON.parse(json) : null;
    });

    ipcMain.handle('save-form', async (_e, purpose: 'team' | 'match', form: unknown) => {
        const app = xeroApp as SCBase & { currentEventUuid: string | null; api: { updateEvent(uuid: string, body: unknown): Promise<unknown> } };
        if (!app.currentEventUuid) return;
        const key = purpose === 'team' ? 'teamFormJson' : 'matchFormJson';
        await app.api.updateEvent(app.currentEventUuid, { [key]: JSON.stringify(form) });
    });

    // ── Database views ────────────────────────────────────────────────────────
    ipcMain.handle('get-team-db', async () => {
        const app = xeroApp as SCBase & { currentEventUuid: string | null; api: { getResults(uuid: string): Promise<unknown> } };
        if (!app.currentEventUuid) return null;
        return app.api.getResults(app.currentEventUuid);
    });

    ipcMain.handle('get-match-db', async () => {
        const app = xeroApp as SCBase & { currentEventUuid: string | null; api: { getResults(uuid: string): Promise<unknown> } };
        if (!app.currentEventUuid) return null;
        return app.api.getResults(app.currentEventUuid);
    });

    ipcMain.handle('update-match-db', async (_e, change: unknown) => {
        const app = xeroApp as SCBase & { currentEventUuid: string | null; api: { submitCorrection(uuid: string, body: unknown): Promise<unknown> } };
        if (!app.currentEventUuid) return;
        return app.api.submitCorrection(app.currentEventUuid, change);
    });

    ipcMain.handle('update-team-db', async (_e, change: unknown) => {
        const app = xeroApp as SCBase & { currentEventUuid: string | null; api: { submitCorrection(uuid: string, body: unknown): Promise<unknown> } };
        if (!app.currentEventUuid) return;
        return app.api.submitCorrection(app.currentEventUuid, change);
    });

    // ── Status views ──────────────────────────────────────────────────────────
    ipcMain.handle('get-team-status', async () => {
        const app = xeroApp as SCBase & { currentEventUuid: string | null; api: { getResults(uuid: string): Promise<unknown>; listTeams(uuid: string): Promise<unknown> } };
        if (!app.currentEventUuid) return null;
        const [results, teams] = await Promise.all([
            app.api.getResults(app.currentEventUuid),
            app.api.listTeams(app.currentEventUuid),
        ]);
        return { results, teams };
    });

    ipcMain.handle('get-match-status', async () => {
        const app = xeroApp as SCBase & { currentEventUuid: string | null; api: { getResults(uuid: string): Promise<unknown>; listMatches(uuid: string): Promise<unknown> } };
        if (!app.currentEventUuid) return null;
        const [results, matches] = await Promise.all([
            app.api.getResults(app.currentEventUuid),
            app.api.listMatches(app.currentEventUuid),
        ]);
        return { results, matches };
    });

    // ── Analysis ──────────────────────────────────────────────────────────────
    ipcMain.handle('get-formulas', async () => {
        const app = xeroApp as SCBase & { currentEventUuid: string | null; api: { getFormulas(uuid: string): Promise<unknown> } };
        if (!app.currentEventUuid) return { formulas: [] };
        return app.api.getFormulas(app.currentEventUuid);
    });

    ipcMain.handle('update-formula', async (_e, formula: unknown) => {
        const app = xeroApp as SCBase & { currentEventUuid: string | null; api: { getFormulas(uuid: string): Promise<{ formulas: unknown[] }>; upsertFormulas(uuid: string, body: unknown): Promise<unknown> } };
        if (!app.currentEventUuid) return;
        const existing = await app.api.getFormulas(app.currentEventUuid) as { formulas: Array<{ name: string }> };
        const formulas = existing.formulas.filter((f) => f.name !== (formula as { name: string }).name);
        formulas.push(formula as { name: string });
        return app.api.upsertFormulas(app.currentEventUuid, { formulas });
    });

    ipcMain.handle('delete-formula', async (_e, name: string) => {
        const app = xeroApp as SCBase & { currentEventUuid: string | null; api: { getFormulas(uuid: string): Promise<{ formulas: unknown[] }>; upsertFormulas(uuid: string, body: unknown): Promise<unknown> } };
        if (!app.currentEventUuid) return;
        const existing = await app.api.getFormulas(app.currentEventUuid) as { formulas: Array<{ name: string }> };
        const formulas = existing.formulas.filter((f) => f.name !== name);
        return app.api.upsertFormulas(app.currentEventUuid, { formulas });
    });

    ipcMain.handle('get-datasets', async () => {
        const app = xeroApp as SCBase & { currentEventUuid: string | null; api: { getDatasets(uuid: string): Promise<unknown> } };
        if (!app.currentEventUuid) return { datasets: [] };
        return app.api.getDatasets(app.currentEventUuid);
    });

    ipcMain.handle('update-datasets', async (_e, datasets: unknown) => {
        const app = xeroApp as SCBase & { currentEventUuid: string | null; api: { upsertDatasets(uuid: string, body: unknown): Promise<unknown> } };
        if (!app.currentEventUuid) return;
        return app.api.upsertDatasets(app.currentEventUuid, { datasets });
    });

    ipcMain.handle('get-picklist-configs', async () => {
        const app = xeroApp as SCBase & { currentEventUuid: string | null; api: { getPicklists(uuid: string): Promise<unknown> } };
        if (!app.currentEventUuid) return { picklists: [] };
        return app.api.getPicklists(app.currentEventUuid);
    });

    ipcMain.handle('save-picklist-config', async (_e, config: unknown) => {
        const app = xeroApp as SCBase & { currentEventUuid: string | null; api: { getPicklists(uuid: string): Promise<{ picklists: unknown[] }>; upsertPicklists(uuid: string, body: unknown): Promise<unknown> } };
        if (!app.currentEventUuid) return;
        const existing = await app.api.getPicklists(app.currentEventUuid) as { picklists: Array<{ name: string }> };
        const picklists = existing.picklists.filter((p) => p.name !== (config as { name: string }).name);
        picklists.push(config as { name: string });
        return app.api.upsertPicklists(app.currentEventUuid, { picklists });
    });

    ipcMain.handle('delete-picklist-config', async (_e, name: string) => {
        const app = xeroApp as SCBase & { currentEventUuid: string | null; api: { getPicklists(uuid: string): Promise<{ picklists: unknown[] }>; upsertPicklists(uuid: string, body: unknown): Promise<unknown> } };
        if (!app.currentEventUuid) return;
        const existing = await app.api.getPicklists(app.currentEventUuid) as { picklists: Array<{ name: string }> };
        const picklists = existing.picklists.filter((p) => p.name !== name);
        return app.api.upsertPicklists(app.currentEventUuid, { picklists });
    });

    ipcMain.handle('get-picklist-data', async (_e, name: string) => {
        const app = xeroApp as SCBase & { currentEventUuid: string | null; api: { getPicklistData(uuid: string, name: string): Promise<unknown> } };
        if (!app.currentEventUuid) return null;
        return app.api.getPicklistData(app.currentEventUuid, name);
    });

    ipcMain.handle('get-playoff-status', async () => {
        const app = xeroApp as SCBase & { currentEventUuid: string | null; api: { getPlayoff(uuid: string): Promise<unknown> } };
        if (!app.currentEventUuid) return null;
        return app.api.getPlayoff(app.currentEventUuid);
    });

    ipcMain.handle('set-alliance-teams', async (_e, alliance: number, teams: number[]) => {
        const app = xeroApp as SCBase & { currentEventUuid: string | null; api: { getPlayoff(uuid: string): Promise<unknown>; setPlayoff(uuid: string, body: unknown): Promise<unknown> } };
        if (!app.currentEventUuid) return;
        const existing = await app.api.getPlayoff(app.currentEventUuid) as { bracket: { alliances: unknown[] } };
        const bracket = existing.bracket ?? { alliances: Array(8).fill(undefined), outcomes: {} };
        (bracket.alliances as unknown[])[alliance - 1] = { teams };
        return app.api.setPlayoff(app.currentEventUuid, { bracket });
    });

    ipcMain.handle('set-playoff-match-outcome', async (_e, match: string, winner: number, loser: number) => {
        const app = xeroApp as SCBase & { currentEventUuid: string | null; api: { getPlayoff(uuid: string): Promise<unknown>; setPlayoff(uuid: string, body: unknown): Promise<unknown> } };
        if (!app.currentEventUuid) return;
        const existing = await app.api.getPlayoff(app.currentEventUuid) as { bracket: { outcomes: Record<string, unknown> } };
        const bracket = existing.bracket ?? { alliances: Array(8).fill(undefined), outcomes: {} };
        bracket.outcomes[match] = { winner, loser };
        return app.api.setPlayoff(app.currentEventUuid, { bracket });
    });

    // ── Images ────────────────────────────────────────────────────────────────
    ipcMain.handle('get-images', async () => {
        const app = xeroApp as SCBase & { currentEventUuid: string | null; api: { listImages(uuid: string): Promise<unknown> } };
        if (!app.currentEventUuid) return { images: [] };
        return app.api.listImages(app.currentEventUuid);
    });

    ipcMain.handle('get-image-data', async (_e, name: string) => {
        const app = xeroApp as SCBase & { currentEventUuid: string | null; api: { getImageData(uuid: string, name: string): Promise<unknown> } };
        if (!app.currentEventUuid) return null;
        return app.api.getImageData(app.currentEventUuid, name);
    });

    ipcMain.handle('import-image', async (_e, name: string, data: string, mimeType: string) => {
        const app = xeroApp as SCBase & { currentEventUuid: string | null; api: { uploadImage(uuid: string, body: unknown): Promise<unknown> } };
        if (!app.currentEventUuid) return null;
        return app.api.uploadImage(app.currentEventUuid, { name, data, mimeType });
    });

    // ── Logging ───────────────────────────────────────────────────────────────
    ipcMain.handle('log-client-message', (_e, level: string, msg: string) => {
        logger.log(level, `[renderer] ${msg}`);
    });

    // ── Prompt string response ─────────────────────────────────────────────────
    ipcMain.handle('prompt-string-response', (_e, id: string, value: string | undefined) => {
        win.webContents.emit('ipc-message', undefined, 'prompt-string-response', id, value);
    });

    // ── Sync ──────────────────────────────────────────────────────────────────
    ipcMain.handle('sync-to-cloud', async (_e, options: unknown) => {
        const central = xeroApp as unknown as SCCentral & { commandSyncToCloud?: (url: string, key: string) => Promise<void> };
        const opts = options as { cloudUrl: string; cloudKey: string };
        return central.commandSyncToCloud?.(opts.cloudUrl, opts.cloudKey);
    });
}
