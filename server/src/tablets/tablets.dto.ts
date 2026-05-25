import type { ApiUpsertTabletsRequest } from '@xeroscout4/shared';
import {
    IsArray,
    IsIn,
    IsNumber,
    IsOptional,
    IsString,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class TabletAssignmentDto {
    @IsOptional()
    @IsNumber()
    matchId?: number;

    @IsOptional()
    @IsNumber()
    teamNumber?: number;

    @IsOptional()
    @IsNumber()
    alliancePosition?: number;
}

class TabletDto {
    @IsString()
    name!: string;

    @IsIn(['match', 'team'])
    purpose!: 'match' | 'team';

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => TabletAssignmentDto)
    assignments!: TabletAssignmentDto[];
}

export class UpsertTabletsRequestDto implements ApiUpsertTabletsRequest {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => TabletDto)
    tablets!: TabletDto[];
}
