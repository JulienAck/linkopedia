const pg = require("pg");

function connectSql(err) {
  console.log("connectSql");
  if (err) throw err;
  console.log("Postgres connected...");
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
      port: 5432
    });
  }
  return dbConnexion;
}

//DB Connect
var dbConnexion = setDBConnexion();
dbConnexion.connect(connectSql);

module.exports = dbConnexion;
