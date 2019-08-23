import { matcherHint, printExpected, printReceived } from "jest-matcher-utils";
import { printKey, isDataDescriptor, isMatchingDescriptor } from "./utils";

const passMessage = (key: keyof any, actual: PropertyDescriptor | undefined, expected: PropertyDescriptor | undefined) => () =>
    `${
        matcherHint(".not.toHaveOwnProperty")
    }\n\nExpected object to not have an own property ${
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
        matcherHint(".toHaveOwnProperty")
    }\n\nExpected object to have an own property ${
        printKey(key)
    }${
        expected ? ` matching:\n  ${
            printExpected(expected)
        }` : '.'
    }\nReceived:\n  ${
        printReceived(actual)
    }`;

export function toHaveOwnProperty<R, K extends keyof R>(this: jest.MatcherUtils, actual: R, key: K, desc?: Omit<TypedPropertyDescriptor<R[K]>, "writable" | "value" | "get" | "set">): jest.CustomMatcherResult {
    const ownDesc = Object.getOwnPropertyDescriptor(actual, key);
    const pass = !!ownDesc && isMatchingDescriptor(ownDesc, desc);
    const message = pass ? passMessage(key, ownDesc, desc) : failMessage(key, ownDesc, desc);
    return { pass, message };
}

declare global {
    namespace jest {
        interface Matchers<R> {
            toHaveOwnProperty<K extends keyof R>(key: K, desc?: Omit<TypedPropertyDescriptor<R[K]>, "writable" | "value" | "get" | "set">): R;
        }
    }
}
