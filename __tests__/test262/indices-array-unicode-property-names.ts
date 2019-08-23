import "../_matchers";
import exec = require("../../implementation");
import { describeEachMode } from "../_matchers/utils";
import { parse } from "regexp-tree";

const suite = () => {
    describeEachMode(() => {
        it("indices-array-unicode-property-names", () => {
            expect(exec.call(/(?<π>a)/u, "bab")!.indices.groups!.π).toEqual([1, 2]);
            expect(exec.call(/(?<\u{03C0}>a)/u, "bab")!.indices.groups!.π).toEqual([1, 2]);
            expect(exec.call(/(?<π>a)/u, "bab")!.indices.groups!.\u03C0).toEqual([1, 2]);
            expect(exec.call(/(?<\u{03C0}>a)/u, "bab")!.indices.groups!.\u03C0).toEqual([1, 2]);
            expect(exec.call(/(?<$>a)/u, "bab")!.indices.groups!.$).toEqual([1, 2]);
            expect(exec.call(/(?<_>a)/u, "bab")!.indices.groups!._).toEqual([1, 2]);
            expect(exec.call(/(?<$𐒤>a)/u, "bab")!.indices.groups!["$𐒤"]).toEqual([1, 2]);
            expect(exec.call(/(?<_\u200C>a)/u, "bab")!.indices.groups!["_\u200C"]).toEqual([1, 2]);
            expect(exec.call(/(?<_\u200D>a)/u, "bab")!.indices.groups!["_\u200D"]).toEqual([1, 2]);
            expect(exec.call(/(?<ಠ_ಠ>a)/u, "bab")!.indices.groups!.ಠ_ಠ).toEqual([1, 2]);
        });
    });
};

// NOTE: This suite requires https://github.com/DmitrySoshnikov/regexp-tree/pull/184
let supportsUnicode: boolean;
try {
    parse("/(?<π>a)/u");
    parse("/(?<\\u{03C0}>a)/u");
    supportsUnicode = true;
}
catch {
    supportsUnicode = false;
}

if (supportsUnicode) {
    suite();
}
else {
    describe.skip("indices-array-unicode-property-names requires https://github.com/DmitrySoshnikov/regexp-tree/pull/184", suite);
}
