import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Post,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { ApiCorrection } from '@xeroscout4/shared';
import { ApiKeyGuard } from '../auth/api-key.guard.js';
import { CurrentAuth } from '../auth/current-auth.decorator.js';
import type { AuthContext } from '../auth/auth.service.js';
import { CorrectionsService } from './corrections.service.js';
import { SubmitCorrectionDto } from './corrections.dto.js';

@ApiTags('corrections')
@ApiBearerAuth()
@UseGuards(ApiKeyGuard)
@Controller('events/:uuid/corrections')
export class CorrectionsController {
    constructor(private readonly correctionsService: CorrectionsService) {}

    @Post()
    createCorrection(
        @CurrentAuth() _auth: AuthContext,
        @Param('uuid') uuid: string,
        @Body() request: SubmitCorrectionDto,
    ): Promise<ApiCorrection> {
        return this.correctionsService.createCorrection(uuid, request);
    }

    @Get()
    listCorrections(
        @CurrentAuth() _auth: AuthContext,
        @Param('uuid') uuid: string,
    ): Promise<{ corrections: ApiCorrection[] }> {
        return this.correctionsService.listCorrections(uuid);
    }

    @Delete(':id')
    deleteCorrection(
        @CurrentAuth() _auth: AuthContext,
        @Param('uuid') uuid: string,
        @Param('id', ParseIntPipe) id: number,
    ): Promise<{ deleted: true }> {
        return this.correctionsService.deleteCorrection(uuid, id);
    }
}
