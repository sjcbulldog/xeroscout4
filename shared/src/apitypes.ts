// REST API request/response types shared between server, central, and tablet

import { IPCFormPurpose, IPCForm, IPCNamedDataValue } from './formtypes.js';
import { IPCFormula, IPCDataSet, IPCGraphConfig, IPCPickListConfig, IPCPickListData, IPCPlayoffStatus, IPCGraphData } from './analysistypes.js';

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface ApiValidateKeyResponse {
    valid: boolean;
    teamNumber?: number;
    label?: string;
}

// ─── Events ──────────────────────────────────────────────────────────────────

export interface ApiEvent {
    uuid: string;
    name: string;
    baEventKey: string | null;
    year: number;
    locked: boolean;
    startDate: string | null;
    endDate: string | null;
    teamFormJson: string | null;
    matchFormJson: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface ApiCreateEventRequest {
    name: string;
    baEventKey?: string;
    year: number;
}

export interface ApiUpdateEventRequest {
    name?: string;
    locked?: boolean;
    teamFormJson?: string;
    matchFormJson?: string;
}

// ─── Teams ────────────────────────────────────────────────────────────────────

export interface ApiTeam {
    teamNumber: number;
    nickname: string;
    opr: number | null;
    dpr: number | null;
    ccwm: number | null;
    rank: number | null;
    epa: number | null;
    updatedAt: string;
}

export interface ApiUpsertTeamsRequest {
    teams: Array<Omit<ApiTeam, 'updatedAt'>>;
}

// ─── Matches ─────────────────────────────────────────────────────────────────

export interface ApiMatch {
    id: number;
    compLevel: 'qm' | 'sf' | 'f';
    matchNumber: number;
    setNumber: number;
    red1: number;
    red2: number;
    red3: number;
    blue1: number;
    blue2: number;
    blue3: number;
    redScore: number | null;
    blueScore: number | null;
    updatedAt: string;
}

export interface ApiUpsertMatchesRequest {
    matches: Array<Omit<ApiMatch, 'id' | 'updatedAt'>>;
}

// ─── Tablets ─────────────────────────────────────────────────────────────────

export interface ApiTablet {
    id: number;
    name: string;
    purpose: IPCFormPurpose;
    assignments: ApiTabletAssignment[];
}

export interface ApiTabletAssignment {
    id: number;
    matchId: number | null;
    teamNumber: number | null;
    alliancePosition: number | null;
}

export interface ApiUpsertTabletsRequest {
    tablets: Array<{
        name: string;
        purpose: IPCFormPurpose;
        assignments: Array<{
            matchId?: number;
            teamNumber?: number;
            alliancePosition?: number;
        }>;
    }>;
}

// Tablet bootstrap — everything a tablet needs in one call
export interface ApiTabletInitResponse {
    tablet: ApiTablet;
    form: IPCForm;
    eventUuid: string;
    eventName: string;
    teams: Array<{ teamNumber: number; nickname: string }>;
    matches: ApiMatch[];
}

// ─── Scouting Results ─────────────────────────────────────────────────────────

export type ApiResultSource = 'tablet' | 'central';
export type ApiResultType = 'match' | 'team';

export interface ApiSubmitResultRequest {
    tabletName: string;
    resultType: ApiResultType;
    matchId?: number;
    teamNumber: number;
    dataJson: Record<string, unknown>;    // field tag → value
    scoutedAt: string;                    // ISO 8601 from tablet clock
}

export interface ApiScoutingResult {
    id: number;
    tabletName: string;
    resultType: ApiResultType;
    matchId: number | null;
    teamNumber: number;
    dataJson: Record<string, unknown>;
    scoutedAt: string;
    uploadedAt: string;
    source: ApiResultSource;
}

// GET /results — corrections already applied
export interface ApiResultsResponse {
    results: ApiScoutingResult[];
    correctionCount: number;
}

// ─── Corrections ─────────────────────────────────────────────────────────────

export interface ApiSubmitCorrectionRequest {
    resultType: ApiResultType;
    matchId?: number;
    teamNumber: number;
    fieldName: string;
    correctedValue: unknown;              // JSON-serialisable DataValue
    originalValue?: unknown;
    correctedBy: string;
}

export interface ApiCorrection {
    id: number;
    resultType: ApiResultType;
    matchId: number | null;
    teamNumber: number;
    fieldName: string;
    correctedValue: unknown;
    originalValue: unknown | null;
    correctedBy: string;
    correctedAt: string;
}

// ─── Analysis ────────────────────────────────────────────────────────────────

export interface ApiFormulasResponse   { formulas: IPCFormula[]; }
export interface ApiDatasetsResponse   { datasets: IPCDataSet[]; }
export interface ApiGraphsResponse     { graphs: IPCGraphConfig[]; }
export interface ApiPicklistsResponse  { picklists: IPCPickListConfig[]; }
export interface ApiPicklistDataResponse { data: IPCPickListData; }
export interface ApiGraphDataResponse  { data: IPCGraphData; }
export interface ApiPlayoffResponse    { bracket: IPCPlayoffStatus; }

export interface ApiUpsertFormulasRequest  { formulas: IPCFormula[]; }
export interface ApiUpsertDatasetsRequest  { datasets: IPCDataSet[]; }
export interface ApiUpsertGraphsRequest    { graphs: IPCGraphConfig[]; }
export interface ApiUpsertPicklistsRequest { picklists: IPCPickListConfig[]; }
export interface ApiSetPlayoffRequest      { bracket: IPCPlayoffStatus; }

// ─── Sync (Central ↔ Cloud) ──────────────────────────────────────────────────

export type SyncOperation = 'insert' | 'update' | 'delete';
export type SyncSource = 'central' | 'cloud';

export interface SyncLogEntry {
    id: number;
    tableName: string;
    rowId: number;
    operation: SyncOperation;
    changedAt: string;
    source: SyncSource;
}

export interface ApiSyncDeltaResponse {
    changes: SyncLogEntry[];
    since: string;
    serverTime: string;
}

export interface ApiSyncPushRequest {
    source: SyncSource;
    changes: Array<{
        tableName: string;
        rowId: number;
        operation: SyncOperation;
        changedAt: string;
        payload: Record<string, unknown>;
    }>;
}

export interface ApiSyncPushResponse {
    accepted: number;
    conflicts: Array<{
        tableName: string;
        rowId: number;
        reason: string;
    }>;
}

export interface ApiSyncResolveRequest {
    conflicts: Array<{
        tableName: string;
        rowId: number;
        winningPayload: Record<string, unknown>;
    }>;
}

// ─── Images ──────────────────────────────────────────────────────────────────

export interface ApiImageInfo {
    name: string;
    sizeBytes: number;
}

export interface ApiImageDataResponse {
    name: string;
    data: string;  // base64-encoded PNG/SVG
    mimeType: string;
}

// ─── Health ──────────────────────────────────────────────────────────────────

export interface ApiHealthResponse {
    status: 'ok';
    version: string;
    uptime: number;
}
