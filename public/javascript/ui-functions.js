function showEditBox(id) {
  var editBoxToShow = document.getElementById("edit-box-" + id);
  if (editBoxToShow != undefined) {
    if (
      window
        .getComputedStyle(editBoxToShow, null)
        .getPropertyValue("display") == "none"
    ) {
      editBoxToShow.style.display = "block";
    } else {
      editBoxToShow.style.display = "none";
    }
  }
}

function drawNetwork(container, nodes, edges) {
  var data = {
    nodes: nodes,
    edges: edges
  };
  var options = {};
  var network = new vis.Network(container, data, options);
  console.log(network);
}

function getAndDrawNetworkFromEntityId(entityId, containerId) {
  let urlRelations = "/relations/api/" + entityId;
  $.ajax({
    url: urlRelations
  })
    .done(function(res) {
      console.log(res);
      // create node list from rows
      var nodes = new vis.DataSet(res.nodeItems);
      var edges = new vis.DataSet(res.relationItems);
      var container = document.getElementById(containerId);

      // create a network
      drawNetwork(container, nodes, edges);
    })
    .fail(function(err) {
      console.log("Error: " + err.status);
    });
}

function getAndListEntities(containerId) {
  let urlEntities = "/entities/list/";
  $.ajax({
    url: urlEntities
  })
    .done(function(res) {
      console.log(res);

      var container = document.getElementById(containerId);
      container.innerHTML = res;
    })
    .fail(function(err) {
      console.log("Error: " + err.status);
    });
}

function loadEditor(resourceName) {
    let urlResource = "/"+resourceName+"/list/";
    $.ajax({
      url: urlResource
    })
      .done(function(res) {
        let editorWindow = document.getElementById("editor-window");
        editorWindow.innerHTML = res;
      })
      .fail(function(err) {
        console.log("Error: " + err.status);
      });
  }