/*
 NOTE require('foo') is a spec-compliant JS or native function. However, if the function’s behavior depends on
 a receiver (a “this” value), then the first argument to this function will be used as that receiver. The package
 should indicate if this is the case in its README.
 */

import * as types from "./types";
import implementation = require("./implementation");
import getPolyfill = require("./polyfill");
import shim = require("./shim");

const polyfill = getPolyfill();

function exec(regexp: RegExp, string: string): types.RegExpExecArray | null {
    return polyfill.call(regexp, string);
}

exec.implementation = implementation;
exec.getPolyfill = getPolyfill;
exec.shim = shim;

namespace exec {
    export import RegExpExecArray = types.RegExpExecArray;
    export import RegExpExecIndicesArray = types.RegExpExecIndicesArray;
}

export = exec;