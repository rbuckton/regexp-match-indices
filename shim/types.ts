/*
 require('foo/auto') will automatically invoke the shim method.
 */

import * as types from "../types";

declare global {
    interface RegExpExecArray {
        readonly indices: RegExpExecIndicesArray;
    }

    interface RegExpExecIndicesArray extends types.RegExpExecIndicesArray {
    }
}
