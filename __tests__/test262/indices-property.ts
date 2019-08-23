import "../_matchers";
import exec = require("../../implementation");
import { describeEachMode } from "../_matchers/utils";

describeEachMode(() => {
    it("indices-property", () => {
        let match = exec.call(/a/, "a")!;
        // trigger lazy evaluation
        void match.indices;
        expect(match).toHaveOwnDataProperty("indices", {
            writable: true,
            enumerable: true,
            configurable: true
        });
    });
});
