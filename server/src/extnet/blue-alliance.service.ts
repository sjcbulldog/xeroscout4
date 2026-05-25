import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class BlueAllianceService {
    private readonly client: AxiosInstance = axios.create({
        baseURL: 'https://www.thebluealliance.com/api/v3',
        timeout: 10000,
    });

    async getEvents(year: number): Promise<Array<{ key: string; name: string; city: string | null; state_prov: string | null; start_date: string; end_date: string }> | null> {
        const data = await this.request<Array<Record<string, unknown>>>(`/events/${year}/simple`);
        return data?.map(event => ({
            key: String(event.key ?? ''),
            name: String(event.name ?? ''),
            city: event.city ? String(event.city) : null,
            state_prov: event.state_prov ? String(event.state_prov) : null,
            start_date: String(event.start_date ?? ''),
            end_date: String(event.end_date ?? ''),
        })) ?? null;
    }

    async getTeams(eventKey: string): Promise<Array<{ team_number: number; nickname: string }> | null> {
        const data = await this.request<Array<Record<string, unknown>>>(`/event/${eventKey}/teams/simple`);
        return data?.map(team => ({
            team_number: Number(team.team_number ?? 0),
            nickname: typeof team.nickname === 'string' ? team.nickname : '',
        })) ?? null;
    }

    getMatches(eventKey: string): Promise<unknown[] | null> {
        return this.request<unknown[]>(`/event/${eventKey}/matches/simple`);
    }

    getOprs(eventKey: string): Promise<Record<string, unknown> | null> {
        return this.request<Record<string, unknown>>(`/event/${eventKey}/oprs`);
    }

    getRankings(eventKey: string): Promise<Record<string, unknown> | null> {
        return this.request<Record<string, unknown>>(`/event/${eventKey}/rankings`);
    }

    private async request<T>(path: string): Promise<T | null> {
        const apiKey = process.env.TBA_API_KEY;
        if (!apiKey) {
            return null;
        }

        const response = await this.client.get<T>(path, {
            headers: { 'X-TBA-Auth-Key': apiKey },
        });
        return response.data;
    }
}
