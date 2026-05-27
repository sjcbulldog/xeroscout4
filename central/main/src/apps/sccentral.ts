import { dialog, Menu, MenuItem } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import * as settings from 'electron-settings';
import { Logger } from 'winston';
import { v4 as uuidv4 } from 'uuid';
import { SCBase, NavItem } from './scbase.js';
import { tbaClient, BAOprData, BARankings } from '../extnet/blue-alliance-client.js';

export class SCCentral extends SCBase {
    private cloudBaseUrl: string | null = null;
    private cloudApiKey: string | null = null;
    private menuItems = new Map<string, MenuItem>();

    constructor(serverBaseUrl: string, logger: Logger) {
        super('central', serverBaseUrl, logger);
    }

    buildNavData(): NavItem[] {
        if (!this.currentEvent) {
            return [{ id: 'no-event', label: 'No Event Loaded', view: 'startup' }];
        }

        const locked = this.currentEvent.locked;
        const nav: NavItem[] = [
            {
                id: 'general', label: 'General', view: '', children: [
                    { id: 'info',  label: 'Event Info',      view: 'info' },
                    { id: 'help',  label: 'Help',             view: 'text', args: ['Help coming soon.'] },
                    { id: 'about', label: 'About',            view: 'text', args: ['XeroScout 4.0'] },
                ],
            },
        ];

        if (!locked) {
            nav.push({
                id: 'event-setup-group', label: 'Event Setup', view: '', children: [
                    { id: 'setup-wizard',    label: 'Setup Wizard',    view: 'event-setup' },
                    { id: 'edit-teams-nav',  label: 'Edit Teams',      view: 'edit-teams' },
                    { id: 'assign-tablets',  label: 'Assign Tablets',  view: 'assign-tablets' },
                    { id: 'team-form-edit',  label: 'Edit Team Form',  view: 'form-json', args: ['team'] },
                    { id: 'match-form-edit', label: 'Edit Match Form', view: 'form-json', args: ['match'] },
                ],
            });
        }

        nav.push(
            {
                id: 'setup', label: 'Configuration', view: '', children: [
                    { id: 'datasets',   label: 'Datasets',   view: 'datasets' },
                    { id: 'cloud-sync', label: 'Cloud Sync', view: 'sync-config' },
                ],
            },
            {
                id: 'teams', label: 'Teams', view: '', children: [
                    { id: 'team-form',   label: 'Team Form',   view: 'form-view',   args: ['team'] },
                    { id: 'team-status', label: 'Team Status', view: 'team-status' },
                    { id: 'team-data',   label: 'Team Data',   view: 'team-db' },
                ],
            },
            {
                id: 'match', label: 'Match', view: '', children: [
                    { id: 'match-form',   label: 'Match Form',   view: 'form-view',   args: ['match'] },
                    { id: 'match-status', label: 'Match Status', view: 'match-status' },
                    { id: 'match-data',   label: 'Match Data',   view: 'match-db' },
                ],
            },
            { id: 'playoffs',  label: 'Playoffs',  view: 'playoffs' },
            {
                id: 'analysis', label: 'Analysis', view: '', children: [
                    { id: 'formulas',   label: 'Formulas',         view: 'formulas' },
                    { id: 'picklist',   label: 'Pick List',        view: 'picklist' },
                    { id: 'singleteam', label: 'Single Team View', view: 'singleteam' },
                ],
            },
        );

        return nav;
    }

    protected async onEventLoaded(): Promise<void> {
        this.window?.setTitle(`XeroScout4 - ${this.currentEvent!.name}`);
        this.updateStatus(
            '',
            `XeroScout 4 — ${this.currentEvent!.name}`,
            this.currentEvent!.locked ? 'LOCKED' : 'Unlocked',
        );
        await this.sendNavData();
        this.updateMenuState(true);
    }

    async commandCloseEvent(): Promise<void> {
        this.currentEvent = null;
        this.currentEventUuid = null;
        await settings.unset(`${this.appType}_last_event`);
        this.window?.setTitle('XeroScout4');
        this.updateStatus('', 'XeroScout 4 (central)', '');
        await this.sendNavData();
        this.setView('startup');
        this.updateMenuState(false);
    }

