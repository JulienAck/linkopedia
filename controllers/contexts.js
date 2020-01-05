const express = require("express");
const router = express.Router();
const dbConnexion = require("./database");

function list(req, res) {
  console.log("contexts::list");
  let sql = "SELECT * FROM contexts ORDER BY id DESC LIMIT 1000";

  dbConnexion.query(sql, (err, contexts) => {
    if (err) throw err;
    res.render("pages/contexts", {
      contextItems: contexts.rows
    });
  });
}

function insert(req, res) {
  console.log("contexts::insert");
  dbConnexion.query(
    "INSERT INTO contexts (id, name, description, image_url) VALUES (nextval(pg_get_serial_sequence('entities', 'id')), $1, $2, $3)",
    [req.body.name, req.body.description, req.body.image_url],
    (err, sqlResult) => {
      if (err) throw err;
      res.redirect("/contexts/");
    }
  );
}

function edit(req, res) {
  console.log("contexts::edit");
  let id = req.params.id;
  let sql = "SELECT * FROM contexts WHERE id=$1";

  dbConnexion.query(sql, [id], (err, contexts) => {
    if (err) throw err;
    res.render("pages/contextEdit", {
      contextItem: contexts.rows[0]
    });
  });
}

function update(req, res) {
  console.log("contexts::update");
  var sqlBase =
    "UPDATE contexts SET name=$2, description=$3, image_url=$4, is_live=$5 WHERE id=$1";
  dbConnexion.query(
    sqlBase,
    [
      req.params.id,
      req.body.name,
      req.body.description,
      req.body.image_url,
      req.body.is_live,
    ],
    (err, sqlResult) => {
      if (err) throw err;
      res.redirect("/contexts/edit/" + req.params.id);
    }
  );
}

router.get("/", list);
router.post("/insert", insert);
router.get("/edit/:id", edit);
router.post("/update/:id", update);
/*
router.get("/:id", show);
*/
module.exports = router;
