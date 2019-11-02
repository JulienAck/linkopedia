const express = require ('express');
const pg = require('pg');
const bodyParser = require('body-parser');
const path = require ('path');

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
    console.log('serverListens on '+serverPort);
}

function connectSql(err) {
    console.log('connectSql');
    if (err) throw err;
    console.log('Postgres connected...');
}

function sendHomePage(req,res) {
    console.log('sendHomePage');
    res.send('hi there');
}

function sendEntitiesIndex(req,res) {
    console.log('sendEntitiesIndex');
    let sqlAllEntityTypes = "SELECT * FROM entity_type ORDER BY id DESC LIMIT 1000" ;
    console.log(sqlAllEntityTypes);
    let sqlAllEntities = "SELECT * FROM entities ORDER BY id DESC LIMIT 1000" ;
    console.log(sqlAllEntities);
    dbConnexion.query(sqlAllEntities,(err,entities) => {
        if (err) throw err;
        dbConnexion.query(sqlAllEntityTypes,(err,entityTypes) => {
            res.render('pages/entitiesIndex',{entitiesItems: entities.rows, entityTypes: entityTypes.rows});
        });
    });    
}

function insertEntity(req,res) {
    console.log('insertEntity');
    console.log(req.body);
    dbConnexion.query("INSERT INTO entities (name,entity_type_id) VALUES ($1, $2)",[req.body.name,req.body.entityTypeId],(err,sqlResult) => {
        if (err) throw err;
        console.log(sqlResult.rows);
        res.redirect('/entities/');
    });
}

function updateEntity(req,res) {
    console.log('updateEntity '+req.params.id+" "+req.body.name+" "+req.body.entityTypeId);
    dbConnexion.query("UPDATE entities SET name=$2, entity_type_id=$3 WHERE id=$1",[req.params.id,req.body.name,req.body.entityTypeId],(err,sqlResult) => {
        if (err) throw err;
        console.log(sqlResult.rows);
        res.redirect('/entities/');
    });
}

function getEntities(arrEntities,callback) {
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
            getEntities(relationList,function(entities) {
                entities = cleanArrayOfObjects(entities);
                relations = cleanArrayOfObjects(JSON.parse(JSON.stringify(relations).replace(/sourceid/g,'from').replace(/destinationid/g,'to')));
                console.log(relations);
                console.log(entities);
                res.render('pages/relations',{nodeItems: entities, relationItems: relations});
            });
        });
    }
}

function setDBConnexion() {
    if (process.env.DATABASE_URL) {
        console.log(process.env.DATABASE_URL);
        var dbConnexion = new pg.Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: true
        });
    } else {
        var dbConnexion = new pg.Pool({
            host: "localhost",
            user: "postgres",
            password: "dbpass654",
            database: "linkopedia",
            port: 5432,
        });
    }
    return dbConnexion;
}

//DB Connect
var dbConnexion = setDBConnexion();
dbConnexion.connect(connectSql);

//App settings and routes
const app = express();
app.use(express.static(path.join(__dirname, 'public')))
    .use('/javascript/vis-network', express.static(__dirname + '/node_modules/vis-network/dist/'))
    .use(bodyParser.urlencoded({extended: true}))
    .set('views', path.join(__dirname, 'views'))
    .set('view engine', 'ejs')
    .post('/insertEntity',insertEntity)
    .post('/entities/:id',updateEntity)
    .get('/', sendHomePage)
    .get('/relations/:id',sendRelationsById)
    .get('/relations/',sendRelationsIndex)
    .get('/entities/',sendEntitiesIndex);

// -- it begins here --//
let serverPort = process.env.PORT;
if (serverPort == null || serverPort == "") {
    serverPort = 3000;
}
app.listen(serverPort,serverListens());