import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { ApiImageDataResponse, ApiImageInfo } from '@xeroscout4/shared';
import { ApiKeyGuard } from '../auth/api-key.guard.js';
import { CurrentAuth } from '../auth/current-auth.decorator.js';
import type { AuthContext } from '../auth/auth.service.js';
import { ImagesService } from './images.service.js';
import { UploadImageDto } from './images.dto.js';

@ApiTags('images')
@ApiBearerAuth()
@UseGuards(ApiKeyGuard)
@Controller('events/:uuid/images')
export class ImagesController {
    constructor(private readonly imagesService: ImagesService) {}

    @Get()
    listImages(
        @CurrentAuth() _auth: AuthContext,
        @Param('uuid') uuid: string,
    ): Promise<{ images: ApiImageInfo[] }> {
        return this.imagesService.listImages(uuid);
    }

    @Get(':name')
    getImage(
        @CurrentAuth() _auth: AuthContext,
        @Param('uuid') uuid: string,
        @Param('name') name: string,
    ): Promise<ApiImageDataResponse> {
        return this.imagesService.getImage(uuid, name);
    }

    @Post()
    uploadImage(
        @CurrentAuth() _auth: AuthContext,
        @Param('uuid') uuid: string,
        @Body() request: UploadImageDto,
    ): Promise<ApiImageInfo> {
        return this.imagesService.uploadImage(uuid, request);
    }

    @Delete(':name')
    deleteImage(
        @CurrentAuth() _auth: AuthContext,
        @Param('uuid') uuid: string,
        @Param('name') name: string,
    ): Promise<{ deleted: true }> {
        return this.imagesService.deleteImage(uuid, name);
    }
}
