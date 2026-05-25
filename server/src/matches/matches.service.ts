import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { ApiMatch } from '@xeroscout4/shared';
import { Repository } from 'typeorm';
import { EventEntity } from '../entities/event.entity.js';
import { MatchEntity } from '../entities/match.entity.js';
import { SyncService } from '../sync/sync.service.js';
import { UpsertMatchesRequestDto } from './matches.dto.js';

function toApiMatch(match: MatchEntity): ApiMatch {
    return {
        id: match.id,
        compLevel: match.compLevel,
        matchNumber: match.matchNumber,
        setNumber: match.setNumber,
        red1: match.red1,
        red2: match.red2,
        red3: match.red3,
        blue1: match.blue1,
        blue2: match.blue2,
        blue3: match.blue3,
        redScore: match.redScore,
        blueScore: match.blueScore,
        updatedAt: match.updatedAt.toISOString(),
    };
}

@Injectable()
export class MatchesService {
    constructor(
        @InjectRepository(EventEntity)
        private readonly eventRepo: Repository<EventEntity>,
        @InjectRepository(MatchEntity)
        private readonly matchRepo: Repository<MatchEntity>,
        private readonly syncService: SyncService,
    ) {}

    async listMatches(uuid: string): Promise<ApiMatch[]> {
        const event = await this.getEventEntity(uuid);
        const matches = await this.matchRepo.find({
            where: { event: { id: event.id } },
            order: {
                compLevel: 'ASC',
                setNumber: 'ASC',
                matchNumber: 'ASC',
            },
        });
        return matches.map(toApiMatch);
    }

    async upsertMatches(uuid: string, request: UpsertMatchesRequestDto): Promise<ApiMatch[]> {
        const event = await this.getEventEntity(uuid);

        for (const matchRequest of request.matches) {
            const existing = await this.matchRepo.findOne({
                where: {
                    event: { id: event.id },
                    compLevel: matchRequest.compLevel,
                    matchNumber: matchRequest.matchNumber,
                    setNumber: matchRequest.setNumber,
                },
            });

            const match = existing ?? this.matchRepo.create({
                event: { id: event.id },
                compLevel: matchRequest.compLevel,
                matchNumber: matchRequest.matchNumber,
                setNumber: matchRequest.setNumber,
            });

            match.red1 = matchRequest.red1;
            match.red2 = matchRequest.red2;
            match.red3 = matchRequest.red3;
            match.blue1 = matchRequest.blue1;
            match.blue2 = matchRequest.blue2;
            match.blue3 = matchRequest.blue3;
            match.redScore = matchRequest.redScore ?? null;
            match.blueScore = matchRequest.blueScore ?? null;

            const saved = await this.matchRepo.save(match);
            await this.syncService.recordChange('matches', saved.id, existing ? 'update' : 'insert');
        }

        return this.listMatches(uuid);
    }

    private async getEventEntity(uuid: string): Promise<EventEntity> {
        const event = await this.eventRepo.findOne({ where: { uuid } });
        if (!event) {
            throw new NotFoundException(`Event ${uuid} not found`);
        }
        return event;
    }
}