    private updateMenuState(hasEvent: boolean): void {
        const eventItems = [
            'file/close',
            'data/import-ba',
            'data/import-statbotics',
            'data/export-team',
            'data/export-match',
            'data/import-formulas',
            'data/export-formulas',
        ];
        for (const key of eventItems) {
            const item = this.menuItems.get(key);
            if (item) item.enabled = hasEvent;
        }
    }

    createMenu(): Menu {
        const menu = new Menu();

        // ── File ──────────────────────────────────────────────────────────────
        const fileMenu = new MenuItem({ type: 'submenu', label: 'File', submenu: new Menu() });

        const createItem = new MenuItem({
            type: 'normal', label: 'Create Event …',
            click: () => void this.commandCreateEvent(),
        });
        fileMenu.submenu!.append(createItem);

        const openItem = new MenuItem({
            type: 'normal', label: 'Open Event …',
            click: () => void this.commandOpenEvent(),
        });
        fileMenu.submenu!.append(openItem);

        fileMenu.submenu!.append(new MenuItem({ type: 'separator' }));

        const closeItem = new MenuItem({
            type: 'normal', label: 'Close Event', enabled: false,
            click: () => void this.commandCloseEvent(),
        });
        fileMenu.submenu!.append(closeItem);
        this.menuItems.set('file/close', closeItem);

        fileMenu.submenu!.append(new MenuItem({ type: 'separator' }));
        fileMenu.submenu!.append(new MenuItem({ type: 'normal', role: 'quit' }));

        menu.append(fileMenu);

        // ── Data ──────────────────────────────────────────────────────────────
        const dataMenu = new MenuItem({ type: 'submenu', label: 'Data', submenu: new Menu() });

        const importBAItem = new MenuItem({
            type: 'normal', label: 'Import Data From Blue Alliance', enabled: false,
            click: () => void this.commandImportFromBA(),
        });
        dataMenu.submenu!.append(importBAItem);
        this.menuItems.set('data/import-ba', importBAItem);

        const importSTItem = new MenuItem({
            type: 'normal', label: 'Import Data From Statbotics', enabled: false,
            click: () => void this.commandImportStatbotics(),
        });
        dataMenu.submenu!.append(importSTItem);
        this.menuItems.set('data/import-statbotics', importSTItem);

        dataMenu.submenu!.append(new MenuItem({ type: 'separator' }));

        const exportTeamItem = new MenuItem({
            type: 'normal', label: 'Export Team Data', enabled: false,
            click: () => void this.commandExportTeamData(),
        });
        dataMenu.submenu!.append(exportTeamItem);
        this.menuItems.set('data/export-team', exportTeamItem);

        const exportMatchItem = new MenuItem({
            type: 'normal', label: 'Export Match Data', enabled: false,
            click: () => void this.commandExportMatchData(),
        });
        dataMenu.submenu!.append(exportMatchItem);
        this.menuItems.set('data/export-match', exportMatchItem);

        dataMenu.submenu!.append(new MenuItem({ type: 'separator' }));

        const importFormulasItem = new MenuItem({
            type: 'normal', label: 'Import Formulas', enabled: false,
            click: () => void this.commandImportFormulas(),
        });
        dataMenu.submenu!.append(importFormulasItem);
        this.menuItems.set('data/import-formulas', importFormulasItem);

        const exportFormulasItem = new MenuItem({
            type: 'normal', label: 'Export Formulas', enabled: false,
            click: () => void this.commandExportFormulas(),
        });
        dataMenu.submenu!.append(exportFormulasItem);
        this.menuItems.set('data/export-formulas', exportFormulasItem);

        menu.append(dataMenu);

        // ── View ──────────────────────────────────────────────────────────────
        menu.append(new MenuItem({ type: 'submenu', role: 'viewMenu' }));

        // ── Help ──────────────────────────────────────────────────────────────
        const helpMenu = new MenuItem({ type: 'submenu', label: 'Help', submenu: new Menu() });
        helpMenu.submenu!.append(new MenuItem({
            type: 'normal', label: 'About',
            click: () => {
                void dialog.showMessageBox({
                    type: 'info',
                    title: 'About XeroScout 4',
                    message: 'XeroScout 4',
                    detail: 'FRC Scouting System\nVersion 4.0.0',
                    buttons: ['OK'],
                });
            },
        }));
        menu.append(helpMenu);

        return menu;
    }

