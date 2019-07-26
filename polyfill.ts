/*
 require('foo').getPolyfill or require('foo/polyfill') is a function that when invoked, will return
 the most compliant and performant function that it can - if a native version is available, and does
 not violate the spec, then the native function will be returned - otherwise, either the implementation,
 or a custom, wrapped version of the native function, will be returned. This is also the result that
 will be used as the default export.
 */

import implementation = require("./implementation");
import * as types from "./types";

const nativeExec = RegExp.prototype.exec;

function getPolyfill(): (this: RegExp, string: string) => types.RegExpExecArray | null {
    const re = new RegExp("a");
    const match = nativeExec.call(re, "a")!;
    if (match.indices) {
        return nativeExec;
    }
    return implementation;
}

export = getPolyfill;