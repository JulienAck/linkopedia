const express = require("express");
const router = express.Router();
const dbConnexion = require("./database");

function list(req, res) {
  console.log("entities::list");
  let sqlAllEntityTypes =
    "SELECT * FROM entity_type ORDER BY id ASC LIMIT 1000";
  let sqlAllEntities = "SELECT * FROM entities ORDER BY id DESC LIMIT 1000";

  dbConnexion.query(sqlAllEntities, (err, entities) => {
    if (err) throw err;
    dbConnexion.query(sqlAllEntityTypes, (err, entityTypes) => {
      if (err) throw err;
      res.render("pages/entities", {
        entitiesItems: entities.rows,
        entityTypes: entityTypes.rows
      });
    });
  });
}

function insert(req, res) {
  console.log("entities::insert");
  dbConnexion.query(
    "INSERT INTO entities (id, name,entity_type_id,profile_pic_url) VALUES (nextval(pg_get_serial_sequence('entities', 'id')), $1, $2,$3)",
    [req.body.name, req.body.entityTypeId, req.body.profilePicUrl],
    (err, sqlResult) => {
      if (err) throw err;
      res.redirect("/");
    }
  );
}

function update(req, res) {
  console.log("entities::update");
  var sqlBase =
    "UPDATE entities SET name=$2, entity_type_id=$3, profile_pic_url=$4 WHERE id=$1";
  dbConnexion.query(
    sqlBase,
    [
      req.params.id,
      req.body.name,
      req.body.entityTypeId,
      req.body.profilePicUrl
    ],
    (err, sqlResult) => {
      if (err) throw err;
      res.redirect("/entities/edit/" + req.params.id);
    }
  );
}

function show(req, res) {
  console.log("entities::show");
  let searchEntityId = req.params.id;
  if (parseInt(searchEntityId) == searchEntityId) {
    let sqlEntityById =
      "SELECT DISTINCT e.id as id, e.name as label, e.profile_pic_url as profileImage, e.entity_type_id as entity_type_id, et.default_shape as shape, et.default_image_url as defaultImage FROM entities e, entity_type as et WHERE e.entity_type_id=et.id AND e.id=$1;";
    dbConnexion.query(sqlEntityById, [searchEntityId], (err, sqlResult) => {
      if (err) throw err;
      res.render("pages/entityView", {
        entityData: sqlResult.rows[0]
      });
    });
  }
}

function edit(req, res) {
  console.log("entities::edit");
  let searchEntityId = req.params.id;
  if (parseInt(searchEntityId) == searchEntityId) {
    let sqlAllEntityTypes =
      "SELECT * FROM entity_type ORDER BY id ASC LIMIT 1000";
    let sqlEntityById =
      "SELECT DISTINCT e.id as id, e.name as label, e.profile_pic_url as profileImage, e.entity_type_id as entity_type_id, et.default_shape as shape, et.default_image_url as defaultImage FROM entities e, entity_type as et WHERE e.entity_type_id=et.id AND e.id=$1;";
    dbConnexion.query(sqlAllEntityTypes, (err, entityTypes) => {
      if (err) throw err;
      dbConnexion.query(sqlEntityById, [searchEntityId], (err, sqlResult) => {
        if (err) throw err;
        res.render("pages/entityEdit", {
          entityData: sqlResult.rows[0],
          entityTypes: entityTypes.rows
        });
      });
    });
  }
}

function sendListRelationsByEntityId(req, res) {
  console.log("entities::relations::list");
  let searchEntityId = req.params.id;
  if (parseInt(searchEntityId) == searchEntityId) {
    let sqlListRelationsByEntityId =
      "SELECT e.id as entity_id, e.name as entity_name, r.* FROM entities e, relations r WHERE (r.entity_source_id=$1 OR r.entity_destination_id=$1) AND (e.id=r.entity_source_id OR e.id=r.entity_destination_id) AND e.id!=$1 ORDER BY r.id DESC LIMIT 1000";
    dbConnexion.query(
      sqlListRelationsByEntityId,
      [searchEntityId],
      (err, entityRelations) => {
        if (err) throw err;
        res.render("pages/entityRelationsView", {
          entityRelations: entityRelations.rows
        });
      }
    );
  }
}

function sendEditRelationsByEntityId(req, res) {
  console.log("entities::relations::list::edit");
  let searchEntityId = req.params.id;
  if (parseInt(searchEntityId) == searchEntityId) {
    let sqlListRelationsByEntityId =
      "SELECT e.id as entity_id, e.name as entity_name, r.* FROM entities e, relations r WHERE (r.entity_source_id=$1 OR r.entity_destination_id=$1) AND (e.id=r.entity_source_id OR e.id=r.entity_destination_id) AND e.id!=$1 ORDER BY r.id DESC LIMIT 1000";
    dbConnexion.query(
      sqlListRelationsByEntityId,
      [searchEntityId],
      (err, relationsItems) => {
        if (err) throw err;
        let sqlListEntities = "SELECT * FROM entities ORDER BY name LIMIT 1000";
        dbConnexion.query(sqlListEntities, (err, entityItems) => {
          if (err) throw err;
          res.render("pages/entityRelationsEdit", {
            currentItemId: searchEntityId,
            entityItems: entityItems.rows,
            relationsItems: relationsItems.rows
          });
        });
      }
    );
  }
}

router.get("/", list);
router.get("/relations/:id", sendListRelationsByEntityId);
router.get("/relations/edit/:id", sendEditRelationsByEntityId);
router.post("/insert", insert);
router.get("/edit/:id", edit);
router.post("/update/:id", update);
router.get("/:id", show);

module.exports = router;
