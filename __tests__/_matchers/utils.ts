import config = require("../../config");

export function printKey(key: keyof any) {
    return typeof key === 'symbol' ? key.toString() : JSON.stringify(key);
}

export function isDataDescriptor(desc: PropertyDescriptor) {
    return typeof desc === 'object' && desc !== null &&
        Object.hasOwnProperty.call(desc, 'value') &&
        !Object.hasOwnProperty.call(desc, 'get') &&
        !Object.hasOwnProperty.call(desc, 'set');
}

export function isAccessorDescriptor(desc: PropertyDescriptor, kind?: 'get' | 'get-set') {
    if (typeof desc !== 'object' || desc === null ||
        Object.hasOwnProperty.call(desc, 'value') ||
        Object.hasOwnProperty.call(desc, 'writable') ||
        !Object.hasOwnProperty.call(desc, 'get') &&
        !Object.hasOwnProperty.call(desc, "set")) {
        return false;
    }
    if (kind === 'get' || kind === 'get-set') {
        if (!Object.hasOwnProperty.call(desc, 'get') || desc.get === undefined) {
            return false;
        }
    }
    if (kind === 'get-set') {
        if (!Object.hasOwnProperty.call(desc, 'set') || desc.set === undefined) {
            return false;
        }
    }
    if (kind === 'get') {
        if (Object.hasOwnProperty.call(desc, 'set') && desc.set !== undefined) {
            return false;
        }
    }
    return true;
}

export function isMatchingDescriptor<T>(actual: TypedPropertyDescriptor<T>, expected: Omit<TypedPropertyDescriptor<T>, "get" | "set"> = {}, equaler: (a: T, b: T) => boolean = Object.is) {
    if (Object.prototype.hasOwnProperty.call(expected, 'value')) {
        if (expected.value === undefined ? actual.value !== undefined : actual.value === undefined || !equaler(expected.value, actual.value)) {
            return false;
        }
    }

    if (Object.prototype.hasOwnProperty.call(expected, 'enumerable')) {
        if (expected.enumerable !== actual.enumerable) {
            return false;
        }
    }

    if (Object.prototype.hasOwnProperty.call(expected, 'writable')) {
        if (expected.writable !== actual.writable) {
            return false;
        }
    }

    if (Object.prototype.hasOwnProperty.call(expected, 'configurable')) {
        if (expected.configurable !== actual.configurable) {
            return false;
        }
    }

    return true;
}

export function setupMode(mode: "lazy" | "spec-compliant") {
    beforeEach(() => {
        const savedMode = config.mode;
        config.mode = mode;
        afterEach(() => { config.mode = savedMode; });
    });
}

export function describeEachMode(cb: (mode: "lazy" | "spec-compliant") => void) {
    describe.each`
        mode
        ${"lazy"}
        ${"spec-compliant"}
    `('$mode', ({ mode }) => {
        setupMode(mode);
        cb(mode);
    });
}