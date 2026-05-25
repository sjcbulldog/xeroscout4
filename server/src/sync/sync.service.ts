import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type {
    ApiSyncDeltaResponse,
    ApiSyncPushResponse,
    SyncOperation,
    SyncSource,
} from '@xeroscout4/shared';
import { EntityTarget, MoreThan, Not, Repository } from 'typeorm';
import { SyncLogEntity } from '../entities/sync-log.entity.js';
import { EventEntity } from '../entities/event.entity.js';
import { TeamEntity } from '../entities/team.entity.js';
import { MatchEntity } from '../entities/match.entity.js';
import { TabletEntity } from '../entities/tablet.entity.js';
import { TabletAssignmentEntity } from '../entities/tablet-assignment.entity.js';
import { ScoutingResultEntity } from '../entities/scouting-result.entity.js';
import { CorrectionEntity } from '../entities/correction.entity.js';
import {
    DatasetEntity,
    FormulaEntity,
    GraphEntity,
    PicklistEntity,
    PlayoffBracketEntity,
} from '../entities/analysis.entities.js';
import { ImageEntity } from '../entities/image.entity.js';
import { ApiKeyEntity } from '../entities/api-key.entity.js';
import { SyncPushRequestDto, SyncResolveRequestDto } from './sync.dto.js';

const SYNC_ENTITY_MAP = {
    events: EventEntity,
    teams: TeamEntity,
    matches: MatchEntity,
    tablets: TabletEntity,
    tablet_assignments: TabletAssignmentEntity,
    scouting_results: ScoutingResultEntity,
    corrections: CorrectionEntity,
    formulas: FormulaEntity,
    datasets: DatasetEntity,
    graphs: GraphEntity,
    picklists: PicklistEntity,
    playoff_bracket: PlayoffBracketEntity,
    images: ImageEntity,
    api_keys: ApiKeyEntity,
    sync_log: SyncLogEntity,
} as const;

@Injectable()
export class SyncService {
    constructor(
        @InjectRepository(SyncLogEntity)
        private readonly syncLogRepo: Repository<SyncLogEntity>,
    ) {}

    async getDelta(since: string): Promise<ApiSyncDeltaResponse> {
        const sinceDate = new Date(since);
        if (Number.isNaN(sinceDate.getTime())) {
            throw new BadRequestException('Invalid since timestamp');
        }

        const changes = await this.syncLogRepo.find({
            where: {
                changedAt: MoreThan(sinceDate),
                synced: false,
            },
            order: {
                changedAt: 'ASC',
                id: 'ASC',
            },
        });

        return {
            since,
            serverTime: new Date().toISOString(),
            changes: changes.map(change => ({
                id: change.id,
                tableName: change.tableName,
                rowId: change.rowId,
                operation: change.operation,
                changedAt: change.changedAt.toISOString(),
                source: change.source,
            })),
        };
    }

    async pushChanges(request: SyncPushRequestDto): Promise<ApiSyncPushResponse> {
        let accepted = 0;
        const conflicts: ApiSyncPushResponse['conflicts'] = [];

        for (const change of request.changes) {
            const newerLocalChange = await this.syncLogRepo.findOne({
                where: {
                    tableName: change.tableName,
                    rowId: change.rowId,
                    source: Not(request.source),
                    changedAt: MoreThan(new Date(change.changedAt)),
                },
                order: { changedAt: 'DESC', id: 'DESC' },
            });

            if (newerLocalChange) {
                conflicts.push({
                    tableName: change.tableName,
                    rowId: change.rowId,
                    reason: 'Row changed locally after incoming update',
                });
                continue;
            }

            const target = this.getEntityTarget(change.tableName);
            if (change.operation === 'delete') {
                await this.syncLogRepo.manager.delete(target, change.rowId);
            } else {
                await this.syncLogRepo.manager.save(target, {
                    ...(change.payload as object),
                    id: change.rowId,
                });
            }

            accepted += 1;
        }

        return { accepted, conflicts };
    }

    async resolveConflicts(request: SyncResolveRequestDto): Promise<{ resolved: number }> {
        for (const conflict of request.conflicts) {
            const target = this.getEntityTarget(conflict.tableName);
            await this.syncLogRepo.manager.save(target, {
                ...(conflict.winningPayload as object),
                id: conflict.rowId,
            });
        }

        return { resolved: request.conflicts.length };
    }

    async recordChange(
        tableName: keyof typeof SYNC_ENTITY_MAP,
        rowId: number,
        operation: SyncOperation,
        source: SyncSource = 'cloud',
    ): Promise<void> {
        const entity = this.syncLogRepo.create({
            tableName,
            rowId,
            operation,
            source,
            synced: false,
            changedAt: new Date(),
        });
        await this.syncLogRepo.save(entity);
    }

    private getEntityTarget(tableName: string): EntityTarget<object> {
        const target = SYNC_ENTITY_MAP[tableName as keyof typeof SYNC_ENTITY_MAP];
        if (!target) {
            throw new BadRequestException(`Unsupported sync table: ${tableName}`);
        }

        return target as EntityTarget<object>;
    }
}
