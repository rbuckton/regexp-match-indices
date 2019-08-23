import "../_matchers";
import exec = require("../../implementation");
import { describeEachMode } from "../_matchers/utils";

describeEachMode(() => {
    it("indices-array-unmatched", () => {
        let input = "abd";
        let match = exec.call(/b(c)?/, input)!;
        let indices = match.indices;
        // `indices` has the same length as match
        expect(indices.length).toBe(match.length);
        // The second element of `indices` should be undefined.
        expect(indices[1]).toBeUndefined();
    });
});
