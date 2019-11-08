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

function drawNetwork(containerId, nodes, edges) {
  var container = document.getElementById(containerId);
  var data = {
    nodes: nodes,
    edges: edges
  };
  var options = {
    nodes: {
      size: 30,
      color: {
        border: '#333',
        background: '#999'
      },
      font: { color: "#333", size: 10 },
      borderWidth:3
    },
    edges: {
      color:"#666"
    },
    physics: false
  };

  var network = new vis.Network(container, data, options);
  network.on("click", function (params) {
    console.log(params);
    getAndDrawNetworkFromEntityId(params.nodes[0], containerId);
  });
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

      // create a network
      drawNetwork(containerId, nodes, edges);
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
  let urlResource = "/" + resourceName + "/list/";
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
