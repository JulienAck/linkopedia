const express = require ('express');
const mysql = require ('mysql');

const app = express();

// DB setup
const mysqlConnexion = mysql.createConnection({
    host: "localhost",
    user: "tester",
    password: "passtester",
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
        let sql = "SELECT e.name as entityName,r.name as relationName FROM entities e, relations r WHERE (e.id=r.source_id AND r.destination_id="+searchId+") OR (e.id=r.destination_id AND r.source_id="+searchId+")";
        let query = mysqlConnexion.query(sql,(err,rows,fields) => {
            if (err) throw err;
            console.log(JSON.stringify(rows));
            console.log(JSON.stringify(fields));
            res.json(rows);
        });
    } else {
        throw ("Invalid id");
    }

}

//DB Connect
mysqlConnexion.connect(connectMysql);

app.get('/',getHomePage);
app.get('/relations/:id',getRelations);
app.listen('3000',serverListens());