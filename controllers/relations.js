const express = require("express");
const router = express.Router();
const dbConnexion = require("./database");

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

function insertRelation(req, res) {
  console.log("insertRelation");
  dbConnexion.query(
    "INSERT INTO relations (entity_source_id,entity_destination_id) VALUES ($1, $2)",
    [req.body.entitySourceId, req.body.entityDestinationId],
    (err, sqlResult) => {
      if (err) throw err;
      res.redirect("/");
    }
  );
}

function updateRelation(req, res) {
  console.log("updateRelation");
  var sqlBase =
    "UPDATE relations SET entity_source_id=$2, entity_destination_id=$3 WHERE id=$1";
  dbConnexion.query(
    sqlBase,
    [req.params.id, req.body.entitySourceId, req.body.entityDestinationId],
    (err, sqlResult) => {
      if (err) throw err;
      res.redirect("/");
    }
  );
}

function getRelationsEntities(arrEntities, callback) {
  console.log("getRelationsEntities");
  let entitiesSources = arrEntities.toString();
  let sqlEntities =
    "SELECT DISTINCT e.id as id, e.name as label, e.profile_pic_url as profileImage, et.default_shape as shape, et.default_image_url as defaultImage FROM entities e, entity_type as et WHERE e.entity_type_id=et.id AND e.id IN (" +
    entitiesSources +
    ");";
  dbConnexion.query(sqlEntities, (err, entities) => {
    if (err) throw err;
    callback(entities.rows);
  });
}

function getEntitiesRelations(arrEntities, callback) {
  console.log("getEntitiesRelations");
  let arrEntitiesId = arrEntities.map(({ id }) => id);
  let entitiesList = arrEntitiesId.toString();
  let sqlRelations =
    "SELECT DISTINCT r.entity_source_id as sourceid, r.entity_destination_id as destinationid FROM relations r WHERE r.entity_source_id IN (" +
    entitiesList +
    ") OR r.entity_destination_id IN (" +
    entitiesList +
    ");";
  dbConnexion.query(sqlRelations, (err, entities) => {
    if (err) throw err;
    callback(entities.rows);
  });
}

function getRelationsLoop(arrRelations, iterations, counter, callback) {
  //this function calls itself to enrich the array of relations as many times a iterations says.
  console.log("getRelationsLoop");
  counter++;
  let relationSources = arrRelations.toString();
  let sqlRelations =
    "SELECT DISTINCT r.entity_source_id as sourceId, r.entity_destination_id as destinationId FROM relations r WHERE r.entity_source_id IN (" +
    relationSources +
    ") OR r.entity_destination_id IN (" +
    relationSources +
    ");";
  dbConnexion.query(sqlRelations, (err, relations) => {
    if (err) throw err;
    if (relations.rows.length > 0 && counter < iterations) {
      relationList = [];
      relations.rows.forEach(function(item) {
        relationList.push(item.sourceid);
        relationList.push(item.destinationid);
      });
      getRelationsLoop(relationList, iterations, counter, callback);
    } else {
      callback(relations.rows);
    }
  });
}

function listSendRelationsIndex(req, res) {
  console.log("listSendRelationsIndex");
  let sqlAllRelations =
    "SELECT e1.name as source_name, e2.name as destination_name, r.* FROM entities e1, entities e2, relations r WHERE r.entity_source_id=e1.id AND r.entity_destination_id=e2.id ORDER BY r.id DESC LIMIT 1000";
  dbConnexion.query(sqlAllRelations, (err, relations) => {
    if (err) throw err;
    let sqlAllEntities = "SELECT * FROM entities ORDER BY ID DESC LIMIT 1000";
    dbConnexion.query(sqlAllEntities, (err, entities) => {
      if (err) throw err;
      res.render("pages/relationsList", {
        relationsItems: relations.rows,
        entityItems: entities.rows
      });
    });
  });
}

function APIsendRelationsByEntityId(req, res) {
  console.log("APIsendRelationsByEntityId");
  let searchId = req.params.id;
  if (parseInt(searchId) == searchId) {
    let arrRelations = [];
    arrRelations.push(searchId);
    getRelationsLoop(arrRelations, 2, 0, function(relations) {
      relationList = "" + searchId;
      relations.forEach(function(item) {
        relationList += "," + item.sourceid + "," + item.destinationid;
      });
      getRelationsEntities(relationList, function(entities) {
        entities.forEach(function(item) {
          if (item.profileimage) {
            item.image = item.profileimage;
          } else {
            item.image = item.defaultimage;
          }
        });
        entities = cleanArrayOfObjects(entities);
        relations = getEntitiesRelations(entities, function(relations) {
          relations = cleanArrayOfObjects(
            JSON.parse(
              JSON.stringify(relations)
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
    });
  }
}

router.get("/list/", listSendRelationsIndex);
router.post("/insertRelation", insertRelation);
router.post("/updateRelation/:id", updateRelation);
router.get("/api/:id", APIsendRelationsByEntityId);

module.exports = router;
