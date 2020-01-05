const express = require("express");
const router = express.Router();

router.use("/entities", require("./entities"));
router.use("/relations", require("./relations"));
router.use("/contexts", require("./contexts"));

module.exports = router;
