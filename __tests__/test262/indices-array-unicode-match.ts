import "../_matchers";
import exec = require("../../implementation");
import { describeEachMode } from "../_matchers/utils";

describeEachMode(() => {
    describe("indices-array-unicode-match", () => {
        it("indices", () => {
            expect(exec.call(/(a)/u, "bab")!.indices).toEqual([[1, 2], [1, 2]]);
            expect(exec.call(/.(a)./u, "bab")!.indices).toEqual([[0, 3], [1, 2]]);
            expect(exec.call(/.(a)(.)/u, "bab")!.indices).toEqual([[0, 3], [1, 2], [2, 3]]);
            expect(exec.call(/.(\w\w)/u, "bab")!.indices).toEqual([[0, 3], [1, 3]]);
            expect(exec.call(/(\w\w\w)/u, "bab")!.indices).toEqual([[0, 3], [0, 3]]);
            expect(exec.call(/(\w\w)(\w)/u, "bab")!.indices).toEqual([[0, 3], [0, 2], [2, 3]]);
            expect(exec.call(/(\w\w)(\W)?/u, "bab")!.indices).toEqual([[0, 2], [0, 2], undefined]);
        });
        it("groups", () => {
            let groups = exec.call(/(?<a>.)(?<b>.)(?<c>.)\k<c>\k<b>\k<a>/u, "abccba")!.indices.groups!;
            expect(groups).toHaveOwnDataProperty("a", {
                enumerable: true,
                writable: true,
                configurable: true
            });
            expect(groups.a).toEqual([0, 1]);
            expect(groups).toHaveOwnDataProperty("b", {
                enumerable: true,
                writable: true,
                configurable: true
            });
            expect(groups.b).toEqual([1, 2]);
            expect(groups).toHaveOwnDataProperty("c", {
                enumerable: true,
                writable: true,
                configurable: true
            });
            expect(groups.c).toEqual([2, 3]);
        })
        it("surrogate pairs", () => {
            // "𝐁" is U+1d401 MATHEMATICAL BOLD CAPITAL B
            // - Also representable as the code point "\u{1d401}"
            // - Also representable as the surrogate pair "\uD835\uDC01"

            // Verify assumptions:
            expect("𝐁", 'The length of "𝐁" is 2').toHaveLength(2);
            expect("\u{1d401}", 'The length of "\\u{1d401}" is 2').toHaveLength(2);
            expect("\uD835\uDC01", 'The length of "\\uD835\\uDC01" is 2').toHaveLength(2);
            expect("𝐁".match(/./u)![0], 'The length of a single code unit match against "𝐁" is 1 (without /u flag)').toHaveLength(2);
            expect("\u{1d401}".match(/./u)![0], 'The length of a single code unit match against "\\u{1d401}" is 1 (without /u flag)').toHaveLength(2);
            expect("\uD835\uDC01".match(/./u)![0], 'The length of a single code unit match against "\\ud835\\udc01" is 1 (without /u flag)').toHaveLength(2);

            // Actual test cases:
            expect(exec.call(/./u, "𝐁")!.indices[0], 'Indices for unicode match against "𝐁" (with /u flag)').toEqual([0, 2]);
            expect(exec.call(/./u, "\u{1d401}")!.indices[0], 'Indices for unicode match against "\\u{1d401}" (with /u flag)').toEqual([0, 2]);
            expect(exec.call(/./u, "\uD835\uDC01")!.indices[0], 'Indices for unicode match against "\\ud835\\udc01" (with /u flag)').toEqual([0, 2]);
            expect(exec.call(/(?<a>.)/u, "𝐁")!.indices.groups!.a, 'Indices for unicode match against "𝐁" in groups.a (with /u flag)').toEqual([0, 2]);
            expect(exec.call(/(?<a>.)/u, "\u{1d401}")!.indices.groups!.a, 'Indices for unicode match against "\\u{1d401}" in groups.a (with /u flag)').toEqual([0, 2]);
            expect(exec.call(/(?<a>.)/u, "\uD835\uDC01")!.indices.groups!.a, 'Indices for unicode match against "\\ud835\\udc01" in groups.a (with /u flag)').toEqual([0, 2]);
        });
    });
});
