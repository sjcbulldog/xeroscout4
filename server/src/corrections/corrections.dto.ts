import type { ApiResultType, ApiSubmitCorrectionRequest } from '@xeroscout4/shared';
import {
    IsDefined,
    IsIn,
    IsNumber,
    IsOptional,
    IsString,
} from 'class-validator';

export class SubmitCorrectionDto implements ApiSubmitCorrectionRequest {
    @IsIn(['match', 'team'])
    resultType!: ApiResultType;

    @IsOptional()
    @IsNumber()
    matchId?: number;

    @IsNumber()
    teamNumber!: number;

    @IsString()
    fieldName!: string;

    @IsDefined()
    correctedValue!: unknown;

    @IsOptional()
    originalValue?: unknown;

    @IsString()
    correctedBy!: string;
}
