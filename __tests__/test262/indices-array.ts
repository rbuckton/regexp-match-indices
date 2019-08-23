import "../_matchers";
import exec = require("../../implementation");
import { describeEachMode } from "../_matchers/utils";

describeEachMode(() => {
    it("indices-array", () => {
        let indices = exec.call(/a/, "a")!.indices;
        expect(Object.getPrototypeOf(indices)).toBe(Array.prototype);
    });
});
