import type {
    ApiSyncPushRequest,
    ApiSyncResolveRequest,
    SyncOperation,
    SyncSource,
} from '@xeroscout4/shared';
import {
    IsArray,
    IsDateString,
    IsIn,
    IsNumber,
    IsObject,
    IsString,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class SyncPushChangeDto {
    @IsString()
    tableName!: string;

    @IsNumber()
    rowId!: number;

    @IsIn(['insert', 'update', 'delete'])
    operation!: SyncOperation;

    @IsDateString()
    changedAt!: string;

    @IsObject()
    payload!: Record<string, unknown>;
}

export class SyncPushRequestDto implements ApiSyncPushRequest {
    @IsIn(['central', 'cloud'])
    source!: SyncSource;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SyncPushChangeDto)
    changes!: SyncPushChangeDto[];
}

class SyncResolveConflictDto {
    @IsString()
    tableName!: string;

    @IsNumber()
    rowId!: number;

    @IsObject()
    winningPayload!: Record<string, unknown>;
}

export class SyncResolveRequestDto implements ApiSyncResolveRequest {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SyncResolveConflictDto)
    conflicts!: SyncResolveConflictDto[];
}
