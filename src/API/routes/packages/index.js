"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var create_js_1 = require("./create.js");
var get_js_1 = require("./get.js");
var invalidGet_js_1 = require("./invalidGet.js");
var update_js_1 = require("./update.js");
var rate_js_1 = require("./rate.js");
var cost_js_1 = require("./cost.js");
var byRegex_js_1 = require("./byRegex.js");
var router = (0, express_1.Router)();
// Define package-related routes
router.get('/:id/rate', rate_js_1.default); // GET /package/{id}/rate
router.get('/:id/cost', cost_js_1.default); // GET /package/{id}/cost
router.post('/byRegEx', byRegex_js_1.default); // POST /package/byRegEx
// More general routes go last
router.post('/:id', update_js_1.default); // POST /package/:id
router.get('/:id', get_js_1.default); // GET /package/:id
router.get('/', invalidGet_js_1.default); // GET /package
// Root route for creating packages
router.post('/', create_js_1.default); // POST /package
exports.default = router;
