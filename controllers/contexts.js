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
    "INSERT INTO contexts (id, name, description, image_url) VALUES (nextval(pg_get_serial_sequence('contexts', 'id')), $1, $2, $3)",
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
  let sqlContext = "SELECT * FROM contexts WHERE id=$1";
  let sqlRelations =
    "SELECT r.id as relation_id, e_source.name as entity_source_name, e_destination.name as entity_destination_name FROM relations r, entities e_source, entities e_destination WHERE e_source.id=r.entity_source_id AND e_destination.id=r.entity_destination_id ORDER BY relation_id DESC";
  let sqlContextRelationsItems =
    "SELECT e_destination.name as entity_destination_name, e_source.name as entity_source_name FROM relation_context rc, relations r, entities e_source, entities e_destination WHERE rc.context_id=$1  AND rc.relation_id=r.id AND e_source.id=r.entity_source_id AND e_destination.id=r.entity_destination_id";
  dbConnexion.query(sqlContext, [id], (err, contextItem) => {
    if (err) throw err;
    dbConnexion.query(sqlRelations, (err, relationsItems) => {
      if (err) throw err;
      dbConnexion.query(
        sqlContextRelationsItems,
        [id],
        (err, contextRelationsItems) => {
          if (err) throw err;
          res.render("pages/contextEdit", {
            contextItem: contextItem.rows[0],
            relationsItems: relationsItems.rows,
            contextRelationsItems: contextRelationsItems.rows
          });
        }
      );
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
      req.body.is_live
    ],
    (err, sqlResult) => {
      if (err) throw err;
      res.redirect("/contexts/edit/" + req.params.id);
    }
  );
}

function insertRelations(req, res) {
  console.log("contexts::relations::insert");
  dbConnexion.query(
    "INSERT INTO relation_context (id, relation_id, context_id) VALUES (nextval(pg_get_serial_sequence('relation_context', 'id')), $1, $2)",
    [req.body.relation_id, req.body.context_id],
    (err, sqlResult) => {
      if (err) throw err;
      res.redirect("/contexts/edit/" + req.body.context_id);
    }
  );
}

router.get("/", list);
router.post("/insert", insert);
router.get("/edit/:id", edit);
router.post("/update/:id", update);
router.post("/relations/insert", insertRelations);
/*
router.get("/:id", show);
*/
module.exports = router;
