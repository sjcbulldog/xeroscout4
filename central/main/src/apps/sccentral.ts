import { dialog } from 'electron';
import * as settings from 'electron-settings';
import { Logger } from 'winston';
import { v4 as uuidv4 } from 'uuid';
import { SCBase, NavItem } from './scbase.js';

export class SCCentral extends SCBase {
    private cloudBaseUrl: string | null = null;
    private cloudApiKey: string | null = null;

    constructor(serverBaseUrl: string, logger: Logger) {
        super('central', serverBaseUrl, logger);
    }

    buildNavData(): NavItem[] {
        if (!this.currentEvent) {
            return [{ id: 'no-event', label: 'No Event Loaded', view: 'text', args: ['No event loaded. Use File → Create Event or File → Open Event.'] }];
        }

        const locked = this.currentEvent.locked;
        return [
            {
                id: 'general', label: 'General', view: '', children: [
                    { id: 'info',  label: 'Event Info',      view: 'info' },
                    { id: 'help',  label: 'Help',             view: 'text', args: ['Help coming soon.'] },
                    { id: 'about', label: 'About',            view: 'text', args: ['XeroScout 4.0'] },
                ],
            },
            {
                id: 'setup', label: 'Event Setup', view: '', children: [
                    ...(!locked ? [{ id: 'assign-tablets', label: 'Assign Tablets', view: 'assign-tablets' }] : []),
                    { id: 'datasets',  label: 'Datasets',    view: 'datasets' },
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
                    { id: 'formulas',    label: 'Formulas',        view: 'formulas' },
                    { id: 'picklist',    label: 'Pick List',       view: 'picklist' },
                    { id: 'singleteam',  label: 'Single Team View',view: 'singleteam' },
                ],
            },
        ];
    }

    protected async onEventLoaded(): Promise<void> {
        this.updateStatus(
            '',
            `XeroScout 4 — ${this.currentEvent!.name}`,
            this.currentEvent!.locked ? 'LOCKED' : 'Unlocked',
        );
        await this.sendNavData();
    }

    // ── Commands (invoked via IPC execute-command) ────────────────────────────

    async commandCreateEvent(): Promise<void> {
        const result = await dialog.showSaveDialog({
            title: 'Create New Event',
            buttonLabel: 'Create',
            filters: [{ name: 'XeroScout Event', extensions: ['xse'] }],
        });
        if (result.canceled || !result.filePath) return;

        const name = await this.promptString('Event Name', 'Enter a name for this event', 'New Event');
        if (!name) return;

        const year = new Date().getFullYear();
        const event = await this.api.createEvent({ name, year });
        await this.loadEvent(event.uuid);
        this.setView('info');
    }

    async commandOpenEvent(): Promise<void> {
        // Show list of events from the local server
        const events = await this.api.listEvents();
        this.setView('select-event', events);
    }

    async commandSelectEvent(uuid: string): Promise<void> {
        await this.loadEvent(uuid);
        this.setView('info');
    }

    async commandLockEvent(): Promise<void> {
        if (!this.currentEventUuid) return;
        await this.api.updateEvent(this.currentEventUuid, { locked: true });
        this.currentEvent = await this.api.getEvent(this.currentEventUuid);
        await this.onEventLoaded();
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
            this.api.baTeams(year, baKey),
            this.api.baMatches(year, baKey),
            this.api.baOprs(year, baKey),
            this.api.baRankings(year, baKey),
        ]);

        // Map TBA teams → ApiTeam[]
        const oprMap = oprs.oprs as Record<string, number> ?? {};
        const dprMap = oprs.dprs as Record<string, number> ?? {};
        const ccwmMap = oprs.ccwms as Record<string, number> ?? {};
        const rankMap: Record<number, number> = {};
        if (rankings?.rankings) {
            for (const r of rankings.rankings as Array<{ team_key: string; rank: number }>) {
                rankMap[parseInt(r.team_key.replace('frc', ''))] = r.rank;
            }
        }

        const teams = teamsData.map((t: { team_number: number; nickname: string }) => ({
            teamNumber: t.team_number,
            nickname: t.nickname ?? '',
            opr: oprMap[`frc${t.team_number}`] ?? null,
            dpr: dprMap[`frc${t.team_number}`] ?? null,
            ccwm: ccwmMap[`frc${t.team_number}`] ?? null,
            rank: rankMap[t.team_number] ?? null,
            epa: null,
        }));

        await this.api.upsertTeams(this.currentEventUuid!, { teams });

        // Map TBA matches → ApiMatch[]
        const matches = matchesData.map((m: { comp_level: string; match_number: number; set_number: number; alliances: { red: { team_keys: string[] }; blue: { team_keys: string[] } }; score_breakdown: null }) => ({
            compLevel: m.comp_level as 'qm' | 'sf' | 'f',
            matchNumber: m.match_number,
            setNumber: m.set_number,
            red1: parseInt(m.alliances.red.team_keys[0].replace('frc', '')),
            red2: parseInt(m.alliances.red.team_keys[1].replace('frc', '')),
            red3: parseInt(m.alliances.red.team_keys[2].replace('frc', '')),
            blue1: parseInt(m.alliances.blue.team_keys[0].replace('frc', '')),
            blue2: parseInt(m.alliances.blue.team_keys[1].replace('frc', '')),
            blue3: parseInt(m.alliances.blue.team_keys[2].replace('frc', '')),
            redScore: null,
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
