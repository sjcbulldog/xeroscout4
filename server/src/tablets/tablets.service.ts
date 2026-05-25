import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type {
    ApiMatch,
    ApiTablet,
    ApiTabletAssignment,
    ApiTabletInitResponse,
    IPCForm,
} from '@xeroscout4/shared';
import { Repository } from 'typeorm';
import { EventEntity } from '../entities/event.entity.js';
import { MatchEntity } from '../entities/match.entity.js';
import { TabletAssignmentEntity } from '../entities/tablet-assignment.entity.js';
import { TabletEntity } from '../entities/tablet.entity.js';
import { TeamEntity } from '../entities/team.entity.js';
import { SyncService } from '../sync/sync.service.js';
import { UpsertTabletsRequestDto } from './tablets.dto.js';

function toApiTabletAssignment(assignment: TabletAssignmentEntity): ApiTabletAssignment {
    return {
        id: assignment.id,
        matchId: assignment.match?.id ?? null,
        teamNumber: assignment.teamNumber,
        alliancePosition: assignment.alliancePosition,
    };
}

function toApiTablet(tablet: TabletEntity): ApiTablet {
    return {
        id: tablet.id,
        name: tablet.name,
        purpose: tablet.purpose,
        assignments: tablet.assignments.map(toApiTabletAssignment),
    };
}

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
export class TabletsService {
    constructor(
        @InjectRepository(EventEntity)
        private readonly eventRepo: Repository<EventEntity>,
        @InjectRepository(TabletEntity)
        private readonly tabletRepo: Repository<TabletEntity>,
        @InjectRepository(TeamEntity)
        private readonly teamRepo: Repository<TeamEntity>,
        @InjectRepository(MatchEntity)
        private readonly matchRepo: Repository<MatchEntity>,
        private readonly syncService: SyncService,
    ) {}

    async listTablets(uuid: string): Promise<ApiTablet[]> {
        const event = await this.getEventEntity(uuid);
        const tablets = await this.tabletRepo.find({
            where: { event: { id: event.id } },
            relations: { assignments: { match: true } },
            order: { name: 'ASC' },
        });
        return tablets.map(toApiTablet);
    }

    async replaceTablets(uuid: string, request: UpsertTabletsRequestDto): Promise<ApiTablet[]> {
        const event = await this.getEventEntity(uuid);
        const existing = await this.tabletRepo.find({ where: { event: { id: event.id } } });
        for (const tablet of existing) {
            await this.syncService.recordChange('tablets', tablet.id, 'delete');
        }

        await this.tabletRepo.createQueryBuilder().delete().where('event_id = :eventId', { eventId: event.id }).execute();

        for (const tabletRequest of request.tablets) {
            const tablet = this.tabletRepo.create({
                event: { id: event.id },
                name: tabletRequest.name,
                purpose: tabletRequest.purpose,
                assignments: tabletRequest.assignments.map(assignment => ({
                    eventId: event.id,
                    match: assignment.matchId ? { id: assignment.matchId } : null,
                    teamNumber: assignment.teamNumber ?? null,
                    alliancePosition: assignment.alliancePosition ?? null,
                })),
            });
            const saved = await this.tabletRepo.save(tablet);
            await this.syncService.recordChange('tablets', saved.id, 'insert');
        }

        return this.listTablets(uuid);
    }

    async getTabletInit(uuid: string, tabletName: string): Promise<ApiTabletInitResponse> {
        const event = await this.getEventEntity(uuid);
        const tablet = await this.tabletRepo.findOne({
            where: { event: { id: event.id }, name: tabletName },
            relations: { assignments: { match: true } },
        });
        if (!tablet) {
            throw new NotFoundException(`Tablet ${tabletName} not found`);
        }

        const formJson = tablet.purpose === 'team' ? event.teamFormJson : event.matchFormJson;
        if (!formJson) {
            throw new NotFoundException(`No ${tablet.purpose} form configured for event ${uuid}`);
        }

        let form: IPCForm;
        try {
            form = JSON.parse(formJson) as IPCForm;
        } catch {
            throw new BadRequestException(`Configured ${tablet.purpose} form is not valid JSON`);
        }

        const teams = await this.teamRepo.find({
            where: { event: { id: event.id } },
            order: { teamNumber: 'ASC' },
        });
        const matches = await this.matchRepo.find({
            where: { event: { id: event.id } },
            order: { compLevel: 'ASC', setNumber: 'ASC', matchNumber: 'ASC' },
        });

        return {
            tablet: toApiTablet(tablet),
            form,
            eventUuid: event.uuid,
            eventName: event.name,
            teams: teams.map(team => ({ teamNumber: team.teamNumber, nickname: team.nickname })),
            matches: matches.map(toApiMatch),
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
