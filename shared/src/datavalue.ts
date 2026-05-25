// DataValue type union — carried from XeroScout 3
export type IPCDataValueType = 'integer' | 'real' | 'string' | 'boolean' | 'array' | 'null' | 'error';
export type IPCDataValue = number | string | boolean | null | IPCTypedDataValue[] | string; // string for error message

export interface IPCTypedDataValue {
    type: IPCDataValueType;
    value: IPCDataValue;
}

export interface IPCNamedDataValue {
    tag: string;
    value: IPCTypedDataValue;
}

export class DataValue {
    static convertFromString(type: IPCDataValueType, str: string): IPCTypedDataValue {
        switch (type) {
            case 'string':   return DataValue.fromString(str);
            case 'integer':  return DataValue.fromInteger(parseInt(str, 10));
            case 'real':     return DataValue.fromReal(parseFloat(str));
            case 'boolean':  return DataValue.fromBoolean(str.toLowerCase() === 'true' || str === '1');
            case 'null':     return DataValue.fromNull();
            default:         throw new Error(`Unsupported type: ${type}`);
        }
    }

    static fromString(value: string): IPCTypedDataValue   { return { type: 'string',  value }; }
    static fromInteger(value: number): IPCTypedDataValue  { return { type: 'integer', value }; }
    static fromReal(value: number): IPCTypedDataValue     { return { type: 'real',    value }; }
    static fromBoolean(value: boolean): IPCTypedDataValue { return { type: 'boolean', value }; }
    static fromNull(): IPCTypedDataValue                  { return { type: 'null',    value: null }; }
    static fromError(err: Error): IPCTypedDataValue       { return { type: 'error',   value: err.message }; }

    static equals(a: IPCTypedDataValue, b: IPCTypedDataValue): boolean {
        if (a.type !== b.type) return false;
        if (a.value === null && b.value === null) return true;
        if (a.value === null || b.value === null) return false;
        if (a.type === 'array') {
            const av = a.value as IPCTypedDataValue[];
            const bv = b.value as IPCTypedDataValue[];
            if (av.length !== bv.length) return false;
            return av.every((v, i) => DataValue.equals(v, bv[i]));
        }
        return a.value === b.value;
    }

    static isNull(a: IPCTypedDataValue):    boolean { return a.type === 'null'; }
    static isInteger(a: IPCTypedDataValue): boolean { return a.type === 'integer'; }
    static isReal(a: IPCTypedDataValue):    boolean { return a.type === 'real'; }
    static isNumber(a: IPCTypedDataValue):  boolean { return a.type === 'integer' || a.type === 'real'; }
    static isString(a: IPCTypedDataValue):  boolean { return a.type === 'string'; }
    static isBoolean(a: IPCTypedDataValue): boolean { return a.type === 'boolean'; }
    static isArray(a: IPCTypedDataValue):   boolean { return a.type === 'array'; }
    static isError(a: IPCTypedDataValue):   boolean { return a.type === 'error'; }
    static isValidType(type: IPCDataValueType): boolean {
        return ['integer', 'real', 'string', 'boolean', 'error', 'array'].includes(type);
    }

    static toBoolean(a: IPCTypedDataValue): boolean {
        if (a.type !== 'boolean') throw new Error(`Cannot convert ${a.type} to boolean`);
        return a.value as boolean;
    }
    static toString(a: IPCTypedDataValue): string {
        if (a.type !== 'string') throw new Error(`Cannot convert ${a.type} to string`);
        return a.value as string;
    }
    static toReal(a: IPCTypedDataValue): number {
        if (a.type !== 'real' && a.type !== 'integer') throw new Error(`Cannot convert ${a.type} to number`);
        return a.value as number;
    }
    static toInteger(a: IPCTypedDataValue): number {
        if (a.type !== 'integer') throw new Error(`Cannot convert ${a.type} to integer`);
        return a.value as number;
    }
    static toArray(a: IPCTypedDataValue): IPCTypedDataValue[] {
        if (a.type !== 'array') throw new Error(`Cannot convert ${a.type} to array`);
        return a.value as IPCTypedDataValue[];
    }

    static toDisplayString(a: IPCTypedDataValue): string {
        if (a.value === null) return 'null';
        switch (a.type) {
            case 'string':  return DataValue.toString(a);
            case 'boolean': return DataValue.toBoolean(a) ? 'true' : 'false';
            case 'integer': return DataValue.toInteger(a).toString();
            case 'real':    return DataValue.toReal(a).toString();
            case 'array': {
                const parts = DataValue.toArray(a).map(v => DataValue.toDisplayString(v));
                return `[${parts.join(',')}]`;
            }
            case 'error':   return `Error: ${typeof a.value === 'string' ? a.value : String(a.value)}`;
            default:        return `Unknown type: ${a.type}`;
        }
    }

    static isTruthy(a: IPCTypedDataValue): boolean {
        if (a.type === 'boolean') return a.value === true;
        if (a.type === 'integer') return (a.value as number) !== 0;
        if (a.type === 'real')    return (a.value as number) !== 0;
        if (a.type === 'string') {
            const s = (a.value as string).trim();
            return s === 'true' || s === 'yes' || s === '1' || s === 't';
        }
        return false;
    }
}
