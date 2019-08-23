import "../_matchers";
import exec = require("../../implementation");
import { describeEachMode } from "../_matchers/utils";

describeEachMode(() => {
    it("indices-array-matched", () => {
        let input = "abcd";
        let match = exec.call(/b(c)/, input)!;
        let indices = match.indices;
        // `indices` has the same length as match
        expect(indices.length).toBe(match.length);
        // The first element of `indices` contains the start/end indices of the match
        expect(indices[0]).toEqual([1, 3]);
        expect(input.slice(...indices[0])).toEqual(match[0]);
        // The second element of `indices` contains the start/end indices of the first capture
        expect(indices[1]).toEqual([2, 3]);
        expect(input.slice(...indices[1])).toEqual(match[1]);
    });
});
