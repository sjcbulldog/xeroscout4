import {
    IsArray,
    IsNumber,
    IsOptional,
    IsString,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class UpsertTeamDto {
    @IsNumber()
    teamNumber!: number;

    @IsString()
    nickname!: string;

    @IsOptional()
    @IsNumber()
    opr?: number | null;

    @IsOptional()
    @IsNumber()
    dpr?: number | null;

    @IsOptional()
    @IsNumber()
    ccwm?: number | null;

    @IsOptional()
    @IsNumber()
    rank?: number | null;

    @IsOptional()
    @IsNumber()
    epa?: number | null;
}

export class UpsertTeamsRequestDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => UpsertTeamDto)
    teams!: UpsertTeamDto[];
}
