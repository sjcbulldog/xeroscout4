import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import {
    DatasetEntity,
    FormulaEntity,
    GraphEntity,
    PicklistEntity,
    PlayoffBracketEntity,
} from '../entities/analysis.entities.js';
import { EventEntity } from '../entities/event.entity.js';
import { SyncModule } from '../sync/sync.module.js';
import { AnalysisController } from './analysis.controller.js';
import { AnalysisService } from './analysis.service.js';

@Module({
    imports: [
        AuthModule,
        TypeOrmModule.forFeature([
            EventEntity,
            FormulaEntity,
            DatasetEntity,
            GraphEntity,
            PicklistEntity,
            PlayoffBracketEntity,
        ]),
        SyncModule,
    ],
    controllers: [AnalysisController],
    providers: [AnalysisService],
})
export class AnalysisModule {}
