import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { EventEntity } from '../entities/event.entity.js';
import { ImageEntity } from '../entities/image.entity.js';
import { SyncModule } from '../sync/sync.module.js';
import { ImagesController } from './images.controller.js';
import { ImagesService } from './images.service.js';

@Module({
    imports: [AuthModule, TypeOrmModule.forFeature([EventEntity, ImageEntity]), SyncModule],
    controllers: [ImagesController],
    providers: [ImagesService],
})
export class ImagesModule {}
