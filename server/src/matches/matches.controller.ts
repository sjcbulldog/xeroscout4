import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { ApiMatch } from '@xeroscout4/shared';
import { ApiKeyGuard } from '../auth/api-key.guard.js';
import { CurrentAuth } from '../auth/current-auth.decorator.js';
import type { AuthContext } from '../auth/auth.service.js';
import { MatchesService } from './matches.service.js';
import { UpsertMatchesRequestDto } from './matches.dto.js';

@ApiTags('matches')
@ApiBearerAuth()
@UseGuards(ApiKeyGuard)
@Controller('events/:uuid/matches')
export class MatchesController {
    constructor(private readonly matchesService: MatchesService) {}

    @Get()
    listMatches(@CurrentAuth() _auth: AuthContext, @Param('uuid') uuid: string): Promise<ApiMatch[]> {
        return this.matchesService.listMatches(uuid);
    }

    @Put()
    upsertMatches(
        @CurrentAuth() _auth: AuthContext,
        @Param('uuid') uuid: string,
        @Body() request: UpsertMatchesRequestDto,
    ): Promise<ApiMatch[]> {
        return this.matchesService.upsertMatches(uuid, request);
    }
}
