import "../_matchers";
import exec = require("../../implementation");
import { describeEachMode } from "../_matchers/utils";

describeEachMode(() => {
    it("indices-array-properties", () => {
        let indices = exec.call(/b(c)/, "abcd")!.indices;
        expect(indices).toHaveOwnDataProperty(0, {
            enumerable: true,
            configurable: true,
            writable: true
        });
        expect(indices).toHaveOwnDataProperty(1, {
            enumerable: true,
            configurable: true,
            writable: true
        });
    });
});
