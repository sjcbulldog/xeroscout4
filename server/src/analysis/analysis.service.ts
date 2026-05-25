import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type {
    IPCDataSet,
    IPCFormula,
    IPCGraphConfig,
    IPCPickListConfig,
    IPCPlayoffStatus,
} from '@xeroscout4/shared';
import { Repository } from 'typeorm';
import {
    DatasetEntity,
    FormulaEntity,
    GraphEntity,
    PicklistEntity,
    PlayoffBracketEntity,
} from '../entities/analysis.entities.js';
import { EventEntity } from '../entities/event.entity.js';
import { SyncService } from '../sync/sync.service.js';
import {
    SetPlayoffRequestDto,
    UpsertDatasetsRequestDto,
    UpsertFormulasRequestDto,
    UpsertGraphsRequestDto,
    UpsertPicklistsRequestDto,
} from './analysis.dto.js';

function toFormula(entity: FormulaEntity): IPCFormula {
    return {
        name: entity.name,
        desc: entity.desc ?? '',
        formula: entity.formula,
        owner: entity.owner,
    };
}

function parseJson<T>(value: string): T {
    return JSON.parse(value) as T;
}

@Injectable()
export class AnalysisService {
    constructor(
        @InjectRepository(EventEntity)
        private readonly eventRepo: Repository<EventEntity>,
        @InjectRepository(FormulaEntity)
        private readonly formulaRepo: Repository<FormulaEntity>,
        @InjectRepository(DatasetEntity)
        private readonly datasetRepo: Repository<DatasetEntity>,
        @InjectRepository(GraphEntity)
        private readonly graphRepo: Repository<GraphEntity>,
        @InjectRepository(PicklistEntity)
        private readonly picklistRepo: Repository<PicklistEntity>,
        @InjectRepository(PlayoffBracketEntity)
        private readonly playoffRepo: Repository<PlayoffBracketEntity>,
        private readonly syncService: SyncService,
    ) {}

    async listFormulas(uuid: string): Promise<{ formulas: IPCFormula[] }> {
        const event = await this.getEventEntity(uuid);
        const formulas = await this.formulaRepo.find({
            where: { event: { id: event.id } },
            order: { name: 'ASC' },
        });
        return { formulas: formulas.map(toFormula) };
    }

    async replaceFormulas(uuid: string, request: UpsertFormulasRequestDto): Promise<{ formulas: IPCFormula[] }> {
        const event = await this.getEventEntity(uuid);
        const existing = await this.formulaRepo.find({ where: { event: { id: event.id } } });
        for (const formula of existing) {
            await this.syncService.recordChange('formulas', formula.id, 'delete');
        }
        await this.formulaRepo.createQueryBuilder().delete().where('event_id = :eventId', { eventId: event.id }).execute();

        for (const formula of request.formulas) {
            const saved = await this.formulaRepo.save(this.formulaRepo.create({
                event: { id: event.id },
                name: formula.name,
                desc: formula.desc,
                formula: formula.formula,
                owner: formula.owner,
            }));
            await this.syncService.recordChange('formulas', saved.id, 'insert');
        }

        return this.listFormulas(uuid);
    }

    async listDatasets(uuid: string): Promise<{ datasets: IPCDataSet[] }> {
        const event = await this.getEventEntity(uuid);
        const datasets = await this.datasetRepo.find({
            where: { event: { id: event.id } },
            order: { name: 'ASC' },
        });
        return { datasets: datasets.map(dataset => parseJson<IPCDataSet>(dataset.configJson)) };
    }

    async replaceDatasets(uuid: string, request: UpsertDatasetsRequestDto): Promise<{ datasets: IPCDataSet[] }> {
        const event = await this.getEventEntity(uuid);
        const existing = await this.datasetRepo.find({ where: { event: { id: event.id } } });
        for (const dataset of existing) {
            await this.syncService.recordChange('datasets', dataset.id, 'delete');
        }
        await this.datasetRepo.createQueryBuilder().delete().where('event_id = :eventId', { eventId: event.id }).execute();

        for (const dataset of request.datasets) {
            const saved = await this.datasetRepo.save(this.datasetRepo.create({
                event: { id: event.id },
                name: dataset.name,
                configJson: JSON.stringify(dataset),
            }));
            await this.syncService.recordChange('datasets', saved.id, 'insert');
        }

        return this.listDatasets(uuid);
    }

