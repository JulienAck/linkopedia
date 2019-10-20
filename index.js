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
        let sqlEntities = "SELECT DISTINCT e.id as id, e.name as label FROM entities e, relations r WHERE (e.id=r.entity_source_id AND r.entity_destination_id="+searchId+") OR (e.id=r.entity_destination_id AND r.entity_source_id="+searchId+") OR e.id="+searchId;
        let queryEntities = mysqlConnexion.query(sqlEntities,(err,entities) => {
            if (err) throw err;
            console.log(JSON.stringify(entities));
            let sqlEntities = "SELECT DISTINCT r.entity_source_id as sourceId, r.entity_destination_id as destinationId FROM entities e, relations r WHERE r.entity_source_id="+searchId+" OR r.entity_destination_id="+searchId;
            let queryEntities = mysqlConnexion.query(sqlEntities,(err,relations) => {
                if (err) throw err;
                res.render('pages/relations',{nodeItems: entities, relationItems: relations});
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