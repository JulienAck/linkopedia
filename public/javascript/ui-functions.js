// EDITOR
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

// DISPLAY NETWORK
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
        border: "#333",
        background: "#999"
      },
      font: { color: "#333", size: 10 },
      borderWidth: 3
    },
    edges: {
      color: "#666"
    },
    physics: true
  };

  var network = new vis.Network(container, data, options);
  network.on("click", function(params) {
    console.log(params);
    window.location.assign("/entities/" + params.nodes[0]);
  });
}

function getAndDrawNetworkFromAPI(apiUrl, containerId) {
  console.log("draw network from " + apiUrl);
  $.ajax({
    url: apiUrl
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

function searchFeedDestinationElement(valueItems, searchResultsElementId) {
  var destinationElement = document.getElementById(searchResultsElementId);
  if (destinationElement != undefined) {
    destinationElement.innerHTML="";
    var resultListElements = document.createElement("ul");
    for (let i = 0; i < valueItems.length; i++) {
      var resultItemElement = document.createElement("li");
      resultItemElement.innerHTML ="<a href='/entities/"+valueItems[i].id+"'><div class='search-result-profile-pic'><img class='' src="+ valueItems[i].profile_pic_url+" /></div>"+valueItems[i].name+"</a>";
      resultListElements.appendChild(resultItemElement);
    }
    resultListElements.appendChild(document.createElement("br"));
    destinationElement.appendChild(resultListElements);
  }
}

function searchValueChanged(valueSearched, searchResultsElementId) {
  if (valueSearched.length > 2) {
    $.ajax({
      url: "/search/entities/" + valueSearched
    })
      .done(function(res) {
        searchFeedDestinationElement(res, searchResultsElementId);
      })
      .fail(function(err) {
        console.log("Search error: " + err.status);
      });
  }
}

function listenSearchAutocompleteQueries(searchResultsElementId) {
  var searchInputElement = document.getElementById("searchAutoComplete");
  if (searchInputElement != undefined) {
    searchInputElement.addEventListener("input", function(evt) {
      searchValueChanged(this.value,searchResultsElementId);
    });
  }
}
