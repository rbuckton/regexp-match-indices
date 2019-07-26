/*
 require('foo/auto') will automatically invoke the shim method.
 */

import "./shim/types";
import shim = require("./shim");
shim();
