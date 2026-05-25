"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataValue = void 0;
class DataValue {
    static convertFromString(type, str) {
        switch (type) {
            case 'string': return DataValue.fromString(str);
            case 'integer': return DataValue.fromInteger(parseInt(str, 10));
            case 'real': return DataValue.fromReal(parseFloat(str));
            case 'boolean': return DataValue.fromBoolean(str.toLowerCase() === 'true' || str === '1');
            case 'null': return DataValue.fromNull();
            default: throw new Error(`Unsupported type: ${type}`);
        }
    }
    static fromString(value) { return { type: 'string', value }; }
    static fromInteger(value) { return { type: 'integer', value }; }
    static fromReal(value) { return { type: 'real', value }; }
    static fromBoolean(value) { return { type: 'boolean', value }; }
    static fromNull() { return { type: 'null', value: null }; }
    static fromError(err) { return { type: 'error', value: err.message }; }
    static equals(a, b) {
        if (a.type !== b.type)
            return false;
        if (a.value === null && b.value === null)
            return true;
        if (a.value === null || b.value === null)
            return false;
        if (a.type === 'array') {
            const av = a.value;
            const bv = b.value;
            if (av.length !== bv.length)
                return false;
            return av.every((v, i) => DataValue.equals(v, bv[i]));
        }
        return a.value === b.value;
    }
    static isNull(a) { return a.type === 'null'; }
    static isInteger(a) { return a.type === 'integer'; }
    static isReal(a) { return a.type === 'real'; }
    static isNumber(a) { return a.type === 'integer' || a.type === 'real'; }
    static isString(a) { return a.type === 'string'; }
    static isBoolean(a) { return a.type === 'boolean'; }
    static isArray(a) { return a.type === 'array'; }
    static isError(a) { return a.type === 'error'; }
    static isValidType(type) {
        return ['integer', 'real', 'string', 'boolean', 'error', 'array'].includes(type);
    }
    static toBoolean(a) {
        if (a.type !== 'boolean')
            throw new Error(`Cannot convert ${a.type} to boolean`);
        return a.value;
    }
    static toString(a) {
        if (a.type !== 'string')
            throw new Error(`Cannot convert ${a.type} to string`);
        return a.value;
    }
    static toReal(a) {
        if (a.type !== 'real' && a.type !== 'integer')
            throw new Error(`Cannot convert ${a.type} to number`);
        return a.value;
    }
    static toInteger(a) {
        if (a.type !== 'integer')
            throw new Error(`Cannot convert ${a.type} to integer`);
        return a.value;
    }
    static toArray(a) {
        if (a.type !== 'array')
            throw new Error(`Cannot convert ${a.type} to array`);
        return a.value;
    }
    static toDisplayString(a) {
        if (a.value === null)
            return 'null';
        switch (a.type) {
            case 'string': return DataValue.toString(a);
            case 'boolean': return DataValue.toBoolean(a) ? 'true' : 'false';
            case 'integer': return DataValue.toInteger(a).toString();
            case 'real': return DataValue.toReal(a).toString();
            case 'array': {
                const parts = DataValue.toArray(a).map(v => DataValue.toDisplayString(v));
                return `[${parts.join(',')}]`;
            }
            case 'error': return `Error: ${typeof a.value === 'string' ? a.value : String(a.value)}`;
            default: return `Unknown type: ${a.type}`;
        }
    }
    static isTruthy(a) {
        if (a.type === 'boolean')
            return a.value === true;
        if (a.type === 'integer')
            return a.value !== 0;
        if (a.type === 'real')
            return a.value !== 0;
        if (a.type === 'string') {
            const s = a.value.trim();
            return s === 'true' || s === 'yes' || s === '1' || s === 't';
        }
        return false;
    }
}
exports.DataValue = DataValue;
//# sourceMappingURL=datavalue.js.map