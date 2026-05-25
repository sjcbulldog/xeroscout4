import type {
    ApiSetPlayoffRequest,
    ApiUpsertDatasetsRequest,
    ApiUpsertFormulasRequest,
    ApiUpsertGraphsRequest,
    ApiUpsertPicklistsRequest,
    IPCDataSet,
    IPCFormula,
    IPCGraphConfig,
    IPCPickListConfig,
    IPCPlayoffStatus,
} from '@xeroscout4/shared';
import {
    IsArray,
    IsDefined,
    IsObject,
    IsString,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class FormulaDto implements IPCFormula {
    @IsString()
    name!: string;

    @IsString()
    desc!: string;

    @IsString()
    formula!: string;

    @IsString()
    owner!: IPCFormula['owner'];
}

class JsonDatasetDto implements IPCDataSet {
    @IsString()
    name!: string;

    @IsObject()
    matches!: IPCDataSet['matches'];

    @IsString()
    formula!: string;
}

class JsonGraphDto implements IPCGraphConfig {
    @IsString()
    name!: string;

    @IsString()
    xlabel!: string;

    @IsString()
    yleft!: string;

    @IsString()
    yright!: string;

    @IsString()
    title!: string;

    @IsString()
    type!: string;

    @IsArray()
    teams!: number[];

    @IsArray()
    leftitems!: IPCGraphConfig['leftitems'];

    @IsArray()
    rightitems!: IPCGraphConfig['rightitems'];

    @IsString()
    owner!: IPCGraphConfig['owner'];
}

class JsonPicklistDto implements IPCPickListConfig {
    @IsString()
    name!: string;

    @IsArray()
    teams!: number[];

    @IsArray()
    columns!: IPCPickListConfig['columns'];

    @IsArray()
    notes!: string[];

    cellColors?: IPCPickListConfig['cellColors'];
    columnGradients?: IPCPickListConfig['columnGradients'];
    positionWidth?: number;
    teamWidth?: number;
    nicknameWidth?: number;
    notesWidth?: number;

    @IsString()
    owner!: IPCPickListConfig['owner'];
}

export class UpsertFormulasRequestDto implements ApiUpsertFormulasRequest {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => FormulaDto)
    formulas!: FormulaDto[];
}

export class UpsertDatasetsRequestDto implements ApiUpsertDatasetsRequest {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => JsonDatasetDto)
    datasets!: JsonDatasetDto[];
}

export class UpsertGraphsRequestDto implements ApiUpsertGraphsRequest {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => JsonGraphDto)
    graphs!: JsonGraphDto[];
}

export class UpsertPicklistsRequestDto implements ApiUpsertPicklistsRequest {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => JsonPicklistDto)
    picklists!: JsonPicklistDto[];
}

export class SetPlayoffRequestDto implements ApiSetPlayoffRequest {
    @IsDefined()
    bracket!: IPCPlayoffStatus;
}
