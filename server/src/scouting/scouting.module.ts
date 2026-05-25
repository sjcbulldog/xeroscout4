import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { CorrectionEntity } from '../entities/correction.entity.js';
import { EventEntity } from '../entities/event.entity.js';
import { ScoutingResultEntity } from '../entities/scouting-result.entity.js';
import { TabletEntity } from '../entities/tablet.entity.js';
import { SyncModule } from '../sync/sync.module.js';
import { ScoutingController } from './scouting.controller.js';
import { ScoutingService } from './scouting.service.js';

@Module({
    imports: [
        AuthModule,
        TypeOrmModule.forFeature([EventEntity, TabletEntity, ScoutingResultEntity, CorrectionEntity]),
        SyncModule,
    ],
    controllers: [ScoutingController],
    providers: [ScoutingService],
})
export class ScoutingModule {}
