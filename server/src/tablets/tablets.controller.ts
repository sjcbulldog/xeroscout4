import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { ApiTablet, ApiTabletInitResponse } from '@xeroscout4/shared';
import { ApiKeyGuard } from '../auth/api-key.guard.js';
import { CurrentAuth } from '../auth/current-auth.decorator.js';
import type { AuthContext } from '../auth/auth.service.js';
import { TabletsService } from './tablets.service.js';
import { UpsertTabletsRequestDto } from './tablets.dto.js';

@ApiTags('tablets')
@ApiBearerAuth()
@UseGuards(ApiKeyGuard)
@Controller('events/:uuid/tablets')
export class TabletsController {
    constructor(private readonly tabletsService: TabletsService) {}

    @Get()
    listTablets(@CurrentAuth() _auth: AuthContext, @Param('uuid') uuid: string): Promise<ApiTablet[]> {
        return this.tabletsService.listTablets(uuid);
    }

    @Put()
    replaceTablets(
        @CurrentAuth() _auth: AuthContext,
        @Param('uuid') uuid: string,
        @Body() request: UpsertTabletsRequestDto,
    ): Promise<ApiTablet[]> {
        return this.tabletsService.replaceTablets(uuid, request);
    }

    @Get('tablet-init/:tabletName')
    getTabletInit(
        @CurrentAuth() _auth: AuthContext,
        @Param('uuid') uuid: string,
        @Param('tabletName') tabletName: string,
    ): Promise<ApiTabletInitResponse> {
        return this.tabletsService.getTabletInit(uuid, tabletName);
    }
}
