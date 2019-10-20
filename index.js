const express = require ('express');
const mysql = require ('mysql');
const path = require ('path');

// DB setup
const mysqlConnexion = mysql.createConnection({
    host: "localhost",
    user: "wordpress",
    password: "123456",
    database: "linkopedia"
});

function cleanArrayOfObjects(arrOfObj) {
    for (var i=0; i<arrOfObj.length; i++) {
        arrOfObj[i] = cleanObject(arrOfObj[i]);
    }
    return arrOfObj;
}

function cleanObject(obj) {
    for (var propName in obj) { 
        if (obj[propName] == null) {
            delete obj[propName];
        }
    }
    return obj;
}

function serverListens() {
    console.log('server listening..');
}

function connectMysql(err) {
    if (err) {
        throw err;
    }
    console.log('Mysql connected...');
}

function sendHomePage(req,res) {
    console.log('HP called');
    res.send('hi there');
}

function getEntities(arrEntities,callback) {
    console.log(arrEntities);
    let entitiesSources = arrEntities.toString();
    let sqlEntities = "SELECT DISTINCT e.id as id, e.name as label, e.shape as shape, e.color as color, e.size as size, e.image as image FROM entities e WHERE e.id IN ("+ entitiesSources +");";
    mysqlConnexion.query(sqlEntities,[entitiesSources],(err,entities) => {
        if (err) throw err;
        callback(entities);
    });
}

function getRelationsLoop(arrRelations,iterations,counter,callback) {
    //this function calls itself to enrich the array of relations as many times a iterations says. 
    counter++;
    let relationSources = arrRelations.toString();
    let sqlRelations = "SELECT DISTINCT r.entity_source_id as sourceId, r.entity_destination_id as destinationId, r.name as label FROM relations r WHERE r.entity_source_id IN ("+ relationSources +") OR r.entity_destination_id IN ("+ relationSources +");";
    mysqlConnexion.query(sqlRelations,[relationSources],(err,relations) => {
        if (err) throw err;
        if (counter<iterations) {
            relationList = [];
            relations.forEach(function(item){
                relationList.push(item.sourceId);
                relationList.push(item.destinationId);
            });
            getRelationsLoop(relationList,iterations,counter,callback);
        } else {
            callback(relations);
        }
    });
}

function sendRelations(req,res) {
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
mysqlConnexion.connect(connectMysql);

const app = express();
app.use(express.static(path.join(__dirname, 'public')))
    .use('/javascript/vis-network', express.static(__dirname + '/node_modules/vis-network/dist/'))
    .set('views', path.join(__dirname, 'views'))
    .set('view engine', 'ejs')
    .get('/', sendHomePage)
    .get('/relations/:id',sendRelations);


app.listen('3000',serverListens());