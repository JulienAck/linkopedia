const express = require("express");
const router = express.Router();
const dbConnexion = require("./database");
const got = require('got');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

function list(req, res) {
  console.log("wikipedia::list");
  let sqlAllWikipediaEntities =
    "SELECT * FROM entities ORDER BY id DESC LIMIT 30";
  let sqlAllEntities = "SELECT * FROM entities WHERE wikipedia_url IS NOT NULL ORDER BY id DESC LIMIT 1000";

  dbConnexion.query(sqlAllEntities, (err, entities) => {
    if (err) throw err;
    res.render("pages/wikipedia", {
    entitiesItems: entities.rows
    });
  });
}

const isWiki = (link) => {
  // Return false if there is no href attribute.
  if(typeof link.href === 'undefined') { return false }
  return link.href.includes('/wiki/');
};

const isNotPortail = (link) => {
  // Return false if there is no href attribute.
  if(typeof link.href === 'undefined') { return false }
  return !link.href.includes('Portail:');
};

const isNotCategory = (link) => {
  // Return false if there is no href attribute.
  if(typeof link.href === 'undefined') { return false }
  return !link.href.includes('Cat%C3%A9gorie:');
};

const isNotAide = (link) => {
  // Return false if there is no href attribute.
  if(typeof link.href === 'undefined') { return false }
  return !link.href.includes('Aide:');
};

const isNotImage = (link) => {
  // Return false if there is no href attribute.
  if(typeof link.href === 'undefined') { return false }
  return (!link.href.includes('.svg')&&!link.href.includes('.png')&&!link.href.includes('.jpg')&&!link.href.includes('.gif'));
};

const isNotOuvrageReference = (link) => {
  // Return false if there is no href attribute.
  if(typeof link.href === 'undefined') { return false }
  return (!link.href.includes('/wiki/Sp%C3%A9cial:Ouvrages_de_r%C3%A9f%C3%A9rence'));
};

function dedupLowerCaseArray(arr) {
  // Renvoie tableau avec la casse originale mais dédupliqué sur la valeur lowercase
  let sortedArr = arr.sort();
  let returnArr = [""];
  let j = 0 ;
  for (let i=0; i<sortedArr.length; i++) {
    if (sortedArr[i].toLowerCase()!=returnArr[j].toLowerCase()) {
      returnArr.push(sortedArr[i]);
      j++;
    }
  }
  returnArr.shift();
  return returnArr;
}

async function createRelationFromWikipediaLinks(sourceEntityId,WPurl,next){
  // Crée une relation à partir de liens du champs wikipedia_links, fonction récursive qui utilise le premier élément du tableau, et s'appelle elle-même avec le tableau tronqué du 1er élément. Appelle la fonction next() quand le tableau est vide.
  console.log("wikipedia::createRelationFromWikipediaLinks");
  let searchedWP = "https://fr.wikipedia.org"+WPurl[0];

  // Trouve l'entité qui a le wikipedia_url égal au premier élément du tableau
  dbConnexion.query(
    "SELECT * FROM entities WHERE wikipedia_url=$1",
    [searchedWP],
    (err, sqlResult) => {
      if (err) {
        console.log(err);
        res.sendStatus(500);
        return;
      }
      if (sqlResult.rows[0]!=undefined) {
        console.log("Trouvé entité "+sqlResult.rows[0].name+" avec wikipedia_url "+searchedWP);
        let id1 = Math.min(sqlResult.rows[0].id, sourceEntityId);
        let id2 = Math.max(sqlResult.rows[0].id, sourceEntityId);
        dbConnexion.query(
          "INSERT INTO relations (entity_source_id,entity_destination_id) VALUES ($1, $2)",
          [
            id1,
            id2
          ],
          (err, sqlResult) => {
            //if (err) throw err;
            if (err) {
              console.log(err);
              next();
            } else {
              WPurl.shift();
              if (WPurl.length>0) {
                createRelationFromWikipediaLinks(sourceEntityId,WPurl,next);
              } else {
                next();
              }
            }
          }
        );
      } else {
        console.log("Pas trouvé d'entité avec wikipedia_url "+searchedWP);
      }
      WPurl.shift();
      if (WPurl.length>0) {
        createRelationFromWikipediaLinks(sourceEntityId,WPurl,next);
      } else {
        console.log("Terminé wikipedia::createRelationFromWikipediaLinks");
        next();
      }
    });
  // Crée une relation entre sourceEntityId et l'Id trouvé associé au premier élément de WPurl
}

