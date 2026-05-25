import type { ApiSubmitResultRequest, ApiResultType } from '@xeroscout4/shared';
import {
    IsDateString,
    IsIn,
    IsNumber,
    IsObject,
    IsOptional,
    IsString,
} from 'class-validator';

export class SubmitResultDto implements ApiSubmitResultRequest {
    @IsString()
    tabletName!: string;

    @IsIn(['match', 'team'])
    resultType!: ApiResultType;

    @IsOptional()
    @IsNumber()
    matchId?: number;

    @IsNumber()
    teamNumber!: number;

    @IsObject()
    dataJson!: Record<string, unknown>;

    @IsDateString()
    scoutedAt!: string;
}
