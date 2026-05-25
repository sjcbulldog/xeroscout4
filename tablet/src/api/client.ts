import axios, { AxiosInstance } from 'axios';
import * as SecureStore from 'expo-secure-store';
import type {
    ApiEvent, ApiTeam, ApiMatch, ApiTablet, ApiTabletInitResponse,
    ApiSubmitResultRequest, ApiResultsResponse, ApiHealthResponse,
} from '@xeroscout4/shared';

const API_KEY_STORAGE_KEY = 'xeroscout_api_key';
const BASE_URL_STORAGE_KEY = 'xeroscout_base_url';

export class TabletApiClient {
    private http: AxiosInstance;
    private baseUrl = '';
    private apiKey = '';

    constructor() {
        this.http = axios.create();
        this.http.interceptors.request.use(cfg => {
            if (this.apiKey) {
                cfg.headers = cfg.headers ?? {};
                cfg.headers['Authorization'] = `Bearer ${this.apiKey}`;
            }
            return cfg;
        });
    }

    static async loadFromStorage(): Promise<TabletApiClient> {
        const client = new TabletApiClient();
        const [url, key] = await Promise.all([
            SecureStore.getItemAsync(BASE_URL_STORAGE_KEY),
            SecureStore.getItemAsync(API_KEY_STORAGE_KEY),
        ]);
        if (url) client.setBaseUrl(url);
        if (key) client.setApiKey(key);
        return client;
    }

    setBaseUrl(url: string) {
        this.baseUrl = url.replace(/\/$/, '');
        this.http.defaults.baseURL = `${this.baseUrl}/api/v1`;
    }

    setApiKey(key: string) { this.apiKey = key; }

    async persistConfig(): Promise<void> {
        await Promise.all([
            SecureStore.setItemAsync(BASE_URL_STORAGE_KEY, this.baseUrl),
            SecureStore.setItemAsync(API_KEY_STORAGE_KEY, this.apiKey),
        ]);
    }

    isConfigured(): boolean {
        return !!this.baseUrl && !!this.apiKey;
    }

    // ── Health ────────────────────────────────────────────────────────────────
    async health(): Promise<ApiHealthResponse> {
        return (await this.http.get<ApiHealthResponse>('/health')).data;
    }

    // ── Bootstrap ─────────────────────────────────────────────────────────────
    async getTabletInit(eventUuid: string, tabletName: string): Promise<ApiTabletInitResponse> {
        return (await this.http.get<ApiTabletInitResponse>(
            `/events/${eventUuid}/tablet-init/${encodeURIComponent(tabletName)}`
        )).data;
    }

    // ── Events ────────────────────────────────────────────────────────────────
    async listEvents(): Promise<ApiEvent[]> {
        return (await this.http.get<ApiEvent[]>('/events')).data;
    }

    async getEvent(uuid: string): Promise<ApiEvent> {
        return (await this.http.get<ApiEvent>(`/events/${uuid}`)).data;
    }

    async listTeams(eventUuid: string): Promise<ApiTeam[]> {
        return (await this.http.get<ApiTeam[]>(`/events/${eventUuid}/teams`)).data;
    }

    async listMatches(eventUuid: string): Promise<ApiMatch[]> {
        return (await this.http.get<ApiMatch[]>(`/events/${eventUuid}/matches`)).data;
    }

    async listTablets(eventUuid: string): Promise<ApiTablet[]> {
        return (await this.http.get<ApiTablet[]>(`/events/${eventUuid}/tablets`)).data;
    }

    // ── Results ───────────────────────────────────────────────────────────────
    async submitResult(eventUuid: string, req: ApiSubmitResultRequest): Promise<{ id: number; uploadedAt: string }> {
        return (await this.http.post<{ id: number; uploadedAt: string }>(
            `/events/${eventUuid}/results`, req
        )).data;
    }

    async getResults(eventUuid: string): Promise<ApiResultsResponse> {
        return (await this.http.get<ApiResultsResponse>(`/events/${eventUuid}/results`)).data;
    }
}

// Singleton instance — load config on first use
let _instance: TabletApiClient | null = null;
export async function getApiClient(): Promise<TabletApiClient> {
    if (!_instance) {
        _instance = await TabletApiClient.loadFromStorage();
    }
    return _instance;
}

export function resetApiClient() { _instance = null; }
