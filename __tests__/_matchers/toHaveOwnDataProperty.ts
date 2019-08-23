import { matcherHint, printExpected, printReceived } from "jest-matcher-utils";
import { printKey, isDataDescriptor, isMatchingDescriptor } from "./utils";

const passMessage = (key: keyof any, actual: PropertyDescriptor | undefined, expected: PropertyDescriptor | undefined) => () =>
    `${
        matcherHint(".not.toHaveOwnDataProperty")
    }\n\nExpected object to not have an own data property ${
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
        matcherHint(".toHaveOwnDataProperty")
    }\n\nExpected object to have an own data property ${
        printKey(key)
    }${
        expected ? ` matching:\n  ${
            printExpected(expected)
        }` : '.'
    }\nReceived:\n  ${
        printReceived(actual)
    }`;

export function toHaveOwnDataProperty<R, K extends keyof R>(this: jest.MatcherUtils, actual: R, key: K, desc?: Omit<TypedPropertyDescriptor<R[K]>, "get" | "set">, options: { equaler?: (a: R[K], b: R[K]) => boolean } = {}): jest.CustomMatcherResult {
    const ownDesc = Object.getOwnPropertyDescriptor(actual, key);
    const pass = !!ownDesc && isDataDescriptor(ownDesc) && isMatchingDescriptor(ownDesc, desc, options.equaler);
    const message = pass ? passMessage(key, ownDesc, desc) : failMessage(key, ownDesc, desc);
    return { pass, message };
}

declare global {
    namespace jest {
        interface Matchers<R> {
            toHaveOwnDataProperty<K extends keyof R>(key: K, desc?: Omit<TypedPropertyDescriptor<R[K]>, "get" | "set">, options?: { equaler?: (a: R[K], b: R[K]) => boolean }): R;
        }
    }
}

