require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const dbConnexion = require("./controllers/database");
console.log("index");

function serverListens() {
  console.log("serverListens on " + serverPort);
}

function sendHomePage(req, res) {
  console.log("sendHomePage");
  let sqlContexts = "SELECT * FROM contexts ORDER BY id DESC LIMIT 6";
  let sqlEntities = "SELECT * FROM entities ORDER BY id DESC LIMIT 6";
  dbConnexion.query(sqlContexts, (err, contexts) => {
    if (err) throw err;
    dbConnexion.query(sqlEntities, (err, entities) => {
      if (err) throw err;
      res.render("pages/index", {
        contextItems: contexts.rows,
        entitiesItems: entities.rows
      });
    });
  });
}

//App settings and routes
console.log("start express")
const app = express();
app
  .use(express.static(path.join(__dirname, "public")))
  .use(
    "/javascript/vis-network",
    express.static(__dirname + "/node_modules/vis-network/dist/")
  )
  .use(bodyParser.urlencoded({ extended: true }))
  .set("views", path.join(__dirname, "views"))
  .set("view engine", "ejs")
  .use(require("./controllers"))
  .get("/", sendHomePage);
  
console.log("app defined")
// -- it begins here --//
let serverPort = process.env.PORT;
if (serverPort == null || serverPort == "") {
  serverPort = 3000;
}
app.listen(serverPort, serverListens());
