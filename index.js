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

function getHomePage(req,res) {
    console.log('HP called');
    res.send('hi there');
}

function getRelations(req,res) {
    let searchId = req.params.id;
    if(parseInt(searchId)==searchId) {

        let sqlRelationsLevel2 = "SELECT DISTINCT r.entity_source_id as sourceId, r.entity_destination_id as destinationId FROM relations r WHERE r.entity_source_id IN (SELECT DISTINCT r.entity_source_id FROM relations r WHERE r.entity_source_id="+searchId+" OR r.entity_destination_id="+searchId+") OR r.entity_destination_id IN (SELECT DISTINCT r.entity_destination_id FROM relations r WHERE r.entity_source_id="+searchId+" OR r.entity_destination_id="+searchId+")";
        console.log(sqlRelationsLevel2);
        let queryRelationsLevel2 = mysqlConnexion.query(sqlRelationsLevel2,(err,relationsLevel2) => {
            if (err) throw err;
            let entityIdsLevel2 = ""+searchId;
            relationsLevel2.forEach(function(item){entityIdsLevel2+=(","+item.sourceId+","+item.destinationId)});
            let sqlEntities = "SELECT DISTINCT e.id as id, e.name as label FROM entities e WHERE e.id IN ("+entityIdsLevel2+");";
            console.log(sqlEntities);
            let queryEntities = mysqlConnexion.query(sqlEntities,(err,entities) => {
                if (err) throw err;
                let sqlRelationsLevel1 = "SELECT DISTINCT r.entity_source_id as sourceId, r.entity_destination_id as destinationId FROM relations r WHERE r.entity_source_id IN ("+entityIdsLevel2+") OR r.entity_destination_id IN ("+entityIdsLevel2+")";
                console.log(sqlRelationsLevel1);
                let queryRelationsLevel1 = mysqlConnexion.query(sqlRelationsLevel1,(err,relationsLevel1) => {
                    if (err) throw err;
                    let entityIdsLevel1 = ""+searchId;
                    relationsLevel1.forEach(function(item){entityIdsLevel1+=(","+item.sourceId+","+item.destinationId)});
                    res.render('pages/relations',{nodeItems: entities, relationItems: relationsLevel1});
                });
            });
        });
    } else {
        throw ("Invalid id");
    }

}

//DB Connect
mysqlConnexion.connect(connectMysql);

const app = express();
app.use(express.static(path.join(__dirname, 'public')))
    .use('/javascript/vis-network', express.static(__dirname + '/node_modules/vis-network/dist/'))
    .set('views', path.join(__dirname, 'views'))
    .set('view engine', 'ejs')
    .get('/', getHomePage)
    .get('/relations/:id',getRelations);


app.listen('3000',serverListens());