function createRelationsFromWPLinks(req,res) {
  // Crée des relations à partir des liens dans le champs "wikipedia_links"
  console.log("wikipedia::createRelationsFromWPLinks::"+req.params.id);
  let entityId = req.params.id;

  // Extraire l'entité
  dbConnexion.query(
    "SELECT wikipedia_links FROM entities WHERE id=$1",
    [entityId],
    (err, sqlResult) => {
      if (err) {
        console.log(err);
        res.sendStatus(500);
        return;
      }
      if (sqlResult.rows[0]!=undefined&&sqlResult.rows[0].wikipedia_links!="") {
        // Il y a des liens wikipédia
        let WPlinks = JSON.parse(sqlResult.rows[0].wikipedia_links);
        console.log("WPlinks exist: "+WPlinks.length);
        if (WPlinks!=undefined) {
          createRelationFromWikipediaLinks(entityId,WPlinks,function(){});
          res.redirect("/wikipedia/");
          return;
        }
      }
  });
}

function insertRelationsFromWPLinks(entityId) {
  // Vérifier si l'entité existe et a des liens wikipédia
  console.log("wikipedia::insertRelationsFromWPLinks::"+entityId)
  dbConnexion.query(
    "SELECT wikipedia_links FROM entities WHERE id=$1",
    [entityId],
    (err, sqlResult) => {
      if (err) {
        console.log(err);
        res.sendStatus(500);
        return;
      }
      if (sqlResult.rows[0]!=undefined&&sqlResult.rows[0].wikipedia_links!="") {
        // Il y a des liens wikipédia
        let WPlinks = JSON.parse(sqlResult.rows[0].wikipedia_links);
        console.log("WPlinks exist: "+WPlinks);
        if (WPlinks!=undefined) {
          createEntityFromWikipedia(WPlinks,function(){});
          return;
        }
        return;
      } else {
        // Aucun lien wikipedia trouvé
        console.log("No wikipedia links found for this entity or entity not found");
        return;
      }
    }
  );
  return;
}

function createEntitiesFromWPLinks(req,res) {
  // Crée des entités à partir des liens trouvés dans une fiche wikipédia
  console.log("wikipedia::createEntitiesFromWPLinks::"+req.params.id);
  insertRelationsFromWPLinks(req.params.id);
  res.redirect("/wikipedia/");
}

