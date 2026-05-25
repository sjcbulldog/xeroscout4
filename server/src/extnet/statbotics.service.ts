import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class StatboticsService {
    private readonly client: AxiosInstance = axios.create({
        baseURL: 'https://api.statbotics.io/v3',
        timeout: 10000,
    });

    async getTeams(year: number): Promise<Array<{ team: number; epa: { mean: number | null } }>> {
        const response = await this.client.get<Array<Record<string, unknown>>>(`/teams?year=${year}`);
        return response.data.map(team => {
            const epaValue = typeof team.epa === 'object' && team.epa !== null && 'mean' in team.epa
                ? (team.epa as { mean?: number }).mean ?? null
                : typeof team.norm_epa === 'number'
                    ? team.norm_epa
                    : typeof team.epa === 'number'
                        ? team.epa
                        : null;

            return {
                team: Number(team.team ?? 0),
                epa: {
                    mean: epaValue,
                },
            };
        });
    }
}
