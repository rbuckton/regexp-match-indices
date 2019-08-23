import { matcherHint, printExpected, printReceived } from "jest-matcher-utils";
import { printKey, isAccessorDescriptor, isMatchingDescriptor } from "./utils";

const passMessage = (key: keyof any, actual: PropertyDescriptor | undefined, expected: PropertyDescriptor | undefined) => () =>
    `${
        matcherHint(".not.toHaveOwnAccessorProperty")
    }\n\nExpected object to not have an own accessor property ${
        printKey(key)
    }${
        expected ? ` matching:\n  ${
            printExpected(expected)
        }` : '.'
    }\nReceived:\n  ${
        printReceived(actual)
    }`;

const failMessage = (key: keyof any, actual: PropertyDescriptor | undefined, expected: PropertyDescriptor | undefined) => () =>
    `${
        matcherHint(".toHaveOwnAccessorProperty")
    }\n\nExpected object to have an own accessor property ${
        printKey(key)
    }${
        expected ? ` matching:\n  ${
            printExpected(expected)
        }` : '.'
    }\nReceived:\n  ${
        printReceived(actual)
    }`;

export function toHaveOwnAccessorProperty<R, K extends keyof R>(this: jest.MatcherUtils, actual: R, key: K, kind?: "get" | "get-set", options?: { equaler?: (a: R[K], b: R[K]) => boolean }): jest.CustomMatcherResult;
export function toHaveOwnAccessorProperty<R, K extends keyof R>(this: jest.MatcherUtils, actual: R, key: K, desc?: Omit<TypedPropertyDescriptor<R[K]>, "writable" | "value" | "get" | "set">, options?: { equaler?: (a: R[K], b: R[K]) => boolean }): jest.CustomMatcherResult;
export function toHaveOwnAccessorProperty<R, K extends keyof R>(this: jest.MatcherUtils, actual: R, key: K, desc?: Omit<TypedPropertyDescriptor<R[K]>, "writable" | "value" | "get" | "set">, kind?: "get" | "get-set", options?: { equaler?: (a: R[K], b: R[K]) => boolean }): jest.CustomMatcherResult;
export function toHaveOwnAccessorProperty<R, K extends keyof R>(this: jest.MatcherUtils, actual: R, key: K, desc?: Omit<TypedPropertyDescriptor<R[K]>, "writable" | "value" | "get" | "set"> | "get" | "get-set", kind?: "get" | "get-set" | { equaler?: (a: R[K], b: R[K]) => boolean }, options?: { equaler?: (a: R[K], b: R[K]) => boolean }): jest.CustomMatcherResult {
    if (typeof kind === "object") options = kind, kind = undefined;
    if (typeof desc === "string") kind = desc, desc = undefined;
    const ownDesc = Object.getOwnPropertyDescriptor(actual, key);
    const pass = !!ownDesc && isAccessorDescriptor(ownDesc, kind) && isMatchingDescriptor(ownDesc, desc, options && options.equaler);
    const message = pass ? passMessage(key, ownDesc, desc) : failMessage(key, ownDesc, desc);
    return { pass, message };
}

declare global {
    namespace jest {
        interface Matchers<R> {
            toHaveOwnAccessorProperty<K extends keyof R>(key: K, desc?: Omit<TypedPropertyDescriptor<R[K]>, "writable" | "value" | "get" | "set">, kind?: "get" | "get-set", options?: { equaler?: (a: R[K], b: R[K]) => boolean }): R;
            toHaveOwnAccessorProperty<K extends keyof R>(key: K, desc?: Omit<TypedPropertyDescriptor<R[K]>, "writable" | "value" | "get" | "set">, options?: { equaler?: (a: R[K], b: R[K]) => boolean }): R;
            toHaveOwnAccessorProperty<K extends keyof R>(key: K, kind?: "get" | "get-set", options?: { equaler?: (a: R[K], b: R[K]) => boolean }): R;
        }
    }
}
