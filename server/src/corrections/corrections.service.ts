import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { ApiCorrection } from '@xeroscout4/shared';
import { Repository } from 'typeorm';
import { CorrectionEntity } from '../entities/correction.entity.js';
import { EventEntity } from '../entities/event.entity.js';
import { SyncService } from '../sync/sync.service.js';
import { SubmitCorrectionDto } from './corrections.dto.js';

function toApiCorrection(correction: CorrectionEntity): ApiCorrection {
    return {
        id: correction.id,
        resultType: correction.resultType,
        matchId: correction.matchId,
        teamNumber: correction.teamNumber,
        fieldName: correction.fieldName,
        correctedValue: JSON.parse(correction.correctedValue),
        originalValue: correction.originalValue ? JSON.parse(correction.originalValue) : null,
        correctedBy: correction.correctedBy,
        correctedAt: correction.correctedAt.toISOString(),
    };
}

@Injectable()
export class CorrectionsService {
    constructor(
        @InjectRepository(EventEntity)
        private readonly eventRepo: Repository<EventEntity>,
        @InjectRepository(CorrectionEntity)
        private readonly correctionRepo: Repository<CorrectionEntity>,
        private readonly syncService: SyncService,
    ) {}

    async createCorrection(uuid: string, request: SubmitCorrectionDto): Promise<ApiCorrection> {
        const event = await this.getEventEntity(uuid);
        const correction = this.correctionRepo.create({
            event: { id: event.id },
            resultType: request.resultType,
            matchId: request.matchId ?? null,
            teamNumber: request.teamNumber,
            fieldName: request.fieldName,
            correctedValue: JSON.stringify(request.correctedValue),
            originalValue: request.originalValue === undefined ? null : JSON.stringify(request.originalValue),
            correctedBy: request.correctedBy,
        });
        const saved = await this.correctionRepo.save(correction);
        await this.syncService.recordChange('corrections', saved.id, 'insert');
        return toApiCorrection(saved);
    }

    async listCorrections(uuid: string): Promise<{ corrections: ApiCorrection[] }> {
        const event = await this.getEventEntity(uuid);
        const corrections = await this.correctionRepo.find({
            where: { event: { id: event.id } },
            order: { correctedAt: 'ASC', id: 'ASC' },
        });
        return { corrections: corrections.map(toApiCorrection) };
    }

    async deleteCorrection(uuid: string, id: number): Promise<{ deleted: true }> {
        const event = await this.getEventEntity(uuid);
        const correction = await this.correctionRepo.findOne({
            where: {
                id,
                event: { id: event.id },
            },
        });
        if (!correction) {
            throw new NotFoundException(`Correction ${id} not found`);
        }

        await this.correctionRepo.delete(id);
        await this.syncService.recordChange('corrections', id, 'delete');
        return { deleted: true };
    }

    private async getEventEntity(uuid: string): Promise<EventEntity> {
        const event = await this.eventRepo.findOne({ where: { uuid } });
        if (!event) {
            throw new NotFoundException(`Event ${uuid} not found`);
        }
        return event;
    }
}
