import "../_matchers";
import exec = require("../../implementation");
import { describeEachMode } from "../_matchers/utils";

describeEachMode(() => {
    it("indices-groups-object-undefined", () => {
        const re = /./;
        const indices = exec.call(re, "a")!.indices;
        expect(indices).toHaveOwnDataProperty('groups', {
            writable: true,
            enumerable: true,
            configurable: true,
            value: undefined
        });
    });
});