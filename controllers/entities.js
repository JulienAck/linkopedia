const express = require("express");
const router = express.Router();
const dbConnexion = require("./database");

function listSendEntitiesIndex(req, res) {
  console.log("listSendEntitiesIndex");
  let sqlAllEntityTypes =
    "SELECT * FROM entity_type ORDER BY id ASC LIMIT 1000";
  console.log(sqlAllEntityTypes);
  let sqlAllEntities = "SELECT * FROM entities ORDER BY id DESC LIMIT 1000";
  console.log(sqlAllEntities);

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
  console.log(req.body);
  dbConnexion.query(
    "INSERT INTO entities (id, name,entity_type_id,profile_pic_url) VALUES (nextval(pg_get_serial_sequence('entities', 'id')), $1, $2,$3)",
    [req.body.name, req.body.entityTypeId, req.body.profilePicUrl],
    (err, sqlResult) => {
      if (err) throw err;
      console.log(sqlResult.rows);
      res.redirect("/");
    }
  );
}

function updateEntity(req, res) {
  console.log(
    "updateEntity " +
      req.params.id +
      " " +
      req.body.name +
      " " +
      req.body.entityTypeId +
      " " +
      req.body.profilePicUrl
  );
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
      console.log(sqlResult.rows);
      res.redirect("/entities/edit/"+req.params.id);
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
      console.log(sqlResult.rows);
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
      console.log(entityTypes.rows);
      dbConnexion.query(sqlEntityById, [searchEntityId], (err, sqlResult) => {
        if (err) throw err;
        console.log(sqlResult.rows);
        res.render("pages/entityEdit", {
          entityData: sqlResult.rows[0],
          entityTypes: entityTypes.rows
        });
      });
    });
  }
}

router.get("/view/:id", sendEntityById);
router.get("/edit/:id", sendEditEntityById);
router.post("/insertEntity", insertEntity);
router.post("/update/:id", updateEntity);
router.get("/list/", listSendEntitiesIndex);

module.exports = router;
