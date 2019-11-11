const express = require("express");
const router = express.Router();
const dbConnexion = require("./database");

function listSendEntitiesIndex(req, res) {
  console.log("listSendEntitiesIndex");
  let sqlAllEntityTypes =
    "SELECT * FROM entity_type ORDER BY id ASC LIMIT 1000";
  let sqlAllEntities = "SELECT * FROM entities ORDER BY id DESC LIMIT 1000";

  dbConnexion.query(sqlAllEntities, (err, entities) => {
    if (err) throw err;
    dbConnexion.query(sqlAllEntityTypes, (err, entityTypes) => {
      if (err) throw err;
      res.render("pages/entitiesList", {
        entitiesItems: entities.rows,
        entityTypes: entityTypes.rows
      });
    });
  });
}

function insertEntity(req, res) {
  console.log("insertEntity");
  dbConnexion.query(
    "INSERT INTO entities (id, name,entity_type_id,profile_pic_url) VALUES (nextval(pg_get_serial_sequence('entities', 'id')), $1, $2,$3)",
    [req.body.name, req.body.entityTypeId, req.body.profilePicUrl],
    (err, sqlResult) => {
      if (err) throw err;
      res.redirect("/");
    }
  );
}

function updateEntity(req, res) {
  console.log("updateEntity");
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

function sendEntityById(req, res) {
  console.log("sendEntityById");
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

function sendEditEntityById(req, res) {
  console.log("sendEditEntityById");
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
  console.log("sendListRelationsByEntityId");
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
  console.log("sendEditRelationsByEntityId");
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
          console.log(entityItems);
          res.render("pages/entityRelationsEdit", {
            entityItems: entityItems.rows,
            relationsItems: relationsItems.rows
          });
        });
      }
    );
  }
}

router.get("/list/", listSendEntitiesIndex);
router.get("/relations/:id", sendListRelationsByEntityId);
router.get("/relations/edit/:id", sendEditRelationsByEntityId);
router.post("/insertEntity", insertEntity);
router.get("/edit/:id", sendEditEntityById);
router.post("/update/:id", updateEntity);
router.get("/:id", sendEntityById);

module.exports = router;