    // ── Export / Import helpers ───────────────────────────────────────────────

    private async commandExportTeamData(): Promise<void> {
        if (!this.currentEventUuid) return;
        const result = await dialog.showSaveDialog({
            title: 'Export Team Data',
            defaultPath: 'team-data.csv',
            filters: [{ name: 'CSV', extensions: ['csv'] }],
        });
        if (result.canceled || !result.filePath) return;
        const teams = await this.api.listTeams(this.currentEventUuid) as Record<string, unknown>[];
        if (!teams.length) return;
        const headers = Object.keys(teams[0]);
        const rows = teams.map(t => headers.map(h => JSON.stringify(t[h] ?? '')).join(','));
        fs.writeFileSync(result.filePath, [headers.join(','), ...rows].join('\n'), 'utf8');
    }

    private async commandExportMatchData(): Promise<void> {
        if (!this.currentEventUuid) return;
        const result = await dialog.showSaveDialog({
            title: 'Export Match Data',
            defaultPath: 'match-data.csv',
            filters: [{ name: 'CSV', extensions: ['csv'] }],
        });
        if (result.canceled || !result.filePath) return;
        const matches = await this.api.listMatches(this.currentEventUuid) as Record<string, unknown>[];
        if (!matches.length) return;
        const headers = Object.keys(matches[0]);
        const rows = matches.map(m => headers.map(h => JSON.stringify(m[h] ?? '')).join(','));
        fs.writeFileSync(result.filePath, [headers.join(','), ...rows].join('\n'), 'utf8');
    }

    private async commandImportFormulas(): Promise<void> {
        if (!this.currentEventUuid) return;
        const result = await dialog.showOpenDialog({
            title: 'Import Formulas',
            filters: [{ name: 'JSON', extensions: ['json'] }],
            properties: ['openFile'],
        });
        if (result.canceled || !result.filePaths.length) return;
        try {
            const data = JSON.parse(fs.readFileSync(result.filePaths[0], 'utf8'));
            const formulas: unknown[] = Array.isArray(data) ? data : data.formulas ?? [];
            await this.api.upsertFormulas(this.currentEventUuid, formulas);
        } catch (err) {
            await dialog.showErrorBox('Import Formulas', `Failed to import: ${(err as Error).message}`);
        }
    }

    private async commandExportFormulas(): Promise<void> {
        if (!this.currentEventUuid) return;
        const result = await dialog.showSaveDialog({
            title: 'Export Formulas',
            defaultPath: 'formulas.json',
            filters: [{ name: 'JSON', extensions: ['json'] }],
        });
        if (result.canceled || !result.filePath) return;
        const formulas = await this.api.getFormulas(this.currentEventUuid);
        fs.writeFileSync(result.filePath, JSON.stringify(formulas, null, 2), 'utf8');
    }

    // ── Commands (invoked via IPC execute-command) ────────────────────────────

    async commandDeleteEvent(uuid: string): Promise<unknown[] | null> {
        const events = await this.api.listEvents() as Array<{ uuid: string; name: string }>;
        const ev = events.find(e => e.uuid === uuid);
        const name = ev?.name ?? uuid;
        const { response } = await dialog.showMessageBox({
            type: 'warning',
            title: 'Delete Event',
            message: `Delete "${name}"?`,
            detail: 'This will permanently delete the event and all associated data. This cannot be undone.',
            buttons: ['Delete', 'Cancel'],
            defaultId: 1,
            cancelId: 1,
        });
        if (response !== 0) return null;
        if (this.currentEventUuid === uuid) await this.commandCloseEvent();
        await this.api.deleteEvent(uuid);
        return this.api.listEvents();
    }

    async commandCreateEvent(): Promise<void> {
        this.setView('create-event');
    }

