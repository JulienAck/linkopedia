const express = require("express");
const router = express.Router();
const dbConnexion = require("./database");

function list(req,res) {
    console.log("search::list");
    res.send("search index");
}

function findEntities(req,res) {
    console.log("search::find");
    var searchChain = '%'+req.params.q+'%';
    let sqlSearchEntity =
      "SELECT DISTINCT e.id, e.name, e.profile_pic_url FROM entities e WHERE UPPER(e.name) like UPPER($1);";
    dbConnexion.query(sqlSearchEntity, [searchChain], (err, sqlResult) => {
      if (err) throw err;
      var networkData = {};
      res.send(sqlResult.rows);
    });
}

router.get("/", list);
router.get("/entities/:q", findEntities);

module.exports = router;