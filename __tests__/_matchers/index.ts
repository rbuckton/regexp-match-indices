import { toHaveOwnAccessorProperty } from "./toHaveOwnAccessorProperty";
import { toHaveOwnDataProperty } from "./toHaveOwnDataProperty";
import { toHaveOwnProperty } from "./toHaveOwnProperty";
import { toHavePrototype } from "./toHavePrototype";

expect.extend({
    toHaveOwnProperty,
    toHaveOwnDataProperty,
    toHaveOwnAccessorProperty,
    toHavePrototype,
});
