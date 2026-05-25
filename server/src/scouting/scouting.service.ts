import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type {
    ApiResultsResponse,
    ApiScoutingResult,
} from '@xeroscout4/shared';
import { Repository } from 'typeorm';
import { CorrectionEntity } from '../entities/correction.entity.js';
import { EventEntity } from '../entities/event.entity.js';
import { ScoutingResultEntity } from '../entities/scouting-result.entity.js';
import { TabletEntity } from '../entities/tablet.entity.js';
import { SyncService } from '../sync/sync.service.js';
import { SubmitResultDto } from './scouting.dto.js';

function parseJson<T>(value: string): T {
    return JSON.parse(value) as T;
}

function toApiScoutingResult(result: ScoutingResultEntity, dataJson: Record<string, unknown>): ApiScoutingResult {
    return {
        id: result.id,
        tabletName: result.tabletName,
        resultType: result.resultType,
        matchId: result.matchId,
        teamNumber: result.teamNumber,
        dataJson,
        scoutedAt: result.scoutedAt.toISOString(),
        uploadedAt: result.uploadedAt.toISOString(),
        source: result.source,
    };
}

@Injectable()
export class ScoutingService {
    constructor(
        @InjectRepository(EventEntity)
        private readonly eventRepo: Repository<EventEntity>,
        @InjectRepository(TabletEntity)
        private readonly tabletRepo: Repository<TabletEntity>,
        @InjectRepository(ScoutingResultEntity)
        private readonly resultRepo: Repository<ScoutingResultEntity>,
        @InjectRepository(CorrectionEntity)
        private readonly correctionRepo: Repository<CorrectionEntity>,
        private readonly syncService: SyncService,
    ) {}

    async submitResult(uuid: string, request: SubmitResultDto): Promise<{ id: number; uploadedAt: string }> {
        const event = await this.getEventEntity(uuid);
        const tablet = await this.tabletRepo.findOne({
            where: {
                event: { id: event.id },
                name: request.tabletName,
            },
        });
        if (!tablet) {
            throw new NotFoundException(`Tablet ${request.tabletName} not found`);
        }

        const result = this.resultRepo.create({
            event: { id: event.id },
            tabletName: request.tabletName,
            resultType: request.resultType,
            matchId: request.matchId ?? null,
            teamNumber: request.teamNumber,
            dataJson: JSON.stringify(request.dataJson),
            scoutedAt: new Date(request.scoutedAt),
            source: 'tablet',
        });
        const saved = await this.resultRepo.save(result);
        await this.syncService.recordChange('scouting_results', saved.id, 'insert');
        return { id: saved.id, uploadedAt: saved.uploadedAt.toISOString() };
    }

    async getResults(uuid: string): Promise<ApiResultsResponse> {
        const event = await this.getEventEntity(uuid);
        const [results, corrections] = await Promise.all([
            this.resultRepo.find({
                where: { event: { id: event.id } },
                order: { uploadedAt: 'ASC', id: 'ASC' },
            }),
            this.correctionRepo.find({
                where: { event: { id: event.id } },
                order: { correctedAt: 'ASC', id: 'ASC' },
            }),
        ]);

        const correctionMap = new Map<string, unknown>();
        for (const correction of corrections) {
            correctionMap.set(
                `${correction.resultType}:${correction.matchId}:${correction.teamNumber}:${correction.fieldName}`,
                JSON.parse(correction.correctedValue),
            );
        }

        return {
            results: results.map(result => {
                const dataJson = { ...parseJson<Record<string, unknown>>(result.dataJson) };
                for (const fieldName of Object.keys(dataJson)) {
                    const correctionKey = `${result.resultType}:${result.matchId}:${result.teamNumber}:${fieldName}`;
                    if (correctionMap.has(correctionKey)) {
                        dataJson[fieldName] = correctionMap.get(correctionKey);
                    }
                }
                return toApiScoutingResult(result, dataJson);
            }),
            correctionCount: corrections.length,
        };
    }

    async getRawResults(uuid: string): Promise<{ results: ApiScoutingResult[] }> {
        const event = await this.getEventEntity(uuid);
        const results = await this.resultRepo.find({
            where: { event: { id: event.id } },
            order: { uploadedAt: 'ASC', id: 'ASC' },
        });
        return {
            results: results.map(result => toApiScoutingResult(result, parseJson(result.dataJson))),
        };
    }

    private async getEventEntity(uuid: string): Promise<EventEntity> {
        const event = await this.eventRepo.findOne({ where: { uuid } });
        if (!event) {
            throw new NotFoundException(`Event ${uuid} not found`);
        }
        return event;
    }
}
