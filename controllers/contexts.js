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
    "SELECT e_destination.name as entity_destination_name, e_source.name as entity_source_name, r.id as relation_id FROM relation_context rc, relations r, entities e_source, entities e_destination WHERE rc.context_id=$1  AND rc.relation_id=r.id AND e_source.id=r.entity_source_id AND e_destination.id=r.entity_destination_id";
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

function show(req, res) {
  console.log("contexts::relations::insert");
  dbConnexion.query(
    "SELECT * FROM contexts WHERE id=$1",
    [req.params.id],
    (err, contextItem) => {
      if (err) throw err;
      var networkData = {};
      networkData.label = contextItem.rows[0].name;
      networkData.editUrl = "/contexts/edit/" + req.params.id;
      networkData.apiUrl = "/contexts/api/" + req.params.id;
      res.render("pages/networkShow", {
        networkData: networkData
      });
    }
  );
}

function cleanObject(obj) {
  for (var propName in obj) {
    if (obj[propName] == null) {
      delete obj[propName];
    }
  }
  return obj;
}

function cleanArrayOfObjects(arrOfObj) {
  console.log("cleanArrayOfObjects");
  for (var i = 0; i < arrOfObj.length; i++) {
    arrOfObj[i] = cleanObject(arrOfObj[i]);
  }
  return arrOfObj;
}

function APIshow(req, res) {
  console.log("contexts::api::show");
  let cid = req.params.id;
  let sqlrelations =
    "SELECT r.entity_source_id as sourceid, r.entity_destination_id as destinationid, r.name as label FROM relation_context rc, relations r WHERE rc.context_id=$1 AND r.id=rc.relation_id";
  dbConnexion.query(sqlrelations, [cid], (err, relationsItems) => {
    if (err) throw err;
    let sqlEntities =
      "SELECT DISTINCT e.id as id, e.name as label, e.profile_pic_url as profileImage, et.default_shape as shape, et.default_image_url as defaultImage FROM relation_context rc, relations r, entities e, entity_type as et WHERE rc.context_id=$1 AND r.id=rc.relation_id AND (e.id=r.entity_source_id OR e.id=r.entity_destination_id) AND e.entity_type_id=et.id";
    dbConnexion.query(sqlEntities, [cid], (err, entitiesItems) => {
      if (err) throw err;
      var entities = cleanArrayOfObjects(entitiesItems.rows);
      entities.forEach(function(item) {
        if (item.profileimage) {
          item.image = item.profileimage;
        } else {
          item.image = item.defaultimage;
        }
      });
      var relations = cleanArrayOfObjects(
        JSON.parse(
          JSON.stringify(relationsItems.rows)
            .replace(/sourceid/g, "from")
            .replace(/destinationid/g, "to")
        )
      );
      res.send({
        nodeItems: entities,
        relationItems: relations
      });
    });
  });
}

router.get("/", list);
router.post("/insert", insert);
router.get("/edit/:id", edit);
router.get("/api/:id", APIshow);
router.post("/update/:id", update);
router.post("/relations/insert", insertRelations);
router.get("/:id", show);
module.exports = router;