    async listGraphs(uuid: string): Promise<{ graphs: IPCGraphConfig[] }> {
        const event = await this.getEventEntity(uuid);
        const graphs = await this.graphRepo.find({
            where: { event: { id: event.id } },
            order: { name: 'ASC' },
        });
        return { graphs: graphs.map(graph => parseJson<IPCGraphConfig>(graph.configJson)) };
    }

    async replaceGraphs(uuid: string, request: UpsertGraphsRequestDto): Promise<{ graphs: IPCGraphConfig[] }> {
        const event = await this.getEventEntity(uuid);
        const existing = await this.graphRepo.find({ where: { event: { id: event.id } } });
        for (const graph of existing) {
            await this.syncService.recordChange('graphs', graph.id, 'delete');
        }
        await this.graphRepo.createQueryBuilder().delete().where('event_id = :eventId', { eventId: event.id }).execute();

        for (const graph of request.graphs) {
            const saved = await this.graphRepo.save(this.graphRepo.create({
                event: { id: event.id },
                name: graph.name,
                configJson: JSON.stringify(graph),
                owner: graph.owner,
            }));
            await this.syncService.recordChange('graphs', saved.id, 'insert');
        }

        return this.listGraphs(uuid);
    }

    async listPicklists(uuid: string): Promise<{ picklists: IPCPickListConfig[] }> {
        const event = await this.getEventEntity(uuid);
        const picklists = await this.picklistRepo.find({
            where: { event: { id: event.id } },
            order: { name: 'ASC' },
        });
        return { picklists: picklists.map(picklist => parseJson<IPCPickListConfig>(picklist.configJson)) };
    }

    async replacePicklists(uuid: string, request: UpsertPicklistsRequestDto): Promise<{ picklists: IPCPickListConfig[] }> {
        const event = await this.getEventEntity(uuid);
        const existing = await this.picklistRepo.find({ where: { event: { id: event.id } } });
        for (const picklist of existing) {
            await this.syncService.recordChange('picklists', picklist.id, 'delete');
        }
        await this.picklistRepo.createQueryBuilder().delete().where('event_id = :eventId', { eventId: event.id }).execute();

        for (const picklist of request.picklists) {
            const saved = await this.picklistRepo.save(this.picklistRepo.create({
                event: { id: event.id },
                name: picklist.name,
                configJson: JSON.stringify(picklist),
                owner: picklist.owner,
            }));
            await this.syncService.recordChange('picklists', saved.id, 'insert');
        }

        return this.listPicklists(uuid);
    }

    async getPlayoff(uuid: string): Promise<{ bracket: IPCPlayoffStatus | null }> {
        const event = await this.getEventEntity(uuid);
        const bracket = await this.playoffRepo.findOne({ where: { event: { id: event.id } } });
        return {
            bracket: bracket ? parseJson<IPCPlayoffStatus>(bracket.bracketJson) : null,
        };
    }

    async setPlayoff(uuid: string, request: SetPlayoffRequestDto): Promise<{ bracket: IPCPlayoffStatus }> {
        const event = await this.getEventEntity(uuid);
        const existing = await this.playoffRepo.findOne({ where: { event: { id: event.id } } });
        const bracket = existing ?? this.playoffRepo.create({ event: { id: event.id } });
        bracket.bracketJson = JSON.stringify(request.bracket);
        const saved = await this.playoffRepo.save(bracket);
        await this.syncService.recordChange('playoff_bracket', saved.id, existing ? 'update' : 'insert');
        return { bracket: parseJson<IPCPlayoffStatus>(saved.bracketJson) };
    }

    private async getEventEntity(uuid: string): Promise<EventEntity> {
        const event = await this.eventRepo.findOne({ where: { uuid } });
        if (!event) {
            throw new NotFoundException(`Event ${uuid} not found`);
        }
        return event;
    }
}
