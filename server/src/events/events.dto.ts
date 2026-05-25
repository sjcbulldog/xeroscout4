import type {
    ApiCreateEventRequest,
    ApiUpdateEventRequest,
} from '@xeroscout4/shared';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateEventDto implements ApiCreateEventRequest {
    @IsString()
    name!: string;

    @IsOptional()
    @IsString()
    baEventKey?: string;

    @IsNumber()
    year!: number;
}

export class UpdateEventDto implements ApiUpdateEventRequest {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsBoolean()
    locked?: boolean;

    @IsOptional()
    @IsString()
    teamFormJson?: string;

    @IsOptional()
    @IsString()
    matchFormJson?: string;
}
