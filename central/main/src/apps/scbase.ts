import { BrowserWindow } from 'electron';
import * as settings from 'electron-settings';
import { Logger } from 'winston';
import { ApiClient } from '../server/api-client.js';
import { ApiEvent } from '@xeroscout4/shared';

export type AppType = 'central' | 'coach';

export interface NavItem {
    id: string;
    label: string;
    view: string;
    args?: unknown[];
    children?: NavItem[];
}

export abstract class SCBase {
    protected window: BrowserWindow | null = null;
    protected currentEventUuid: string | null = null;
    protected currentEvent: ApiEvent | null = null;
    protected readonly api: ApiClient;

    constructor(
        readonly appType: AppType,
        readonly serverBaseUrl: string,
        protected readonly logger: Logger,
    ) {
        this.api = new ApiClient(serverBaseUrl);
    }

    setWindow(win: BrowserWindow) { this.window = win; }

    async init(): Promise<void> {
        const splitter = await settings.get(`${this.appType}_splitter`) as number | undefined;
        this.sendToRenderer('xero-app-init', { type: this.appType, splitter: splitter ?? 220 });

        const lastUuid = await settings.get(`${this.appType}_last_event`) as string | undefined;
        if (lastUuid) {
            try {
                await this.loadEvent(lastUuid);
            } catch {
                // Last event no longer exists; proceed without it
            }
        }

        await this.sendNavData();
        this.updateStatus('', `XeroScout 4 (${this.appType})`, '');
    }

    protected sendToRenderer(channel: string, ...args: unknown[]) {
        this.window?.webContents.send(channel, ...args);
    }

    protected setView(view: string, ...args: unknown[]) {
        this.sendToRenderer('update-main-window-view', view, ...args);
    }

    protected updateStatus(left: string, middle: string, right: string) {
        this.sendToRenderer('send-app-status', { left, middle, right });
    }

    async sendNavData() {
        this.sendToRenderer('send-nav-data', this.buildNavData());
    }

    async splitterChanged(pos: number) {
        await settings.set(`${this.appType}_splitter`, pos);
    }

    protected async loadEvent(uuid: string): Promise<void> {
        this.currentEvent = await this.api.getEvent(uuid);
        this.currentEventUuid = uuid;
        await settings.set(`${this.appType}_last_event`, uuid);
        await this.onEventLoaded();
    }

    protected abstract onEventLoaded(): Promise<void>;
    abstract buildNavData(): NavItem[];

    async getInfoData(): Promise<Record<string, unknown>> {
        if (!this.currentEvent || !this.currentEventUuid) return {};
        const [teams, matches, results, tablets] = await Promise.all([
            this.api.listTeams(this.currentEventUuid).catch(() => []),
            this.api.listMatches(this.currentEventUuid).catch(() => []),
            this.api.getResults(this.currentEventUuid).catch(() => ({ results: [] })),
            this.api.listTablets(this.currentEventUuid).catch(() => []),
        ]);
        const resultList = (results as { results?: unknown[] }).results ?? [];
        return {
            event: {
                name: this.currentEvent.name,
                uuid: this.currentEvent.uuid,
                baEventKey: this.currentEvent.baEventKey ?? '—',
                locked: this.currentEvent.locked,
                year: this.currentEvent.year,
                startDate: this.currentEvent.startDate ?? '',
                endDate: this.currentEvent.endDate ?? '',
            },
            teams: (teams as unknown[]).length,
            matches: (matches as unknown[]).length,
            scoutedMatches: resultList.length,
            tablets,
        };
    }

    async setStatusOverlay(visible: boolean, text = '') {
        this.sendToRenderer('set-status-overlay', visible, text);
    }
}
