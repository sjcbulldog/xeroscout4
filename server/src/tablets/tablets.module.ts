import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { EventEntity } from '../entities/event.entity.js';
import { MatchEntity } from '../entities/match.entity.js';
import { TabletEntity } from '../entities/tablet.entity.js';
import { TeamEntity } from '../entities/team.entity.js';
import { SyncModule } from '../sync/sync.module.js';
import { TabletsController } from './tablets.controller.js';
import { TabletsService } from './tablets.service.js';

@Module({
    imports: [AuthModule, TypeOrmModule.forFeature([EventEntity, TabletEntity, TeamEntity, MatchEntity]), SyncModule],
    controllers: [TabletsController],
    providers: [TabletsService],
})
export class TabletsModule {}
