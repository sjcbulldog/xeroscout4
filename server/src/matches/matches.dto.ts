import {
    IsArray,
    IsIn,
    IsNumber,
    IsOptional,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class UpsertMatchDto {
    @IsIn(['qm', 'sf', 'f'])
    compLevel!: 'qm' | 'sf' | 'f';

    @IsNumber()
    matchNumber!: number;

    @IsNumber()
    setNumber!: number;

    @IsNumber()
    red1!: number;

    @IsNumber()
    red2!: number;

    @IsNumber()
    red3!: number;

    @IsNumber()
    blue1!: number;

    @IsNumber()
    blue2!: number;

    @IsNumber()
    blue3!: number;

    @IsOptional()
    @IsNumber()
    redScore?: number | null;

    @IsOptional()
    @IsNumber()
    blueScore?: number | null;
}

export class UpsertMatchesRequestDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => UpsertMatchDto)
    matches!: UpsertMatchDto[];
}
