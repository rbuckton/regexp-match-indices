/*
 require('foo').shim or require('foo/shim') is a function that when invoked, will call getPolyfill, 
 and if the polyfill doesn’t match the built-in value, will install it into the global environment.
 */

import getPolyfill = require("./polyfill");

function shim() {
    const polyfill = getPolyfill();
    if (RegExp.prototype.exec !== polyfill) {
        RegExp.prototype.exec = polyfill;
    }
}

export = shim;