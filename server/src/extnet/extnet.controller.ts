import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { ApiKeyGuard } from '../auth/api-key.guard.js';
import { ExtnetService } from './extnet.service.js';

@ApiTags('extnet')
@ApiBearerAuth()
@UseGuards(ApiKeyGuard)
@Controller('extnet')
export class ExtnetController {
    constructor(private readonly extnetService: ExtnetService) {}

    @Get('ba/events/:year')
    async getBaEvents(@Param('year') year: number, @Res({ passthrough: true }) response: Response) {
        const data = await this.extnetService.getBlueAllianceEvents(year);
        if (data === null) {
            response.status(503);
            return { error: 'TBA_API_KEY not set' };
        }
        return data;
    }

    @Get('ba/events/:year/:eventKey/teams')
    async getBaTeams(
        @Param('eventKey') eventKey: string,
        @Res({ passthrough: true }) response: Response,
    ) {
        const data = await this.extnetService.getBlueAllianceTeams(eventKey);
        if (data === null) {
            response.status(503);
            return { error: 'TBA_API_KEY not set' };
        }
        return data;
    }

    @Get('ba/events/:year/:eventKey/matches')
    async getBaMatches(
        @Param('eventKey') eventKey: string,
        @Res({ passthrough: true }) response: Response,
    ) {
        const data = await this.extnetService.getBlueAllianceMatches(eventKey);
        if (data === null) {
            response.status(503);
            return { error: 'TBA_API_KEY not set' };
        }
        return data;
    }

    @Get('ba/events/:year/:eventKey/oprs')
    async getBaOprs(
        @Param('eventKey') eventKey: string,
        @Res({ passthrough: true }) response: Response,
    ) {
        const data = await this.extnetService.getBlueAllianceOprs(eventKey);
        if (data === null) {
            response.status(503);
            return { error: 'TBA_API_KEY not set' };
        }
        return data;
    }

    @Get('ba/events/:year/:eventKey/rankings')
    async getBaRankings(
        @Param('eventKey') eventKey: string,
        @Res({ passthrough: true }) response: Response,
    ) {
        const data = await this.extnetService.getBlueAllianceRankings(eventKey);
        if (data === null) {
            response.status(503);
            return { error: 'TBA_API_KEY not set' };
        }
        return data;
    }

    @Get('statbotics/teams/:year')
    getStatboticsTeams(@Param('year') year: number) {
        return this.extnetService.getStatboticsTeams(year);
    }
}
