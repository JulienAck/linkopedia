const express = require ('express');
const pg = require('pg');
const path = require ('path');

// DB setup
const dbConnexion = new pg.Pool({
    host: "localhost",
    user: "postgres",
    password: "dbpass654",
    database: "linkopedia",
    port: 5432,
});

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

function serverListens() {
    console.log('serverListens');
}

function connectSql(err) {
    console.log('connectSql');
    if (err) {
        throw err;
    }
    console.log('Postgres connected...');
}

function sendHomePage(req,res) {
    console.log('sendHomePage');
    res.send('hi there');
}

function sendEntitiesIndex(req,res) {
    console.log('sendEntitiesIndex');
    let sqlAllEntities = "SELECT * FROM entities LIMIT 1000" ;
    dbConnexion.query(sqlAllEntities,(err,entities) => {
        if (err) throw err;
        res.render('pages/entitiesIndex',{entitiesItems: entities});
    });    
}

function getEntities(arrEntities,callback) {
    console.log('getEntities');
    let entitiesSources = arrEntities.toString();
    let sqlEntities = "SELECT DISTINCT e.id as id, e.name as label FROM entities e WHERE e.id IN ($1);";
    dbConnexion.query(sqlEntities,[entitiesSources],(err,entities) => {
        if (err) throw err;
        callback(entities.rows);
    });
}

function getRelationsLoop(arrRelations,iterations,counter,callback) {
    console.log('getRelationsLoop');
    //this function calls itself to enrich the array of relations as many times a iterations says. 
    counter++;
    let relationSources = arrRelations.toString();
    let sqlRelations = "SELECT DISTINCT r.entity_source_id as sourceId, r.entity_destination_id as destinationId FROM relations r WHERE r.entity_source_id IN ($1) OR r.entity_destination_id IN ($1);";
    dbConnexion.query(sqlRelations,[relationSources],(err,relations) => {
        if (err) throw err;
        if (relations.rows.length>0&&counter<iterations) {
            relationList = [];
            relations.rows.forEach(function(item){
                relationList.push(item.sourceId);
                relationList.push(item.destinationId);
            });
            getRelationsLoop(relationList,iterations,counter,callback);
        } else {
            callback(relations.rows);
        }
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
            relations.forEach(function(item){relationList+=(","+item.sourceId+","+item.destinationId)});
            getEntities(relationList,function(entities) {
                entities = cleanArrayOfObjects(entities);
                relations = cleanArrayOfObjects(JSON.parse(JSON.stringify(relations).replace(/sourceId/g,'from').replace(/destinationId/g,'to')));
                console.log(relations);
                console.log(entities);
                res.render('pages/relations',{nodeItems: entities, relationItems: relations});
            });
        });
    }
}

//DB Connect
dbConnexion.connect(connectSql);

const app = express();
app.use(express.static(path.join(__dirname, 'public')))
    .use('/javascript/vis-network', express.static(__dirname + '/node_modules/vis-network/dist/'))
    .set('views', path.join(__dirname, 'views'))
    .set('view engine', 'ejs')
    .get('/', sendHomePage)
    .get('/relations/:id',sendRelationsById)
    .get('/entities/',sendEntitiesIndex);


app.listen('3000',serverListens());