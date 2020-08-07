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
    "INSERT INTO entities (id,name,description,entity_type_id,profile_pic_url) VALUES (nextval(pg_get_serial_sequence('entities', 'id')), $1, $2,$3,$4)",
    [req.body.name, req.description, req.body.entityTypeId, req.body.profilePicUrl],
    (err, sqlResult) => {
      if (err) throw err;
      res.redirect("/");
    }
  );
}

function update(req, res) {
  console.log("entities::update");
  var sqlBase =
    "UPDATE entities SET name=$2, description=$3, entity_type_id=$4, profile_pic_url=$5 WHERE id=$1";
  dbConnexion.query(
    sqlBase,
    [
      req.params.id,
      req.body.name,
      req.body.description,
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
      "SELECT DISTINCT e.name as name FROM entities e WHERE e.id=$1;";
    dbConnexion.query(sqlEntityById, [searchEntityId], (err, sqlResult) => {
      if (err) throw err;
      var networkData = {};
      networkData.label = sqlResult.rows[0].name;
      networkData.editUrl = "/entities/edit/" + req.params.id;
      networkData.apiUrl = "/relations/api/" + req.params.id;
      res.render("pages/networkShow", {
        networkData: networkData
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
    let sqlAllEntities = "SELECT * FROM entities ORDER BY name";
    let sqlEntityById =
      "SELECT DISTINCT e.id as id, e.name as label, e.description as description, e.profile_pic_url as profile_pic_url, e.entity_type_id as entity_type_id, et.default_shape as shape, et.default_image_url as defaultImage FROM entities e, entity_type as et WHERE e.entity_type_id=et.id AND e.id=$1;";
    let sqlEntityRelations =
      "SELECT e.id as entity_id, e.name as entity_name, e.profile_pic_url as profile_pic_url, r.id as relation_id, r.name as relation_name, r.year_begin as relation_year_begin, r.year_end as relation_year_end, r.detail_references as detail_references FROM relations r, entities e WHERE (r.entity_source_id=$1 OR r.entity_destination_id=$1) AND (e.id=r.entity_source_id OR e.id=r.entity_destination_id) AND e.id!=$1 ORDER BY e.name ASC;";

    dbConnexion.query(sqlAllEntityTypes, (err, entityTypes) => {
      if (err) throw err;
      dbConnexion.query(sqlAllEntities, (err, entityItems) => {
        if (err) throw err;
        dbConnexion.query(
          sqlEntityById,
          [searchEntityId],
          (err, entityData) => {
            if (err) throw err;
            dbConnexion.query(
              sqlEntityRelations,
              [searchEntityId],
              (err, relationsItems) => {
                if (err) throw err;
                console.log(relationsItems.rows);
                res.render("pages/entityEdit", {
                  currentItemId: searchEntityId,
                  entityItems: entityItems.rows,
                  entityData: entityData.rows[0],
                  entityTypes: entityTypes.rows,
                  relationsItems: relationsItems.rows
                });
              }
            );
          }
        );
      });
    });
  }
}


router.get("/", list);
router.post("/insert", insert);
router.get("/edit/:id", edit);
router.post("/update/:id", update);
router.get("/:id", show);

module.exports = router;
