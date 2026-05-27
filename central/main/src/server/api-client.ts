import axios, { AxiosInstance } from 'axios';

export class ApiClient {
    private readonly http: AxiosInstance;
    private apiKey = '';

    constructor(baseUrl: string) {
        this.http = axios.create({ baseURL: `${baseUrl}/api/v1` });
        this.http.interceptors.request.use(cfg => {
            if (this.apiKey) {
                cfg.headers = cfg.headers ?? {};
                cfg.headers['Authorization'] = `Bearer ${this.apiKey}`;
            }
            return cfg;
        });
    }

    setApiKey(key: string) { this.apiKey = key; }
    clearApiKey()          { this.apiKey = ''; }

    // ── Health ────────────────────────────────────────────────────────────────
    async health()              { return (await this.http.get('/health')).data; }

    // ── Events ────────────────────────────────────────────────────────────────
    async listEvents()          { return (await this.http.get('/events')).data; }
    async createEvent(body: unknown) { return (await this.http.post('/events', body)).data; }
    async getEvent(uuid: string) { return (await this.http.get(`/events/${uuid}`)).data; }
    async updateEvent(uuid: string, body: unknown) { return (await this.http.put(`/events/${uuid}`, body)).data; }

    async deleteEvent(uuid: string) { return (await this.http.delete(`/events/${uuid}`)).data; }

    // ── Teams ─────────────────────────────────────────────────────────────────
    async listTeams(uuid: string)          { return (await this.http.get(`/events/${uuid}/teams`)).data; }
    async upsertTeams(uuid: string, body: unknown) { return (await this.http.put(`/events/${uuid}/teams`, body)).data; }

    // ── Matches ───────────────────────────────────────────────────────────────
    async listMatches(uuid: string)          { return (await this.http.get(`/events/${uuid}/matches`)).data; }
    async upsertMatches(uuid: string, body: unknown) { return (await this.http.put(`/events/${uuid}/matches`, body)).data; }

    // ── Tablets ───────────────────────────────────────────────────────────────
    async listTablets(uuid: string)          { return (await this.http.get(`/events/${uuid}/tablets`)).data; }
    async upsertTablets(uuid: string, body: unknown) { return (await this.http.put(`/events/${uuid}/tablets`, body)).data; }

    // ── Scouting ──────────────────────────────────────────────────────────────
    async getResults(uuid: string)      { return (await this.http.get(`/events/${uuid}/results`)).data; }
    async getRawResults(uuid: string)   { return (await this.http.get(`/events/${uuid}/results/raw`)).data; }
    async submitResult(uuid: string, body: unknown) { return (await this.http.post(`/events/${uuid}/results`, body)).data; }

    // ── Corrections ───────────────────────────────────────────────────────────
    async listCorrections(uuid: string)  { return (await this.http.get(`/events/${uuid}/corrections`)).data; }
    async submitCorrection(uuid: string, body: unknown) { return (await this.http.post(`/events/${uuid}/corrections`, body)).data; }
    async deleteCorrection(uuid: string, id: number) { return (await this.http.delete(`/events/${uuid}/corrections/${id}`)).data; }

    // ── Analysis ──────────────────────────────────────────────────────────────
    async getFormulas(uuid: string)          { return (await this.http.get(`/events/${uuid}/formulas`)).data; }
    async upsertFormulas(uuid: string, body: unknown) { return (await this.http.put(`/events/${uuid}/formulas`, body)).data; }
    async getDatasets(uuid: string)          { return (await this.http.get(`/events/${uuid}/datasets`)).data; }
    async upsertDatasets(uuid: string, body: unknown) { return (await this.http.put(`/events/${uuid}/datasets`, body)).data; }
    async getGraphs(uuid: string)            { return (await this.http.get(`/events/${uuid}/graphs`)).data; }
    async upsertGraphs(uuid: string, body: unknown) { return (await this.http.put(`/events/${uuid}/graphs`, body)).data; }
    async getPicklists(uuid: string)         { return (await this.http.get(`/events/${uuid}/picklists`)).data; }
    async upsertPicklists(uuid: string, body: unknown) { return (await this.http.put(`/events/${uuid}/picklists`, body)).data; }
    async getPicklistData(uuid: string, name: string) { return (await this.http.get(`/events/${uuid}/picklists/${encodeURIComponent(name)}/data`)).data; }
    async getPlayoff(uuid: string)           { return (await this.http.get(`/events/${uuid}/playoff`)).data; }
    async setPlayoff(uuid: string, body: unknown) { return (await this.http.put(`/events/${uuid}/playoff`, body)).data; }

    // ── Sync ──────────────────────────────────────────────────────────────────
    async syncDelta(since: string)      { return (await this.http.get(`/sync/delta?since=${encodeURIComponent(since)}`)).data; }
    async syncPush(body: unknown)       { return (await this.http.post('/sync/push', body)).data; }
    async syncResolve(body: unknown)    { return (await this.http.post('/sync/resolve-conflict', body)).data; }

    // ── External data ─────────────────────────────────────────────────────────
    async baEvents(year: number)        { return (await this.http.get(`/extnet/ba/events/${year}`)).data; }
    async baTeams(year: number, key: string) { return (await this.http.get(`/extnet/ba/events/${year}/${key}/teams`)).data; }
    async baMatches(year: number, key: string) { return (await this.http.get(`/extnet/ba/events/${year}/${key}/matches`)).data; }
    async baOprs(year: number, key: string) { return (await this.http.get(`/extnet/ba/events/${year}/${key}/oprs`)).data; }
    async baRankings(year: number, key: string) { return (await this.http.get(`/extnet/ba/events/${year}/${key}/rankings`)).data; }
    async statboticsTeams(year: number) { return (await this.http.get(`/extnet/statbotics/teams/${year}`)).data; }

    // ── Images ────────────────────────────────────────────────────────────────
    async listImages(uuid: string)       { return (await this.http.get(`/events/${uuid}/images`)).data; }
    async getImageData(uuid: string, name: string) { return (await this.http.get(`/events/${uuid}/images/${encodeURIComponent(name)}`)).data; }
    async uploadImage(uuid: string, body: unknown) { return (await this.http.post(`/events/${uuid}/images`, body)).data; }
}
