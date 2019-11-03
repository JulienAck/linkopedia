const express = require("express");
const pg = require("pg");
const bodyParser = require("body-parser");
const path = require("path");

function serverListens() {
  console.log("serverListens on " + serverPort);
}

function connectSql(err) {
  console.log("connectSql");
  if (err) throw err;
  console.log("Postgres connected...");
}

function sendHomePage(req, res) {
  console.log("sendHomePage");
  res.render("pages/index");
}

//App settings and routes
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

// -- it begins here --//
let serverPort = process.env.PORT;
if (serverPort == null || serverPort == "") {
  serverPort = 3000;
}
app.listen(serverPort, serverListens());
