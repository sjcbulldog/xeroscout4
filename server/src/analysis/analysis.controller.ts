import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type {
    IPCDataSet,
    IPCFormula,
    IPCGraphConfig,
    IPCPickListConfig,
    IPCPlayoffStatus,
} from '@xeroscout4/shared';
import { ApiKeyGuard } from '../auth/api-key.guard.js';
import { CurrentAuth } from '../auth/current-auth.decorator.js';
import type { AuthContext } from '../auth/auth.service.js';
import {
    SetPlayoffRequestDto,
    UpsertDatasetsRequestDto,
    UpsertFormulasRequestDto,
    UpsertGraphsRequestDto,
    UpsertPicklistsRequestDto,
} from './analysis.dto.js';
import { AnalysisService } from './analysis.service.js';

@ApiTags('analysis')
@ApiBearerAuth()
@UseGuards(ApiKeyGuard)
@Controller('events/:uuid')
export class AnalysisController {
    constructor(private readonly analysisService: AnalysisService) {}

    @Get('formulas')
    listFormulas(@CurrentAuth() _auth: AuthContext, @Param('uuid') uuid: string): Promise<{ formulas: IPCFormula[] }> {
        return this.analysisService.listFormulas(uuid);
    }

    @Put('formulas')
    replaceFormulas(
        @CurrentAuth() _auth: AuthContext,
        @Param('uuid') uuid: string,
        @Body() request: UpsertFormulasRequestDto,
    ): Promise<{ formulas: IPCFormula[] }> {
        return this.analysisService.replaceFormulas(uuid, request);
    }

    @Get('datasets')
    listDatasets(@CurrentAuth() _auth: AuthContext, @Param('uuid') uuid: string): Promise<{ datasets: IPCDataSet[] }> {
        return this.analysisService.listDatasets(uuid);
    }

    @Put('datasets')
    replaceDatasets(
        @CurrentAuth() _auth: AuthContext,
        @Param('uuid') uuid: string,
        @Body() request: UpsertDatasetsRequestDto,
    ): Promise<{ datasets: IPCDataSet[] }> {
        return this.analysisService.replaceDatasets(uuid, request);
    }

    @Get('graphs')
    listGraphs(@CurrentAuth() _auth: AuthContext, @Param('uuid') uuid: string): Promise<{ graphs: IPCGraphConfig[] }> {
        return this.analysisService.listGraphs(uuid);
    }

    @Put('graphs')
    replaceGraphs(
        @CurrentAuth() _auth: AuthContext,
        @Param('uuid') uuid: string,
        @Body() request: UpsertGraphsRequestDto,
    ): Promise<{ graphs: IPCGraphConfig[] }> {
        return this.analysisService.replaceGraphs(uuid, request);
    }

    @Get('picklists')
    listPicklists(
        @CurrentAuth() _auth: AuthContext,
        @Param('uuid') uuid: string,
    ): Promise<{ picklists: IPCPickListConfig[] }> {
        return this.analysisService.listPicklists(uuid);
    }

    @Put('picklists')
    replacePicklists(
        @CurrentAuth() _auth: AuthContext,
        @Param('uuid') uuid: string,
        @Body() request: UpsertPicklistsRequestDto,
    ): Promise<{ picklists: IPCPickListConfig[] }> {
        return this.analysisService.replacePicklists(uuid, request);
    }

    @Get('playoff')
    getPlayoff(
        @CurrentAuth() _auth: AuthContext,
        @Param('uuid') uuid: string,
    ): Promise<{ bracket: IPCPlayoffStatus | null }> {
        return this.analysisService.getPlayoff(uuid);
    }

    @Put('playoff')
    setPlayoff(
        @CurrentAuth() _auth: AuthContext,
        @Param('uuid') uuid: string,
        @Body() request: SetPlayoffRequestDto,
    ): Promise<{ bracket: IPCPlayoffStatus }> {
        return this.analysisService.setPlayoff(uuid, request);
    }
}
