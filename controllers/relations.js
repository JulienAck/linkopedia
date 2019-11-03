const express = require("express");
const router = express.Router();
const dbConnexion = require("./database");

function cleanArrayOfObjects(arrOfObj) {
  console.log("cleanArrayOfObjects");
  for (var i = 0; i < arrOfObj.length; i++) {
    arrOfObj[i] = cleanObject(arrOfObj[i]);
  }
  return arrOfObj;
}

function cleanObject(obj) {
  console.log("cleanObject");
  for (var propName in obj) {
    if (obj[propName] == null) {
      delete obj[propName];
    }
  }
  return obj;
}

function insertRelation(req, res) {
  console.log("insertRelation");
  console.log(req.body);
  dbConnexion.query(
    "INSERT INTO relations (entity_source_id,entity_destination_id) VALUES ($1, $2)",
    [req.body.entitySourceId, req.body.entityDestinationId],
    (err, sqlResult) => {
      if (err) throw err;
      console.log(sqlResult.rows);
      res.redirect("/");
    }
  );
}

function updateRelation(req, res) {
  console.log(
    "updateRelation " +
      req.params.id +
      " " +
      req.body.entitySourceId +
      " " +
      req.body.entityDestinationId
  );
  var sqlBase =
    "UPDATE relations SET entity_source_id=$2, entity_destination_id=$3 WHERE id=$1";
  dbConnexion.query(
    sqlBase,
    [req.params.id, req.body.entitySourceId, req.body.entityDestinationId],
    (err, sqlResult) => {
      if (err) throw err;
      console.log(sqlResult.rows);
      res.redirect("/");
    }
  );
}

function getRelationsEntities(arrEntities, callback) {
  console.log("getEntities");
  let entitiesSources = arrEntities.toString();
  let sqlEntities =
    "SELECT DISTINCT e.id as id, e.name as label, e.profile_pic_url as profileImage, et.default_shape as shape, et.default_image_url as defaultImage FROM entities e, entity_type as et WHERE e.entity_type_id=et.id AND e.id IN (" +
    entitiesSources +
    ");";
  console.log(sqlEntities);
  dbConnexion.query(sqlEntities, (err, entities) => {
    if (err) throw err;
    callback(entities.rows);
  });
}

function getRelationsLoop(arrRelations, iterations, counter, callback) {
  console.log("getRelationsLoop");
  //this function calls itself to enrich the array of relations as many times a iterations says.
  counter++;
  let relationSources = arrRelations.toString();
  console.log("relationSources=" + relationSources);
  let sqlRelations =
    "SELECT DISTINCT r.entity_source_id as sourceId, r.entity_destination_id as destinationId FROM relations r WHERE r.entity_source_id IN (" +
    relationSources +
    ") OR r.entity_destination_id IN (" +
    relationSources +
    ");";
  console.log(sqlRelations);
  dbConnexion.query(sqlRelations, (err, relations) => {
    if (err) throw err;
    console.log(relations.rows);
    if (relations.rows.length > 0 && counter < iterations) {
      relationList = [];
      relations.rows.forEach(function(item) {
        console.log(item);
        relationList.push(item.sourceid);
        relationList.push(item.destinationid);
      });
      console.log("relationList=" + relationList);
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
  console.log(sqlAllRelations);
  dbConnexion.query(sqlAllRelations, (err, relations) => {
    if (err) throw err;
    let sqlAllEntities = "SELECT * FROM entities ORDER BY ID DESC LIMIT 1000";
    console.log(sqlAllEntities);
    dbConnexion.query(sqlAllEntities, (err, entities) => {
      if (err) throw err;
      console.log();
      res.render("pages/relationsList", {
        relationsItems: relations.rows,
        entityItems: entities.rows
      });
    });
  });
}

function APIsendRelationsById(req, res) {
    console.log("APIsendRelationsById");
    let searchId = req.params.id;
    if (parseInt(searchId) == searchId) {
      let arrRelations = [];
      arrRelations.push(searchId);
      getRelationsLoop(arrRelations, 4, 0, function(relations) {
        relationList = "" + searchId;
        relations.forEach(function(item) {
          relationList += "," + item.sourceid + "," + item.destinationid;
        });
        getRelationsEntities(relationList, function(entities) {
          entities.forEach(function(item) {
            if (item.profileimage) {
              item.image=item.profileimage;
            } else {
              item.image=item.defaultimage;
            }
          });
          entities = cleanArrayOfObjects(entities);
          relations = cleanArrayOfObjects(
            JSON.parse(
              JSON.stringify(relations)
                .replace(/sourceid/g, "from")
                .replace(/destinationid/g, "to")
            )
          );
          console.log(relations);
          console.log(entities);
          res.send({
            nodeItems: entities,
            relationItems: relations
          });
        });
      });
    }
}

router.post("/insertRelation", insertRelation);
router.post("/updateRelation/:id", updateRelation);
router.get("/list/", listSendRelationsIndex);
router.get("/api/:id", APIsendRelationsById);

module.exports = router;
