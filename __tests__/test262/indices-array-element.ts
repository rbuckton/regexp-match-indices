import "../_matchers";
import exec = require("../../implementation");
import { describeEachMode } from "../_matchers/utils";

describeEachMode(() => {
    it("indices-array-elements", () => {
        let indices = exec.call(/b(c)/, "abcd")!.indices;
        expect(indices[0]).toBeArrayOfSize(2);
        expect(indices[0][0]).toBeNumber();
        expect(indices[0][1]).toBeNumber();
        expect(indices[1]).toBeArrayOfSize(2);
        expect(indices[1][0]).toBeNumber();
        expect(indices[1][1]).toBeNumber();
    });
});
