import implementation = require("../implementation");

describe("measurement", () => {
    it("one", () => {
        const re = new RegExp("a(b)");
        const result = implementation.call(re, "ab")!;
        expect(result.indices[0]).toEqual([0, 2]);
        expect(result.indices[1]).toEqual([1, 2]);
        expect(result.indices.groups).toEqual(undefined);
    });
    it("number backreference", () => {
        const re = new RegExp("a(b)\\1");
        const result = implementation.call(re, "abb")!;
        expect(result.indices[0]).toEqual([0, 3]);
        expect(result.indices[1]).toEqual([1, 2]);
        expect(result.indices.groups).toEqual(undefined);
    });
    it("named backreference", () => {
        const re = new RegExp("a(?<B>b)\\k<B>");
        const result = implementation.call(re, "abb")!;
        expect(result.indices[0]).toEqual([0, 3]);
        expect(result.indices[1]).toEqual([1, 2]);
        expect(result.indices.groups).toEqual({ B: [1, 2] });
    });
    it("lookbehind", () => {
        const re = new RegExp("(?<=a)b");
        const result = implementation.call(re, "ab")!;
        expect(result.indices.length).toBe(1);
    });
});