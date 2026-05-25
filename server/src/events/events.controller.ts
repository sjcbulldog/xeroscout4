import {
    Body,
    Controller,
    Get,
    Param,
    Post,
    Put,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { ApiEvent, ApiHealthResponse } from '@xeroscout4/shared';
import { ApiKeyGuard } from '../auth/api-key.guard.js';
import { CurrentAuth } from '../auth/current-auth.decorator.js';
import type { AuthContext } from '../auth/auth.service.js';
import { EventsService } from './events.service.js';
import { CreateEventDto, UpdateEventDto } from './events.dto.js';

@ApiTags('events')
@ApiBearerAuth()
@Controller('events')
export class EventsController {
    constructor(private readonly eventsService: EventsService) {}

    @UseGuards(ApiKeyGuard)
    @Get()
    listEvents(@CurrentAuth() _auth: AuthContext): Promise<ApiEvent[]> {
        return this.eventsService.listEvents();
    }

    @UseGuards(ApiKeyGuard)
    @Post()
    createEvent(@CurrentAuth() _auth: AuthContext, @Body() request: CreateEventDto): Promise<ApiEvent> {
        return this.eventsService.createEvent(request);
    }

    @UseGuards(ApiKeyGuard)
    @Get(':uuid')
    getEvent(@CurrentAuth() _auth: AuthContext, @Param('uuid') uuid: string): Promise<ApiEvent> {
        return this.eventsService.getEvent(uuid);
    }

    @UseGuards(ApiKeyGuard)
    @Put(':uuid')
    updateEvent(
        @CurrentAuth() _auth: AuthContext,
        @Param('uuid') uuid: string,
        @Body() request: UpdateEventDto,
    ): Promise<ApiEvent> {
        return this.eventsService.updateEvent(uuid, request);
    }

    @Get(':uuid/health')
    getEventHealth(@Param('uuid') _uuid: string): { status: 'ok' } {
        return this.eventsService.getEventHealth();
    }
}

@ApiTags('health')
@Controller('health')
export class HealthController {
    constructor(private readonly eventsService: EventsService) {}

    @Get()
    getHealth(): ApiHealthResponse {
        return this.eventsService.getHealth();
    }
}
