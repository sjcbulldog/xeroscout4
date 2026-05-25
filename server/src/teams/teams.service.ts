import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { ApiTeam } from '@xeroscout4/shared';
import { Repository } from 'typeorm';
import { EventEntity } from '../entities/event.entity.js';
import { TeamEntity } from '../entities/team.entity.js';
import { SyncService } from '../sync/sync.service.js';
import { UpsertTeamsRequestDto } from './teams.dto.js';

function toApiTeam(team: TeamEntity): ApiTeam {
    return {
        teamNumber: team.teamNumber,
        nickname: team.nickname,
        opr: team.opr,
        dpr: team.dpr,
        ccwm: team.ccwm,
        rank: team.rank,
        epa: team.epa,
        updatedAt: team.updatedAt.toISOString(),
    };
}

@Injectable()
export class TeamsService {
    constructor(
        @InjectRepository(EventEntity)
        private readonly eventRepo: Repository<EventEntity>,
        @InjectRepository(TeamEntity)
        private readonly teamRepo: Repository<TeamEntity>,
        private readonly syncService: SyncService,
    ) {}

    async listTeams(uuid: string): Promise<ApiTeam[]> {
        const event = await this.getEventEntity(uuid);
        const teams = await this.teamRepo.find({
            where: { event: { id: event.id } },
            order: { teamNumber: 'ASC' },
        });
        return teams.map(toApiTeam);
    }

    async upsertTeams(uuid: string, request: UpsertTeamsRequestDto): Promise<ApiTeam[]> {
        const event = await this.getEventEntity(uuid);

        for (const teamRequest of request.teams) {
            const existing = await this.teamRepo.findOne({
                where: {
                    event: { id: event.id },
                    teamNumber: teamRequest.teamNumber,
                },
            });

            const team = existing ?? this.teamRepo.create({
                event: { id: event.id },
                teamNumber: teamRequest.teamNumber,
            });

            team.nickname = teamRequest.nickname;
            team.opr = teamRequest.opr ?? null;
            team.dpr = teamRequest.dpr ?? null;
            team.ccwm = teamRequest.ccwm ?? null;
            team.rank = teamRequest.rank ?? null;
            team.epa = teamRequest.epa ?? null;

            const saved = await this.teamRepo.save(team);
            await this.syncService.recordChange('teams', saved.id, existing ? 'update' : 'insert');
        }

        return this.listTeams(uuid);
    }

    private async getEventEntity(uuid: string): Promise<EventEntity> {
        const event = await this.eventRepo.findOne({ where: { uuid } });
        if (!event) {
            throw new NotFoundException(`Event ${uuid} not found`);
        }
        return event;
    }
}
