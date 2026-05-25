import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type {
    ApiSyncDeltaResponse,
    ApiSyncPushResponse,
} from '@xeroscout4/shared';
import { ApiKeyGuard } from '../auth/api-key.guard.js';
import { SyncService } from './sync.service.js';
import { SyncPushRequestDto, SyncResolveRequestDto } from './sync.dto.js';

@ApiTags('sync')
@ApiBearerAuth()
@UseGuards(ApiKeyGuard)
@Controller('sync')
export class SyncController {
    constructor(private readonly syncService: SyncService) {}

    @Get('delta')
    getDelta(@Query('since') since: string): Promise<ApiSyncDeltaResponse> {
        return this.syncService.getDelta(since);
    }

    @Post('push')
    push(@Body() request: SyncPushRequestDto): Promise<ApiSyncPushResponse> {
        return this.syncService.pushChanges(request);
    }

    @Post('resolve-conflict')
    resolveConflict(@Body() request: SyncResolveRequestDto): Promise<{ resolved: number }> {
        return this.syncService.resolveConflicts(request);
    }
}
