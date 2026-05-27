import axios, { AxiosInstance } from 'axios';
import * as settings from 'electron-settings';

const TBA_BASE = 'https://www.thebluealliance.com/api/v3';

// API key shipped with XeroScout — same key used in v3
const DEFAULT_TBA_KEY = 'cgbzLmpXlA5GhIew3E4xswwLqHOm4j0hQ1Mizvg71zkuQZIazcXgf3dd8fguhpxC';

const SETTINGS_KEY = 'tba_api_key';

export interface BAEventInfo {
    key: string;
    name: string;
    city: string | null;
    state_prov: string | null;
    start_date: string;
    end_date: string;
}

export interface BATeam {
    team_number: number;
    nickname: string;
}

export interface BAMatch {
    comp_level: string;
    match_number: number;
    set_number: number;
    alliances: {
        red:  { team_keys: string[] };
        blue: { team_keys: string[] };
    };
    score_breakdown: unknown;
}

export interface BAOprData {
    oprs:  Record<string, number>;
    dprs:  Record<string, number>;
    ccwms: Record<string, number>;
}

export interface BARankingEntry {
    team_key: string;
    rank: number;
}

export interface BARankings {
    rankings: BARankingEntry[];
}

export class BlueAllianceClient {
    private readonly http: AxiosInstance;

    constructor() {
        this.http = axios.create({ baseURL: TBA_BASE, timeout: 15000 });
    }

    /** Returns the active TBA API key (user-saved key, or the built-in default). */
    async getApiKey(): Promise<string> {
        const saved = await settings.get(SETTINGS_KEY) as string | undefined;
        return (saved && saved.trim()) ? saved.trim() : DEFAULT_TBA_KEY;
    }

    /** Persist a new TBA API key in user settings. */
    async setApiKey(key: string): Promise<void> {
        await settings.set(SETTINGS_KEY, key);
    }

    async getEvents(year: number): Promise<BAEventInfo[]> {
        return this.request<BAEventInfo[]>(`/events/${year}/simple`);
    }

    async getTeams(eventKey: string): Promise<BATeam[]> {
        return this.request<BATeam[]>(`/event/${eventKey}/teams/simple`);
    }

    async getMatches(eventKey: string): Promise<BAMatch[]> {
        return this.request<BAMatch[]>(`/event/${eventKey}/matches/simple`);
    }

    async getOprs(eventKey: string): Promise<BAOprData> {
        return this.request<BAOprData>(`/event/${eventKey}/oprs`);
    }

    async getRankings(eventKey: string): Promise<BARankings> {
        return this.request<BARankings>(`/event/${eventKey}/rankings`);
    }

    private async request<T>(path: string): Promise<T> {
        const key = await this.getApiKey();
        const response = await this.http.get<T>(path, {
            headers: { 'X-TBA-Auth-Key': key },
        });
        return response.data;
    }
}

// Singleton for use across the main process
export const tbaClient = new BlueAllianceClient();
