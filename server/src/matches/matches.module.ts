import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { EventEntity } from '../entities/event.entity.js';
import { MatchEntity } from '../entities/match.entity.js';
import { SyncModule } from '../sync/sync.module.js';
import { MatchesController } from './matches.controller.js';
import { MatchesService } from './matches.service.js';

@Module({
    imports: [AuthModule, TypeOrmModule.forFeature([EventEntity, MatchEntity]), SyncModule],
    controllers: [MatchesController],
    providers: [MatchesService],
})
export class MatchesModule {}
