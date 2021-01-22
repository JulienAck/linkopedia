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

function intOrNull(v) {
  if (parseInt(v) == v) {
    return v;
  } else {
    return null;
  }
}

function find(req,res) {
  console.log("relations::find");
  // Cherche les relations communes à deux entités
  console.log(req.body.entity1Id +" - "+ req.body.entity2Id);
  var networkData = {};
  networkData.label = "Cherche Relations";
  networkData.editUrl = "/relations/find/";
  networkData.apiUrl = "/relations/APIfind/"+ req.body.entity1Id + "/" + req.body.entity2Id;
  res.render("pages/networkShow", {
    networkData: networkData
  });
}


function APIfind(req,res) {
  console.log("relations::APIfind");
  // Retourne les relations communes à deux entités
  console.log("query "+JSON.stringify(req.params));
  console.log("entité 1: "+req.params.id1);
  console.log("entité 2: "+req.params.id2);
  let id1 = Math.floor(req.params.id1); //just checking we receive numbers
  let id2 = Math.floor(req.params.id2);
  dbConnexion.query(
    "SELECT DISTINCT e.id as id, e.name as label, e.profile_pic_url as profileImage FROM entities e WHERE ((e.id IN (SELECT r.entity_destination_id FROM relations r WHERE r.entity_source_id IN ($1,$2)) AND e.id IN (SELECT r.entity_source_id FROM relations r WHERE r.entity_destination_id IN ($1,$2)))) OR ((e.id IN (SELECT r.entity_destination_id FROM relations r WHERE r.entity_source_id=$1) OR e.id IN (SELECT r.entity_source_id FROM relations r WHERE r.entity_destination_id=$2)) AND (e.id IN (SELECT r.entity_destination_id FROM relations r WHERE r.entity_source_id=$2) OR e.id IN (SELECT r.entity_source_id FROM relations r WHERE r.entity_destination_id=$1)) OR (e.id IN ($1,$2)))",
    [
      id1,
      id2
    ],
    (err, entitiesItems) => {
      //if (err) throw err;
      if (err) {
        throw err;
      } else {
        let entitiesIds = [];
        for(let i=0; i<entitiesItems.rows.length; i++) {
          console.log(i+":"+entitiesItems.rows[i].id);
          entitiesIds.push(entitiesItems.rows[i].id);
        }
        console.log("entitiesIds:"+entitiesIds);
        dbConnexion.query(
          "SELECT r.entity_source_id as sourceid, r.entity_destination_id as destinationid, r.name as label FROM relations r WHERE r.entity_source_id IN ("+entitiesIds.toString()+") OR r.entity_destination_id IN ("+entitiesIds.toString()+")",
          (err, relationsItems) => {
            //if (err) throw err;
            if (err) {
              throw err;
            } else {
              console.log(entitiesItems.rows.length);
              let entities = cleanArrayOfObjects(entitiesItems.rows);
              entities.forEach(function(item) {
                if (item.profileimage) {
                  item.image = item.profileimage;
                } else {
                  item.image = item.defaultimage;
                }
              });
              let relations = cleanArrayOfObjects(
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
            }
          });
      }
    }
  );
}

function insert(req, res) {
  console.log("relations::insertRelation");
  //we always put the smallest one up front to avoid unkwnon duplicate relations
  let id1 = Math.min(req.body.entitySourceId, req.body.entityDestinationId);
  let id2 = Math.max(req.body.entitySourceId, req.body.entityDestinationId);
  dbConnexion.query(
    "INSERT INTO relations (entity_source_id,entity_destination_id,year_begin,year_end,name,detail_references) VALUES ($1, $2, $3, $4, $5, $6)",
    [
      id1,
      id2,
      intOrNull(req.body.year_begin),
      intOrNull(req.body.year_end),
      req.body.name,
      req.body.detail_references
    ],
    (err, sqlResult) => {
      //if (err) throw err;
      if (err) {
        throw err;
      } else {
        if (req.body.entitySourceId != undefined) {
          res.redirect("/entities/edit/" + req.body.entitySourceId);
        } else {
          res.redirect("/relations/");
        }
      }
    }
  );
}

function edit(req, res) {
  console.log("relations::edit");
  let id = req.params.id;
  let returnId = req.query.returnId;
  let sqlEntities = "SELECT * FROM entities";
  dbConnexion.query(sqlEntities, (err, entities) => {
    if (err) throw err;
    let sqlRelation = "SELECT r.*, e1.name as entity_source_name, e2.name as entity_destination_name FROM relations r, entities e1, entities e2 WHERE r.id=$1 AND e1.id=r.entity_source_id AND e2.id=r.entity_destination_id";
    dbConnexion.query(sqlRelation, [id], (err, relations) => {
      if (err) throw err;
      res.render("pages/relationEdit", {
        returnId: returnId,
        relationItem: relations.rows[0],
        entityItems: entities.rows
      });
    });
  });
}

function update(req, res) {
  console.log("relations::updateRelation");
  //we always put the smallest one up front to avoid unknwon duplicate relations
  let id1 = Math.min(req.body.entitySourceId, req.body.entityDestinationId);
  let id2 = Math.max(req.body.entitySourceId, req.body.entityDestinationId);
  var sqlBase =
    "UPDATE relations SET entity_source_id=$2, entity_destination_id=$3, year_begin=$4, year_end=$5, name=$6, detail_references=$7 WHERE id=$1";
  dbConnexion.query(
    sqlBase,
    [
      req.params.id,
      id1,
      id2,
      intOrNull(req.body.year_begin),
      intOrNull(req.body.year_end),
      req.body.name,
      req.body.detail_references
    ],
    (err, sqlResult) => {
      if (err) {
        throw err;
      } else {
        console.log("returnEntityId"+req.body.returnEntityId);
        if (req.body.returnEntityId != undefined && req.body.returnEntityId!= "") {
          res.redirect("/entities/edit/" + req.body.returnEntityId);
        } else {
          res.redirect("/relations");
        }
      }
    }
  );
}

function getRelationsEntities(arrEntities, callback) {
  console.log("relations::getRelationsEntities");
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
  console.log("relations::getEntitiesRelations");
  let arrEntitiesId = arrEntities.map(({ id }) => id);
  let entitiesList = arrEntitiesId.toString();
  let sqlRelations =
    "SELECT DISTINCT r.entity_source_id as sourceid, r.entity_destination_id as destinationid, r.name as label FROM relations r WHERE r.entity_source_id IN (" +
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
  console.log("relations::getRelationsLoop");
  counter++;
  let relationSources = arrRelations.toString();
  let sqlRelations =
    "SELECT DISTINCT r.entity_source_id as sourceId, r.entity_destination_id as destinationId, r.name as label FROM relations r WHERE r.entity_source_id IN (" +
    relationSources +
    ") OR r.entity_destination_id IN (" +
    relationSources +
    ");";
  console.log(sqlRelations);  
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

function list(req, res) {
  console.log("relations::listSendRelationsIndex");
  let sqlAllRelations =
    "SELECT e1.name as source_name, e1.id as source_id, e2.name as destination_name, e2.id as destination_id, r.* FROM entities e1, entities e2, relations r WHERE r.entity_source_id=e1.id AND r.entity_destination_id=e2.id ORDER BY r.id DESC LIMIT 1000";
  dbConnexion.query(sqlAllRelations, (err, relations) => {
    if (err) throw err;
    let sqlAllEntities = "SELECT * FROM entities ORDER BY ID DESC LIMIT 1000";
    dbConnexion.query(sqlAllEntities, (err, entities) => {
      if (err) throw err;
      res.render("pages/relations", {
        relationsItems: relations.rows,
        entityItems: entities.rows
      });
    });
  });
}

function APIshow(req, res) {
  console.log("relations::APIsendRelationsByEntityId");
  let searchId = req.params.id;
  if (parseInt(searchId) == searchId) {
    let arrRelations = [];
    arrRelations.push(searchId);
    // Le deuxième paramètre est le nombre de degrés à aller chercher. Attention: charge exponentielle.
    getRelationsLoop(arrRelations, 1, 0, function(relations) {
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

function remove(req, res) {
  console.log("relations::deleteRelation");
  var sqlBase = "DELETE FROM relations WHERE id=$1";
  dbConnexion.query(sqlBase, [req.params.id], (err, sqlResult) => {
    if (err) throw err;
    if (req.body.returnEntityId != undefined) {
      res.redirect("/entities/edit/" + req.body.returnEntityId);
    } else {
      res.redirect("/");
    }
  });
}

router.get("/", list);
router.post("/insert", insert);
router.post("/find", find);
router.get("/APIfind/:id1/:id2", APIfind);
router.post("/update/:id", update);
router.get("/edit/:id", edit);
router.get("/api/:id", APIshow);
router.post("/delete/:id", remove);

module.exports = router;
