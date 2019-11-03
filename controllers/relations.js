const express = require ('express');
const router = express.Router();
//const pg = require('pg');
const dbConnexion = require('./database');

function cleanArrayOfObjects(arrOfObj) {
    console.log('cleanArrayOfObjects');
    for (var i=0; i<arrOfObj.length; i++) {
        arrOfObj[i] = cleanObject(arrOfObj[i]);
    }
    return arrOfObj;
}

function cleanObject(obj) {
    console.log('cleanObject');
    for (var propName in obj) { 
        if (obj[propName] == null) {
            delete obj[propName];
        }
    }
    return obj;
}

function getRelationsEntities(arrEntities,callback) {
    console.log('getEntities');
    let entitiesSources = arrEntities.toString();
    let sqlEntities = "SELECT DISTINCT e.id as id, e.name as label, et.default_shape as shape, et.default_image_url as image FROM entities e, entity_type as et WHERE e.entity_type_id=et.id AND e.id IN ("+entitiesSources+");";
    console.log(sqlEntities);
    dbConnexion.query(sqlEntities,(err,entities) => {
        if (err) throw err;
        callback(entities.rows);
    });
}

function getRelationsLoop(arrRelations,iterations,counter,callback) {
    console.log('getRelationsLoop');
    //this function calls itself to enrich the array of relations as many times a iterations says. 
    counter++;
    let relationSources = arrRelations.toString();
    console.log("relationSources="+relationSources);
    let sqlRelations = "SELECT DISTINCT r.entity_source_id as sourceId, r.entity_destination_id as destinationId FROM relations r WHERE r.entity_source_id IN ("+relationSources+") OR r.entity_destination_id IN ("+relationSources+");";
    console.log(sqlRelations);
    dbConnexion.query(sqlRelations,(err,relations) => {
        if (err) throw err;
        console.log(relations.rows);
        if (relations.rows.length>0&&counter<iterations) {
            relationList = [];
            relations.rows.forEach(function(item){
                console.log(item);
                relationList.push(item.sourceid);
                relationList.push(item.destinationid);
            });
            console.log("relationList="+relationList);
            getRelationsLoop(relationList,iterations,counter,callback);
        } else {
            callback(relations.rows);
        }
    });
}

function sendRelationsIndex(req,res) {
    console.log('sendRelationsIndex');
    let sqlAllRelations = "SELECT e1.name as source_name, e2.name as destination_name, r.* FROM entities e1, entities e2, relations r WHERE r.entity_source_id=e1.id AND r.entity_destination_id=e2.id ORDER BY r.id DESC LIMIT 1000" ;
    console.log(sqlAllRelations);
    dbConnexion.query(sqlAllRelations,(err,relations) => {
        if (err) throw err;
        res.render('pages/relationsIndex',{relationsItems: relations.rows});
    }); 
}

function sendRelationsById(req,res) {
    console.log('sendRelationsById');
    let searchId = req.params.id;
    if(parseInt(searchId)==searchId) {
        let arrRelations = [];
        arrRelations.push(searchId);
        getRelationsLoop(arrRelations,4,0,function(relations){
            relationList = ""+searchId;
            relations.forEach(function(item){relationList+=(","+item.sourceid+","+item.destinationid)});
            getRelationsEntities(relationList,function(entities) {
                entities = cleanArrayOfObjects(entities);
                relations = cleanArrayOfObjects(JSON.parse(JSON.stringify(relations).replace(/sourceid/g,'from').replace(/destinationid/g,'to')));
                console.log(relations);
                console.log(entities);
                res.render('pages/relations',{nodeItems: entities, relationItems: relations});
            });
        });
    }
}

router.get('/:id',sendRelationsById);
router.get('/',sendRelationsIndex);

module.exports = router;