    async commandCreateEventDetails(details: {
        name: string;
        year: number;
        baEventKey?: string;
        startDate?: string;
        endDate?: string;
    }): Promise<void> {
        // Check for an existing event with the same BA event key
        const baKey = details.baEventKey?.trim();
        if (baKey) {
            const existing = (await this.api.listEvents() as Array<{ uuid: string; name: string; baEventKey: string | null }>)
                .find(ev => ev.baEventKey === baKey);
            if (existing) {
                const { response } = await dialog.showMessageBox({
                    type: 'question',
                    title: 'Event Already Exists',
                    message: `An event with BA code "${baKey}" already exists: "${existing.name}".`,
                    detail: 'Would you like to open the existing event instead of creating a new one?',
                    buttons: ['Open Existing Event', 'Create New Event Anyway', 'Cancel'],
                    defaultId: 0,
                    cancelId: 2,
                });
                if (response === 0) {
                    await this.loadEvent(existing.uuid);
                    this.setView(this.currentEvent?.locked ? 'info' : 'event-setup');
                    return;
                }
                if (response === 2) return; // Cancel — go back to create-event view
            }
        }

        const event = await this.api.createEvent(details);
        await this.loadEvent(event.uuid);

        if (baKey) {
            await this.setStatusOverlay(true, 'Fetching teams and schedule from The Blue Alliance…');
            try {
                await this.importBADataForNewEvent(baKey, details.year);
            } catch (err) {
                this.logger.warn('Failed to import BA data during event creation', { error: String(err) });
            } finally {
                await this.setStatusOverlay(false);
            }
        }

        this.setView('event-setup');
    }

    private async importBADataForNewEvent(baKey: string, year: number): Promise<void> {
        // Teams are mandatory — let this throw if it fails
        const [teamsData, oprs, rankings] = await Promise.all([
            tbaClient.getTeams(baKey),
            tbaClient.getOprs(baKey).catch(() => ({ oprs: {}, dprs: {}, ccwms: {} } as BAOprData)),
            tbaClient.getRankings(baKey).catch(() => ({ rankings: [] } as BARankings)),
        ]);

        const oprMap  = oprs.oprs  ?? {};
        const dprMap  = oprs.dprs  ?? {};
        const ccwmMap = oprs.ccwms ?? {};
        const rankMap: Record<number, number> = {};
        if (rankings?.rankings) {
            for (const r of rankings.rankings) {
                rankMap[parseInt(r.team_key.replace('frc', ''))] = r.rank;
            }
        }

        const teams = teamsData.map(t => ({
            teamNumber: t.team_number,
            nickname: t.nickname ?? '',
            opr:  oprMap[`frc${t.team_number}`]  ?? null,
            dpr:  dprMap[`frc${t.team_number}`]  ?? null,
            ccwm: ccwmMap[`frc${t.team_number}`] ?? null,
            rank: rankMap[t.team_number]          ?? null,
            epa:  null,
        }));
        await this.api.upsertTeams(this.currentEventUuid!, { teams });
        this.logger.info('Imported teams from Blue Alliance', { count: teams.length });

        // Match schedule is optional — it may not be published yet
        try {
            const matchesData = await tbaClient.getMatches(baKey);
            if (matchesData.length > 0) {
                const matches = matchesData.map(m => ({
                    compLevel:   m.comp_level as 'qm' | 'sf' | 'f',
                    matchNumber: m.match_number,
                    setNumber:   m.set_number,
                    red1:  parseInt(m.alliances.red.team_keys[0].replace('frc', '')),
                    red2:  parseInt(m.alliances.red.team_keys[1].replace('frc', '')),
                    red3:  parseInt(m.alliances.red.team_keys[2].replace('frc', '')),
                    blue1: parseInt(m.alliances.blue.team_keys[0].replace('frc', '')),
                    blue2: parseInt(m.alliances.blue.team_keys[1].replace('frc', '')),
                    blue3: parseInt(m.alliances.blue.team_keys[2].replace('frc', '')),
                    redScore:  null,
                    blueScore: null,
                }));
                await this.api.upsertMatches(this.currentEventUuid!, { matches });
                this.logger.info('Imported match schedule from Blue Alliance', { count: matches.length });
            } else {
                this.logger.info('Match schedule not yet available from Blue Alliance', { baKey });
            }
        } catch (err) {
            this.logger.info('Match schedule not yet available from Blue Alliance', { baKey, reason: String(err) });
        }
    }

    async commandOpenEvent(): Promise<void> {
        const events = await this.api.listEvents();
        this.setView('select-event', events);
    }

