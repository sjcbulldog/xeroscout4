import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { ApiEvent, ApiHealthResponse } from '@xeroscout4/shared';
import { randomUUID } from 'crypto';
import { Repository } from 'typeorm';
import { EventEntity } from '../entities/event.entity.js';
import { SyncService } from '../sync/sync.service.js';
import { CreateEventDto, UpdateEventDto } from './events.dto.js';

function toApiEvent(event: EventEntity): ApiEvent {
    return {
        uuid: event.uuid,
        name: event.name,
        baEventKey: event.baEventKey,
        year: event.year,
        locked: event.locked,
        startDate: event.startDate,
        endDate: event.endDate,
        teamFormJson: event.teamFormJson,
        matchFormJson: event.matchFormJson,
        createdAt: event.createdAt.toISOString(),
        updatedAt: event.updatedAt.toISOString(),
    };
}

@Injectable()
export class EventsService {
    constructor(
        @InjectRepository(EventEntity)
        private readonly eventRepo: Repository<EventEntity>,
        private readonly syncService: SyncService,
    ) {}

    async listEvents(): Promise<ApiEvent[]> {
        const events = await this.eventRepo.find({ order: { year: 'DESC', createdAt: 'DESC' } });
        return events.map(toApiEvent);
    }

    async createEvent(request: CreateEventDto): Promise<ApiEvent> {
        const event = this.eventRepo.create({
            uuid: randomUUID(),
            name: request.name,
            baEventKey: request.baEventKey ?? null,
            year: request.year,
            startDate: request.startDate ?? null,
            endDate: request.endDate ?? null,
            locked: false,
            teamFormJson: null,
            matchFormJson: null,
        });
        const saved = await this.eventRepo.save(event);
        await this.syncService.recordChange('events', saved.id, 'insert');
        return toApiEvent(saved);
    }

    async getEvent(uuid: string): Promise<ApiEvent> {
        return toApiEvent(await this.getEventEntity(uuid));
    }

    async updateEvent(uuid: string, request: UpdateEventDto): Promise<ApiEvent> {
        const event = await this.getEventEntity(uuid);
        if (request.name !== undefined) {
            event.name = request.name;
        }
        if (request.locked !== undefined) {
            event.locked = request.locked;
        }
        if (request.teamFormJson !== undefined) {
            event.teamFormJson = request.teamFormJson;
        }
        if (request.matchFormJson !== undefined) {
            event.matchFormJson = request.matchFormJson;
        }
        if (request.startDate !== undefined) {
            event.startDate = request.startDate;
        }
        if (request.endDate !== undefined) {
            event.endDate = request.endDate;
        }

        const saved = await this.eventRepo.save(event);
        await this.syncService.recordChange('events', saved.id, 'update');
        return toApiEvent(saved);
    }

    async deleteEvent(uuid: string): Promise<void> {
        const event = await this.getEventEntity(uuid);
        await this.eventRepo.remove(event);
        await this.syncService.recordChange('events', event.id, 'delete');
    }

    getHealth(): ApiHealthResponse {
        return {
            status: 'ok',
            version: '4.0.0',
            uptime: process.uptime(),
        };
    }

    getEventHealth(): { status: 'ok' } {
        return { status: 'ok' };
    }

    private async getEventEntity(uuid: string): Promise<EventEntity> {
        const event = await this.eventRepo.findOne({ where: { uuid } });
        if (!event) {
            throw new NotFoundException(`Event ${uuid} not found`);
        }
        return event;
    }
}
