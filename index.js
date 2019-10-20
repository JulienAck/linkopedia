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

function getRelationsFromRelations(arrRelations,callback) {
    let relationSources = arrRelations.toString();
    let sqlRelations = "SELECT DISTINCT r.entity_source_id as sourceId, r.entity_destination_id as destinationId FROM relations r WHERE r.entity_source_id IN ("+ relationSources +") OR r.entity_destination_id IN ("+ relationSources +");";
    mysqlConnexion.query(sqlRelations,[relationSources],(err,relations) => {
        if (err) throw err;
        callback(relations);
    });
}

function getEntities(arrEntities,callback) {
    console.log(arrEntities);
    let entitiesSources = arrEntities.toString();
    let sqlEntities = "SELECT DISTINCT e.id as id, e.name as label FROM entities e WHERE e.id IN ("+ entitiesSources +");";
    console.log(sqlEntities);
    mysqlConnexion.query(sqlEntities,[entitiesSources],(err,entities) => {
        if (err) throw err;
        callback(entities);
    });
}

function sendRelations(req,res) {
    let searchId = req.params.id;
    if(parseInt(searchId)==searchId) {
        let arrRelations = [];
        arrRelations.push(searchId);
        getRelationsFromRelations(arrRelations,function(relations){
            console.log(relations);
            relationList = ""+searchId;
            relations.forEach(function(item){relationList+=(","+item.sourceId+","+item.destinationId)});
            console.log(relationList);
            getEntities(relationList,function(entities) {
                console.log(entities);
                relations=JSON.parse(JSON.stringify(relations).replace(/sourceId/g,'from').replace(/destinationId/g,'to'));
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