import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { CorrectionEntity } from '../entities/correction.entity.js';
import { EventEntity } from '../entities/event.entity.js';
import { SyncModule } from '../sync/sync.module.js';
import { CorrectionsController } from './corrections.controller.js';
import { CorrectionsService } from './corrections.service.js';

@Module({
    imports: [AuthModule, TypeOrmModule.forFeature([EventEntity, CorrectionEntity]), SyncModule],
    controllers: [CorrectionsController],
    providers: [CorrectionsService],
})
export class CorrectionsModule {}
