/*!
Copyright 2019 Ron Buckton

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

/*
 NOTE require('foo') is a spec-compliant JS or native function. However, if the function’s behavior depends on
 a receiver (a “this” value), then the first argument to this function will be used as that receiver. The package
 should indicate if this is the case in its README.
 */

import * as types from "./types";
import implementation = require("./implementation");
import native = require("./native");
import getPolyfill = require("./polyfill");
import shim = require("./shim");
import config = require("./config");

const polyfill = getPolyfill();

function exec(regexp: RegExp, string: string): types.RegExpExecArray | null {
    return polyfill.call(regexp, string);
}

exec.implementation = implementation;
exec.native = native as (this: RegExp, string: string) => types.RegExpExecArray | null;
exec.getPolyfill = getPolyfill;
exec.shim = shim;
exec.config = config;

namespace exec {
    export import RegExpExecArray = types.RegExpExecArray;
    export import RegExpExecIndicesArray = types.RegExpExecIndicesArray;
}

export = exec;