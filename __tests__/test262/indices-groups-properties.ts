import "../_matchers";
import exec = require("../../implementation");
import { describeEachMode } from "../_matchers/utils";

describeEachMode(() => {
    it("indices-groups-properties", () => {
    });
});

// // Properties created on result.groups in textual order.
// let groupNames = Object.getOwnPropertyNames(/(?<fst>.)|(?<snd>.)/u.exec("abcd").indices.groups);
// assert.compareArray(groupNames, ["fst", "snd"]);

// // // Properties are created with Define, not Set
// // let counter = 0;
// // Object.defineProperty(Object.prototype, 'x', {set() { counter++; }});

// let indices = /(?<x>.)/.exec('a').indices;
// let groups = indices.groups;
// // assert.sameValue(counter, 0);

// // Properties are writable, enumerable and configurable
// // (from CreateDataProperty)
// assert.hasOwnDataProperty(groups, 'x', {
//     writable: true,
//     enumerable: true,
//     configurable: true
// });