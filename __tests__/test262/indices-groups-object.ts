import "../_matchers";
import exec = require("../../implementation");
import { describeEachMode } from "../_matchers/utils";

describeEachMode(() => {
    it("indices-groups-object", () => {
        // // `groups` is created with Define, not Set.
        // let counter = 0;
        // Object.defineProperty(Array.prototype, "groups", {
        //   set() { counter++; }
        // });

        // let indices = /(?<x>.)/.exec("a").indices;
        // assert.sameValue(counter, 0);
        
        let indices = exec.call(/(?<x>.)/, "a")!.indices;

        // `groups` is writable, enumerable and configurable
        // (from CreateDataProperty).
        expect(indices).toHaveOwnDataProperty('groups', {
            writable: true,
            enumerable: true,
            configurable: true
        });

        // The `__proto__` property on the groups object is not special,
        // and does not affect the [[Prototype]] of the resulting groups object.
        let groups = exec.call(/(?<__proto__>.)/, "a")!.indices.groups!;
        expect(groups.__proto__).toEqual([0, 1]);
        expect(groups).toHavePrototype(null);
    });
});


