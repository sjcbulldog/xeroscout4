import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { SyncLogEntity } from '../entities/sync-log.entity.js';
import { SyncController } from './sync.controller.js';
import { SyncService } from './sync.service.js';

@Module({
    imports: [AuthModule, TypeOrmModule.forFeature([SyncLogEntity])],
    controllers: [SyncController],
    providers: [SyncService],
    exports: [SyncService],
})
export class SyncModule {}
