import "../_matchers";
import exec = require("../../implementation");
import { describeEachMode } from "../_matchers/utils";

describeEachMode(() => {
    it("indices-groups-object-unmatched", () => {
        const re = /(?<a>a).|(?<x>x)/;
        const result = exec.call(re, "ab")!.indices;
        expect(result.groups!.a).toEqual([0, 1]);
        expect(result.groups!.x).toBeUndefined();
    });
});

