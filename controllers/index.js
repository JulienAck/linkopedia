const express = require("express");
const router = express.Router();

router.use("/entities", require("./entities"));
router.use("/relations", require("./relations"));
router.use("/contexts", require("./contexts"));
router.use("/wikipedia", require("./wikipedia"));
router.use("/search", require("./search"));

console.log("controllers/index");
module.exports = router;
