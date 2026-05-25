import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { EventEntity } from '../entities/event.entity.js';
import { SyncModule } from '../sync/sync.module.js';
import { EventsController, HealthController } from './events.controller.js';
import { EventsService } from './events.service.js';

@Module({
    imports: [AuthModule, TypeOrmModule.forFeature([EventEntity]), SyncModule],
    controllers: [EventsController, HealthController],
    providers: [EventsService],
    exports: [EventsService],
})
export class EventsModule {}