    async commandSelectEvent(uuid: string): Promise<void> {
        await this.loadEvent(uuid);
        this.setView(this.currentEvent?.locked ? 'info' : 'event-setup');
    }

    async commandLockEvent(): Promise<void> {
        if (!this.currentEventUuid) return;

        const [teams, tablets] = await Promise.all([
            this.api.listTeams(this.currentEventUuid),
            this.api.listTablets(this.currentEventUuid),
        ]);

        const teamList  = teams  as Array<{ teamNumber: number }>;
        const tabletList = tablets as Array<{ name: string; purpose: string }>;

        if (teamList.length <= 18) {
            await dialog.showMessageBox({
                type: 'warning', title: 'Cannot Lock Event',
                message: `Need more than 18 teams to lock (have ${teamList.length}).`,
                buttons: ['OK'],
            });
            return;
        }
        const matchTablets = tabletList.filter(t => t.purpose === 'match').length;
        const teamTablets  = tabletList.filter(t => t.purpose === 'team').length;
        if (matchTablets < 6) {
            await dialog.showMessageBox({
                type: 'warning', title: 'Cannot Lock Event',
                message: `Need at least 6 match scouting tablets (have ${matchTablets}).`,
                buttons: ['OK'],
            });
            return;
        }
        if (teamTablets < 1) {
            await dialog.showMessageBox({
                type: 'warning', title: 'Cannot Lock Event',
                message: 'Need at least 1 team scouting tablet.',
                buttons: ['OK'],
            });
            return;
        }
        if (!this.currentEvent?.teamFormJson) {
            await dialog.showMessageBox({
                type: 'warning', title: 'Cannot Lock Event',
                message: 'Team scouting form has not been set.',
                buttons: ['OK'],
            });
            return;
        }
        if (!this.currentEvent?.matchFormJson) {
            await dialog.showMessageBox({
                type: 'warning', title: 'Cannot Lock Event',
                message: 'Match scouting form has not been set.',
                buttons: ['OK'],
            });
            return;
        }

        await this.api.updateEvent(this.currentEventUuid, { locked: true });
        this.currentEvent = await this.api.getEvent(this.currentEventUuid);
        await this.onEventLoaded();
        this.setView('info');
    }

    async commandSaveTablets(tablets: Array<{ name: string; purpose: string }>): Promise<void> {
        if (!this.currentEventUuid) return;
        await this.api.upsertTablets(this.currentEventUuid, {
            tablets: tablets.map(t => ({ name: t.name, purpose: t.purpose, assignments: [] })),
        });
        this.setView('event-setup');
    }

    async commandSaveTeams(teams: Array<{ teamNumber: number; nickname: string }>): Promise<void> {
        if (!this.currentEventUuid) return;
        await this.api.upsertTeams(this.currentEventUuid, {
            teams: teams.map(t => ({
                teamNumber: t.teamNumber,
                nickname: t.nickname,
                opr: null, dpr: null, ccwm: null, rank: null, epa: null,
            })),
        });
        this.setView('event-setup');
    }

    async commandSaveFormJson(purpose: 'team' | 'match', json: string): Promise<void> {
        if (!this.currentEventUuid) return;
        const key = purpose === 'team' ? 'teamFormJson' : 'matchFormJson';
        await this.api.updateEvent(this.currentEventUuid, { [key]: json });
        this.currentEvent = await this.api.getEvent(this.currentEventUuid);
        this.setView('event-setup');
    }

    async commandShowView(view: string, ...args: unknown[]): Promise<void> {
        this.setView(view, ...args);
    }

    async commandImportFromBA(): Promise<void> {
        if (!this.currentEventUuid) return;
        try {
            await this.setStatusOverlay(true, 'Loading from Blue Alliance...');
            const year = this.currentEvent!.year;
            const baKey = this.currentEvent!.baEventKey;
            if (!baKey) {
                this.setView('select-event-ba', { year });
                return;
            }
            await this.importBAData(baKey, year);
        } finally {
            await this.setStatusOverlay(false);
        }
    }

