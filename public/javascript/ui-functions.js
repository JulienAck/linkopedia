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
      font: { color: "#333", size: 12 },
      widthConstraint: {
        maximum: 120
      },
      borderWidth: 3
    },
    edges: {
      color: "#66a",
      font: {
        size: 10,
        color: "#66a",
        align: "middle"
      },
      "smooth": false
    },
    physics: false,
    width: '100%',
    height: '80%',
    locale: 'fr'
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

// SEARCH
function addSearchEntityField(searchElementId,destinationName,isLink=false) {
  var searchElement=document.getElementById(searchElementId);
  if (searchElement!=undefined) {
    var searchResultField=document.createElement("input");
    searchResultField.setAttribute("type","hidden");
    searchResultField.setAttribute("name",destinationName);
    var searchResultList=document.createElement("div");
    searchResultList.setAttribute("class","search-results");
    var searchTextField=document.createElement("input");
    searchTextField.setAttribute("type","text");
    searchElement.appendChild(searchTextField);
    searchTextField.addEventListener("input", function(evt) {
        if (this.value.length > 2) {
          searchResultList.innerHTML="";
          console.log("Search : " + this.value);
          $.ajax({
            url: "/search/entities/" + this.value
          })
            .done(function(res) {
              console.log(res);
              var resultListElements=document.createElement("ul");
              for (let i = 0; i < res.length; i++) {
                var resultItemElement = document.createElement("li");
                var resultItemLinkElement = document.createElement("a");
                resultItemLinkElement.setAttribute(
                  "href",
                  "/entities/edit/" + res[i].id
                );
                var resultItemImgContainerElement = document.createElement("div");
                resultItemImgContainerElement.setAttribute(
                  "class",
                  "search-result-profile-pic"
                );
                var resultItemImgElement = document.createElement("img");
                resultItemImgElement.setAttribute("src", res[i].profile_pic_url);
                resultItemImgContainerElement.appendChild(resultItemImgElement);
                resultItemLinkElement.appendChild(resultItemImgContainerElement);
                resultItemLinkElement.appendChild(
                  document.createTextNode(res[i].name)
                );
                if (!isLink) {
                  resultItemLinkElement.addEventListener("click", function(event) {
                    event.preventDefault();
                    searchResultField.value=res[i].id;
                    searchTextField.value=res[i].name;
                    searchResultList.innerHTML="";
                    searchElement.removeChild(searchResultList);
                  });
                }
                resultItemElement.appendChild(resultItemLinkElement);
                resultListElements.appendChild(resultItemElement);
              }
              resultListElements.appendChild(document.createElement("br"));
              searchResultList.appendChild(resultListElements);
              searchElement.appendChild(searchResultList);
              searchElement.appendChild(searchResultField);
            })
            .fail(function(err) {
              console.log("Search error: " + err.status);
            });
        } else {
            searchResultField.value = "";
            searchResultList.innerHTML="";
            searchElement.removeChild(searchResultList);
        }
    });
  }
}