import { IPCTypedDataValue } from './datavalue.js';
export type IPCAppType = 'central' | 'scout' | 'coach';
export interface IPCFormula {
    name: string;
    desc: string;
    formula: string;
    owner: IPCAppType;
}
export interface IPCMatchSetRange {
    kind: 'last' | 'first' | 'range' | 'all';
    first: number;
    last: number;
}
export interface IPCMatchSetSpecific {
    kind: 'specific';
    comp_level: string;
    match_number: number;
    set_number: number;
}
export type IPCMatchSet = IPCMatchSetRange | IPCMatchSetSpecific;
export interface IPCDataSet {
    name: string;
    matches: IPCMatchSet;
    formula: string;
}
export interface IPCDataItem {
    label: string;
    name: string;
    dataset: string;
    decimals?: number;
    width?: number;
}
export interface IPCGraphConfig {
    name: string;
    xlabel: string;
    yleft: string;
    yright: string;
    title: string;
    type: string;
    teams: number[];
    leftitems: IPCDataItem[];
    rightitems: IPCDataItem[];
    owner: IPCAppType;
}
export interface IPCDataItemData {
    name: string;
    values: IPCTypedDataValue[];
}
export interface IPCGraphData {
    config: string;
    teams: number[];
    items: IPCDataItemData[];
}
export interface IPCPickListConfig {
    name: string;
    teams: number[];
    columns: IPCDataItem[];
    notes: string[];
    cellColors?: {
        [field: string]: {
            [team: number]: string;
        };
    };
    columnGradients?: {
        [field: string]: 'minmax' | 'box5';
    };
    positionWidth?: number;
    teamWidth?: number;
    nicknameWidth?: number;
    notesWidth?: number;
    owner: IPCAppType;
}
export interface IPCPickListTeamData {
    team: number;
    values: IPCTypedDataValue[];
}
export interface IPCPickListNotes {
    name: string;
    teams: number[];
    notes: string[];
}
export interface IPCPickListData {
    config: IPCPickListConfig;
    data: IPCPickListTeamData[];
}
export interface IPCAlliance {
    teams: [number, number, number];
}
export interface IPCMatchOutcome {
    winner: number;
    loser: number;
}
export interface IPCPlayoffStatus {
    alliances: [
        IPCAlliance | undefined,
        IPCAlliance | undefined,
        IPCAlliance | undefined,
        IPCAlliance | undefined,
        IPCAlliance | undefined,
        IPCAlliance | undefined,
        IPCAlliance | undefined,
        IPCAlliance | undefined
    ];
    outcomes: {
        m1: IPCMatchOutcome | undefined;
        m2: IPCMatchOutcome | undefined;
        m3: IPCMatchOutcome | undefined;
        m4: IPCMatchOutcome | undefined;
        m5: IPCMatchOutcome | undefined;
        m6: IPCMatchOutcome | undefined;
        m7: IPCMatchOutcome | undefined;
        m8: IPCMatchOutcome | undefined;
        m9: IPCMatchOutcome | undefined;
        m10: IPCMatchOutcome | undefined;
        m11: IPCMatchOutcome | undefined;
        m12: IPCMatchOutcome | undefined;
        m13: IPCMatchOutcome | undefined;
        m14: IPCMatchOutcome | undefined;
        m15: IPCMatchOutcome | undefined;
        m16: IPCMatchOutcome | undefined;
    };
}
export type IPCColumnDefnSource = 'form' | 'bluealliance' | 'base' | 'statbotics';
export interface IPCColumnDesc {
    name: string;
    type: string;
    source: IPCColumnDefnSource;
    editable: boolean;
    choices?: Array<{
        text: string;
        value: string | number;
    }>;
}
export interface IPCProjectColumnCfg {
    name: string;
    width: number;
    hidden: boolean;
}
export interface IPCProjColumnsConfig {
    columns: IPCProjectColumnCfg[];
    frozenColumnCount: number;
}
export interface IPCDatabaseData {
    column_configurations: IPCProjColumnsConfig;
    column_definitions: IPCColumnDesc[];
    keycols: string[];
    data: Record<string, unknown>[];
}
export interface IPCCheckDBViewFormula {
    columns: string[];
    formula: string;
    type: string;
    message: string;
    background: string;
    color: string;
    fontFamily: string;
    fontSize: number;
    fontStyle: string;
    fontWeight: string;
}
export interface IPCChange {
    column: string;
    oldvalue: IPCTypedDataValue;
    newvalue: IPCTypedDataValue;
    search: Record<string, unknown>;
}
//# sourceMappingURL=analysistypes.d.ts.map