    private async importBAData(baKey: string, year: number): Promise<void> {
        const [teamsData, matchesData, oprs, rankings] = await Promise.all([
            tbaClient.getTeams(baKey),
            tbaClient.getMatches(baKey),
            tbaClient.getOprs(baKey).catch(() => ({ oprs: {}, dprs: {}, ccwms: {} } as BAOprData)),
            tbaClient.getRankings(baKey).catch(() => ({ rankings: [] } as BARankings)),
        ]);

        // Map TBA teams → ApiTeam[]
        const oprMap  = oprs.oprs  ?? {};
        const dprMap  = oprs.dprs  ?? {};
        const ccwmMap = oprs.ccwms ?? {};
        const rankMap: Record<number, number> = {};
        if (rankings?.rankings) {
            for (const r of rankings.rankings) {
                rankMap[parseInt(r.team_key.replace('frc', ''))] = r.rank;
            }
        }

        const teams = teamsData.map(t => ({
            teamNumber: t.team_number,
            nickname: t.nickname ?? '',
            opr:  oprMap[`frc${t.team_number}`]  ?? null,
            dpr:  dprMap[`frc${t.team_number}`]  ?? null,
            ccwm: ccwmMap[`frc${t.team_number}`] ?? null,
            rank: rankMap[t.team_number]          ?? null,
            epa:  null,
        }));

        await this.api.upsertTeams(this.currentEventUuid!, { teams });

        // Map TBA matches → ApiMatch[]
        const matches = matchesData.map(m => ({
            compLevel:   m.comp_level as 'qm' | 'sf' | 'f',
            matchNumber: m.match_number,
            setNumber:   m.set_number,
            red1:  parseInt(m.alliances.red.team_keys[0].replace('frc', '')),
            red2:  parseInt(m.alliances.red.team_keys[1].replace('frc', '')),
            red3:  parseInt(m.alliances.red.team_keys[2].replace('frc', '')),
            blue1: parseInt(m.alliances.blue.team_keys[0].replace('frc', '')),
            blue2: parseInt(m.alliances.blue.team_keys[1].replace('frc', '')),
            blue3: parseInt(m.alliances.blue.team_keys[2].replace('frc', '')),
            redScore:  null,
            blueScore: null,
        }));

        await this.api.upsertMatches(this.currentEventUuid!, { matches });
        this.logger.info('Imported Blue Alliance data', { teams: teams.length, matches: matches.length });
    }

    async commandImportStatbotics(): Promise<void> {
        if (!this.currentEventUuid) return;
        await this.setStatusOverlay(true, 'Loading from Statbotics...');
        try {
            const year = this.currentEvent!.year;
            const data = await this.api.statboticsTeams(year);
            // data is array of { team, epa: { mean } }
            const existingTeams = await this.api.listTeams(this.currentEventUuid);
            const epaMap: Record<number, number> = {};
            for (const t of data as Array<{ team: number; epa: { mean: number } }>) {
                epaMap[t.team] = t.epa?.mean ?? 0;
            }
            const updated = existingTeams.map((t: { teamNumber: number; nickname: string; opr: number | null; dpr: number | null; ccwm: number | null; rank: number | null }) => ({
                ...t,
                epa: epaMap[t.teamNumber] ?? null,
            }));
            await this.api.upsertTeams(this.currentEventUuid, { teams: updated });
        } finally {
            await this.setStatusOverlay(false);
        }
    }

    async commandSyncToCloud(cloudUrl: string, cloudKey: string): Promise<void> {
        if (!this.currentEventUuid) return;
        await settings.set('cloud_url', cloudUrl);
        await settings.set('cloud_api_key', cloudKey);
        this.cloudBaseUrl = cloudUrl;
        this.cloudApiKey = cloudKey;
        // TODO: implement bidirectional sync via SyncService
        this.logger.info('Cloud sync initiated', { cloudUrl });
    }

    private async promptString(title: string, message: string, defaultValue?: string): Promise<string | undefined> {
        return new Promise(resolve => {
            const id = uuidv4();
            this.sendToRenderer('prompt-string-request', { id, title, message, defaultValue });
            this.window?.webContents.once('ipc-message', (_event, channel, reqId, value) => {
                if (channel === 'prompt-string-response' && reqId === id) {
                    resolve(value as string | undefined);
                }
            });
        });
    }
}
