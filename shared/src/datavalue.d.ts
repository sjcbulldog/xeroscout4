export type IPCDataValueType = 'integer' | 'real' | 'string' | 'boolean' | 'array' | 'null' | 'error';
export type IPCDataValue = number | string | boolean | null | IPCTypedDataValue[] | string;
export interface IPCTypedDataValue {
    type: IPCDataValueType;
    value: IPCDataValue;
}
export interface IPCNamedDataValue {
    tag: string;
    value: IPCTypedDataValue;
}
export declare class DataValue {
    static convertFromString(type: IPCDataValueType, str: string): IPCTypedDataValue;
    static fromString(value: string): IPCTypedDataValue;
    static fromInteger(value: number): IPCTypedDataValue;
    static fromReal(value: number): IPCTypedDataValue;
    static fromBoolean(value: boolean): IPCTypedDataValue;
    static fromNull(): IPCTypedDataValue;
    static fromError(err: Error): IPCTypedDataValue;
    static equals(a: IPCTypedDataValue, b: IPCTypedDataValue): boolean;
    static isNull(a: IPCTypedDataValue): boolean;
    static isInteger(a: IPCTypedDataValue): boolean;
    static isReal(a: IPCTypedDataValue): boolean;
    static isNumber(a: IPCTypedDataValue): boolean;
    static isString(a: IPCTypedDataValue): boolean;
    static isBoolean(a: IPCTypedDataValue): boolean;
    static isArray(a: IPCTypedDataValue): boolean;
    static isError(a: IPCTypedDataValue): boolean;
    static isValidType(type: IPCDataValueType): boolean;
    static toBoolean(a: IPCTypedDataValue): boolean;
    static toString(a: IPCTypedDataValue): string;
    static toReal(a: IPCTypedDataValue): number;
    static toInteger(a: IPCTypedDataValue): number;
    static toArray(a: IPCTypedDataValue): IPCTypedDataValue[];
    static toDisplayString(a: IPCTypedDataValue): string;
    static isTruthy(a: IPCTypedDataValue): boolean;
}
//# sourceMappingURL=datavalue.d.ts.map