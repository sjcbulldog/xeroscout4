import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { ApiResultsResponse } from '@xeroscout4/shared';
import { ApiKeyGuard } from '../auth/api-key.guard.js';
import { CurrentAuth } from '../auth/current-auth.decorator.js';
import type { AuthContext } from '../auth/auth.service.js';
import { SubmitResultDto } from './scouting.dto.js';
import { ScoutingService } from './scouting.service.js';

@ApiTags('scouting')
@ApiBearerAuth()
@UseGuards(ApiKeyGuard)
@Controller('events/:uuid/results')
export class ScoutingController {
    constructor(private readonly scoutingService: ScoutingService) {}

    @Post()
    submitResult(
        @CurrentAuth() _auth: AuthContext,
        @Param('uuid') uuid: string,
        @Body() request: SubmitResultDto,
    ): Promise<{ id: number; uploadedAt: string }> {
        return this.scoutingService.submitResult(uuid, request);
    }

    @Get()
    getResults(@CurrentAuth() _auth: AuthContext, @Param('uuid') uuid: string): Promise<ApiResultsResponse> {
        return this.scoutingService.getResults(uuid);
    }

    @Get('raw')
    getRawResults(
        @CurrentAuth() _auth: AuthContext,
        @Param('uuid') uuid: string,
    ): Promise<{ results: import('@xeroscout4/shared').ApiScoutingResult[] }> {
        return this.scoutingService.getRawResults(uuid);
    }
}
