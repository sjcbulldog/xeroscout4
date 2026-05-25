import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { ApiImageDataResponse, ApiImageInfo } from '@xeroscout4/shared';
import { IsNull, Repository } from 'typeorm';
import { EventEntity } from '../entities/event.entity.js';
import { ImageEntity } from '../entities/image.entity.js';
import { SyncService } from '../sync/sync.service.js';
import { UploadImageDto } from './images.dto.js';

function toApiImageInfo(image: ImageEntity): ApiImageInfo {
    return {
        name: image.name,
        sizeBytes: image.sizeBytes,
    };
}

@Injectable()
export class ImagesService {
    constructor(
        @InjectRepository(EventEntity)
        private readonly eventRepo: Repository<EventEntity>,
        @InjectRepository(ImageEntity)
        private readonly imageRepo: Repository<ImageEntity>,
        private readonly syncService: SyncService,
    ) {}

    async listImages(uuid: string): Promise<{ images: ApiImageInfo[] }> {
        const event = await this.getEventEntity(uuid);
        const images = await this.imageRepo.find({
            where: [
                { eventId: IsNull() },
                { eventId: event.id },
            ],
            order: { name: 'ASC' },
        });

        const deduped = new Map<string, ImageEntity>();
        for (const image of images.filter(image => image.eventId === null)) {
            deduped.set(image.name, image);
        }
        for (const image of images.filter(image => image.eventId === event.id)) {
            deduped.set(image.name, image);
        }

        return { images: Array.from(deduped.values()).map(toApiImageInfo) };
    }

    async getImage(uuid: string, name: string): Promise<ApiImageDataResponse> {
        const event = await this.getEventEntity(uuid);
        const image = await this.imageRepo.findOne({ where: { eventId: event.id, name } })
            ?? await this.imageRepo.findOne({ where: { eventId: IsNull(), name } });
        if (!image) {
            throw new NotFoundException(`Image ${name} not found`);
        }

        return {
            name: image.name,
            data: image.dataBase64,
            mimeType: image.mimeType,
        };
    }

    async uploadImage(uuid: string, request: UploadImageDto): Promise<ApiImageInfo> {
        const event = await this.getEventEntity(uuid);
        const existing = await this.imageRepo.findOne({ where: { eventId: event.id, name: request.name } });
        const image = existing ?? this.imageRepo.create({ eventId: event.id, name: request.name });
        image.mimeType = request.mimeType;
        image.dataBase64 = request.data;
        image.sizeBytes = Buffer.from(request.data, 'base64').length;
        const saved = await this.imageRepo.save(image);
        await this.syncService.recordChange('images', saved.id, existing ? 'update' : 'insert');
        return toApiImageInfo(saved);
    }

    async deleteImage(uuid: string, name: string): Promise<{ deleted: true }> {
        const event = await this.getEventEntity(uuid);
        const image = await this.imageRepo.findOne({ where: { eventId: event.id, name } });
        if (!image) {
            throw new NotFoundException(`Image ${name} not found`);
        }

        await this.imageRepo.delete(image.id);
        await this.syncService.recordChange('images', image.id, 'delete');
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
