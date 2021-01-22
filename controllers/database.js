const pg = require("pg");

function connectSql(err) {
  console.log("connectSql");
  if (err) throw err;
  console.log("Postgres connected...");
}

function setDBConnexion() {
  console.log("setDBConnexion");
  if (process.env.DATABASE_URL) {
    console.log(process.env.DATABASE_URL);
    if (process.env.DATABASE_SSL!="true") {
      console.log("DB non SSL");
      var dbConnexion = new pg.Pool({
        connectionString: process.env.DATABASE_URL
      });
    } else {
      console.log("DB SSL");
      var dbConnexion = new pg.Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: true
      });
    }
  } else {
    console.log("i need a process.env");
  }
  return dbConnexion;
}

//DB Connect
console.log("controllers/database");
var dbConnexion = setDBConnexion();
dbConnexion.connect(connectSql);

module.exports = dbConnexion;
