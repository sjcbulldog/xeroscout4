import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { EventEntity } from '../entities/event.entity.js';
import { TeamEntity } from '../entities/team.entity.js';
import { SyncModule } from '../sync/sync.module.js';
import { TeamsController } from './teams.controller.js';
import { TeamsService } from './teams.service.js';

@Module({
    imports: [AuthModule, TypeOrmModule.forFeature([EventEntity, TeamEntity]), SyncModule],
    controllers: [TeamsController],
    providers: [TeamsService],
})
export class TeamsModule {}
