import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { ApiTeam } from '@xeroscout4/shared';
import { ApiKeyGuard } from '../auth/api-key.guard.js';
import { CurrentAuth } from '../auth/current-auth.decorator.js';
import type { AuthContext } from '../auth/auth.service.js';
import { TeamsService } from './teams.service.js';
import { UpsertTeamsRequestDto } from './teams.dto.js';

@ApiTags('teams')
@ApiBearerAuth()
@UseGuards(ApiKeyGuard)
@Controller('events/:uuid/teams')
export class TeamsController {
    constructor(private readonly teamsService: TeamsService) {}

    @Get()
    listTeams(@CurrentAuth() _auth: AuthContext, @Param('uuid') uuid: string): Promise<ApiTeam[]> {
        return this.teamsService.listTeams(uuid);
    }

    @Put()
    upsertTeams(
        @CurrentAuth() _auth: AuthContext,
        @Param('uuid') uuid: string,
        @Body() request: UpsertTeamsRequestDto,
    ): Promise<ApiTeam[]> {
        return this.teamsService.upsertTeams(uuid, request);
    }
}