async function createEntityFromWikipedia(WPurl,next){
  // Crée une entité à partir du scraping de la page Wikipédia, fonction récursive qui utilise le premier élément du tableau, et s'appelle elle-même avec le tableau tronqué du 1er élément. Appelle la fonction next() quand le tableau est vide.
  console.log("wikipedia::createEntityFromWikipedia");
  try {
    console.log("create "+WPurl[0]);
    if (WPurl[0].indexOf("//fr.wikipedia.org")==-1) {
      console.log("add domain indexOf="+WPurl[0].indexOf("https://fr.wikipedia.org"));
      WPurl[0] = "https://fr.wikipedia.org"+WPurl[0];
    } 
    const response = await got(WPurl[0]);  
    const dom = new JSDOM(response.body);
    const domContent = dom.window.document.querySelector('main');
    const canonicalUrl = dom.window.document.querySelectorAll('link[rel=canonical]')[0].href;
    console.log(WPurl[0]+ " => "+canonicalUrl);

    // Insertion de l'entité dans la BD
    dbConnexion.query(
      "SELECT id FROM entities WHERE wikipedia_url=$1",
      [canonicalUrl],
      (err, sqlResult) => {
        if (err) {
          console.log(err);
          res.sendStatus(500);
          return;
        }
        console.log("check existence result:"+sqlResult.rows[0])
        if (sqlResult.rows[0]!=undefined) {
          // L'entité existe déjà, on passe à l'élément suivant dans le tableau
          console.log("Entity id already exists:"+sqlResult.rows[0].id);
          WPurl.shift();
          if (WPurl.length>0) {
            createEntityFromWikipedia(WPurl,next);
          } else {
            next();
          }
          return;
        } else {
          // Aucune entité n'a cette url wikipedia associée, on appelle la création
          console.log("Entity does not exists, create entity "+canonicalUrl);
          
          // Récupération des données de la page wikipedia
      
          let WPdata = {};
          WPdata.wikipedia_url = canonicalUrl;
          WPdata.entityTypeId = 1;
          WPdata.name = domContent.querySelector('h1').textContent;
          let description = domContent.querySelectorAll('p');
          WPdata.description = "";
          for (let i=0; i<4; i++) {
            if (description[i]!=undefined) {
              WPdata.description += description[i].textContent;
            }
          }
          let WPinfobo = domContent.querySelector('.infobox, .infobox_v2, .infobox_v3');
          if (WPinfobo!=undefined) {
            let imageLink = domContent.querySelector('.image');
            if (imageLink!=undefined) {
              WPdata.profile_pic_url = imageLink.querySelector('img').src;
            } 
          } 
          WPdata.wikipedia_links = "";
          const nodeList = [...domContent.querySelectorAll('p > a')];
          let links = [];
          nodeList.filter(isWiki).filter(isNotOuvrageReference).filter(isNotPortail).filter(isNotCategory).filter(isNotAide).filter(isNotImage).forEach(link => {
            links.push(link.href);
          });
          WPdata.wikipedia_links = JSON.stringify(dedupLowerCaseArray(links));
          //console.log(WPdata.wikipedia_links);

          // Insertion dans la base
          dbConnexion.query(
            "INSERT INTO entities (id,name,wikipedia_description,entity_type_id,profile_pic_url,wikipedia_url,wikipedia_links) VALUES (nextval(pg_get_serial_sequence('entities', 'id')), $1, $2,$3,$4,$5,$6);",
            [WPdata.name, WPdata.description, WPdata.entityTypeId, WPdata.profile_pic_url,WPdata.wikipedia_url,WPdata.wikipedia_links],
            (err, sqlResult) => {
              if (err) {
                console.log(err);
                res.sendStatus(500);
                return;
              }
              console.log("inserted successfully " + WPdata.name + " - "+ WPdata.wikipedia_url);
              WPurl.shift();
              if (WPurl.length>0) {
                createEntityFromWikipedia(WPurl,next);
              } else {
                console.log("Terminé wikipedia::createEntityFromWikipedia");
                next();
              }
              return;
            }
          );
        }
      }
    );

  }
  catch(e) {
    // Si problème pendant le scraping de la page wikipedia
    console.log(e);
    return;
  }
  return;
}

function insert(req, res) {
  // Vérifie si on a déjà une entité associée à la page wikipédia fournie en argument. Si non, on la crée.
  console.log("============== wikipedia::insert::"+new Date() + "==================");
  let insertResult = createEntityFromWikipedia([req.body.wikipedia_url],function(){res.redirect("/wikipedia/");});
}

function autoCreateLinks(req, res) {
  // Crée automatiquement les relations entre entités
  dbConnexion.query(
    "SELECT id, wikipedia_links FROM entities",
    (err, sqlResult) => {
      if (err) {
        console.log(err);
        res.sendStatus(500);
        return;
      }
      for (let i=0; i<sqlResult.rows.length; i++) {
        createRelationFromWikipediaLinks(sqlResult.rows[i].id,JSON.parse(sqlResult.rows[i].wikipedia_links),function(){});
      }
      res.redirect("/wikipedia/");
    });
}

router.get("/", list);
router.post("/insert", insert);
router.get("/createEntitiesFromWPLinks/:id", createEntitiesFromWPLinks);
router.get("/createRelationsFromWPLinks/:id", createRelationsFromWPLinks);
router.get("/autoCreateLinks", autoCreateLinks);

module.exports = router;