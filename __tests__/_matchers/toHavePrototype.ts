import { matcherHint, printExpected, printReceived } from "jest-matcher-utils";

const passMessage = (actual: object | null, expected: object | null) => () =>
    `${
        matcherHint(".not.toHavePrototype")
    }\n\nExpected object to not have the prototype:\n  ${
        printExpected(expected)
    }\nReceived:\n  ${
        printReceived(actual)
    }`;

const failMessage = (actual: object | null, expected: object | null) => () =>
    `${
        matcherHint(".toHavePrototype")
    }\n\nExpected object to have the prototype:\n  ${
        printExpected(expected)
    }\nReceived:\n  ${
        printReceived(actual)
    }`;

export function toHavePrototype<R>(this: jest.MatcherUtils, actual: R, expected: object | null): jest.CustomMatcherResult {
    const ownProto = Object.getPrototypeOf(actual);
    const pass = ownProto === expected;
    const message = pass ? passMessage(ownProto, expected) : failMessage(ownProto, expected);
    return { pass, message };
}

declare global {
    namespace jest {
        interface Matchers<R> {
            toHavePrototype(expected: object | null): R;
        }
    }
}
