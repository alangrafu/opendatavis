
var data = [];
var newData = null;
var tablesDisplayed = false;

function displayTables(){
  if(tablesDisplayed){
    $(".grid").show(400);
    $(".datasetTable div.btn-group").show(400);
    $(".filterSection").show(400);
  }else{
    $(".grid").hide(400);
    $(".datasetTable div.btn-group").hide(400);
    $(".filterSection").hide(400);
  }
  //tablesDisplayed = !tablesDisplayed;
}

function getData(url){
  var data = null;
  $.ajax({
    url: url,
    async: false,
    dataType: "json",
    success: function(d){
      var config = {
        sortcol: "",
        dataset: url,
        columns: [],
        headerColumns: [],
        searchField: "",
      };

      if(d.rows !=undefined){
        data = d;
        if(d.title != undefined){
          config.title = d.title;
          if(d.source != undefined){
            config.subtitle = "<small>(Taken from <a href='"+d.source+"'>"+d.source+"</a>)</small>";
          }
        }
      }else if(d.groupby != undefined && d.dataset != undefined){
        var groupby = d.groupby, variable = d.variable;
        if(links.length > 0){
          var lastLink = links.pop();
          lastLink.target = url;
          lastLink.targetType = "group";
          links.push(lastLink);
          links.push({source: url, target: d.source, sourceType: "group", targetType: "dataset"});
        }
        getData(d.dataset);
        var countData = [], sumData = [];
        $.each(newData.rows, function(i, item){
          if(item[groupby] != undefined){
            if(countData[item[groupby]] == undefined){
              countData[item[groupby]] = {};
            }
            if(sumData[item[groupby]] == undefined){
              sumData[item[groupby]] = {};
            }
            $.each(d.variable, function(i, v){
              var thisValue = parseFloat(item[variable]);
              if(d.operation == 'count' || !isNaN(thisValue)){
                if(countData[item[groupby]][d.operation+"_"+v] == undefined){
                  countData[item[groupby]][d.operation+"_"+v] = 1;
                }else{
                  countData[item[groupby]][d.operation+"_"+v]++;          
                }
                if(sumData[item[groupby]][d.operation+"_"+v] == undefined){
                  sumData[item[groupby]][d.operation+"_"+v] = parseFloat(item[v]);
                }else{
                  sumData[item[groupby]][d.operation+"_"+v] += parseFloat(item[v]);
                }
              }
            });
          }
        });
        var groupedData = [];
        if(d.operation == "count"){
          groupedData = countData;
        }else if(d.operation == "sum"){
          groupedData = sumData;
        }else if(d.operation == "average"){
          for(i in sumData){
            for(j in sumData[i]){
              if(groupedData[i] == undefined){
                groupedData[i] = {};
              }
              groupedData[i][j] = sumData[i][j]/countData[i][j];
            }
          }
        }
        var counter = 0;
        var auxData = [];
        data = {};
        var header = [
        {"name": groupby, "value": groupby},
        ];
        $.each(d.variable, function(i, v){
          header.push({"name": d.operation+"_"+v, "value": d.operation+"_"+v});
        });
        console.log("grouped", countData);
        for(i in groupedData){
          var newItem = {};
          var item = groupedData[i];
          newItem["id"] = "id_"+counter;
          newItem[groupby] = i;
          $.each(item, function(i, v){
            newItem[i]=v;
          });
          auxData.push(newItem);
          counter++;
        }
        data = {rows: auxData, header: header};
        config.title = "Grouped by "+groupby+" ("+d.operation+") using "+variable;
        $("#main").append("<div class='row arrow span12'>GENERATED BY GROUPING</div>");
      }else if(d.merge !=undefined){ ////////BEGIN MERGE
        if(links.length > 0){
          var lastLink = links.pop();
          lastLink.target = "Merging";
          lastLink.targetType = "merge";
          links.push(lastLink);
        }
        var datasets = new Array();
        var title = new Array(), newHeader = new Array();
        var id = new Array(),
        var1 = d.merge[0].field,
        var2 = d.merge[1].field;
        var newHeaderColumns = new Array();
        for(var i in d.merge){
          if(links.length > 0){
            links.push({source: "Merging", target: d.merge[i].dataset, sourceType: "merge", targetType: "dataset"});
          }
          getData(d.merge[i].dataset);
          if(i < d.merge.length -1){
            $("#main").append("<div class='row merged span12'>MERGED WITH</div>");
          }
          title[title.length] = newData.title;
          var newColumns = new Array();          
          var j = datasetEditors.length-1;
          if(datasetEditors[j].filter != undefined && datasetEditors[j].filter.length > 0){
            arg = datasetEditors[j].filter[0];
            datasetEditors[j].dataView.setFilter(datasetEditors[j].myFilter);
            datasetEditors[j].dataView.setFilterArgs(arg);
          }
          for(var k in datasetEditors[j].columns){
            var aux = datasetEditors[j].columns[k];
            newHeader.push({name: newData.title+"_"+aux.name, value: newData.title+"_"+aux.name});
          }

          console.log("merge newheader", newHeader);
          id.push({id: j, hc: datasetEditors[j].headerColumns, c: datasetEditors[j].columns});
        }


        var id1 = id[0].id, id2 = id[1].id;
        var matchCounter = 0;
        var newRows = [];
        config.title = "Merge '"+datasetEditors[id1].title+"' and '"+datasetEditors[id2].title+"'";
        $.each(datasetEditors[id1].dataSelection.rows, function(i, item1){
          $.each(datasetEditors[id2].dataSelection.rows, function(j, item2){
            if(item1[var1] == item2[var2]){
              var newItem = {id: matchCounter++};
              for(var k in item1){
                if(k != "id"){
                  newItem[title[0]+"_"+k] = item1[k];
                }
              }
              for(var k in item2){
                if(k != "id"){
                  newItem[title[1]+"_"+k] = item2[k];
                }
              }
              newRows.push(newItem);
            }    
          });
        });        
       

        data = {header: newHeader, rows: newRows, title: "Merge between "+title[0]+" and "+title[1]};
          //return;
      $("#main").append("<div class='row arrow span12'>GENERATES BY MERGE</div>");
      /////////////////END MERGE
    }else{
      alert("something is wrong");
      return;
    }//end else
    newData = data;
    console.log(newData);
    var i = datasetEditors.length;

    if(typeof(config.headerColumns) == 'array'){
      searchField = config.headerColumns[0];
    }
    for(var j in data.header){
      config.columns.push({id: data.header[j].value, name: data.header[j].name, field: data.header[j].value, cssClass: "cell-title", sortable: true });
    }
    config.data = d.rows;
    if(typeof(config.headerColumns) == 'array'){
      config['sortcol'] = config.headerColumns[0];
    }else{
      config['sortcol'] = "";
    }
    config.data    = data.rows;
    config.div     = "dataset"+i;
    //config.title   = data.title;
    config.editorId= i;

    datasetEditors[i] = new Editor;
    datasetEditors[i].init(config);
    datasetEditors[i].setData(data.rows);
    //BEGIN SHOW TABLE
          if(datasetEditors[i].filter != undefined && datasetEditors[i].filter.length > 0){
            arg = datasetEditors[i].filter[0];
            datasetEditors[i].dataView.setFilter(datasetEditors[j].myFilter);
            datasetEditors[i].dataView.setFilterArgs(arg);
          }
    if(showDatasetsTables){
      datasetEditors[i].showTable();
      datasetEditors[i].fillHeaders();

      displayTables(false);
    }
    //END SHOW TABLE
  }
});
}


var isInIFrame = (window.location != window.parent.location);
if(isInIFrame==true){
  $("#metadata").hide();
  $(".navbar").hide();
}else{
  //$("h1").on('mouseover', function(){
    $(".menu-button").removeClass("hidden")
    //})
  //.on('mouseout', function(){$(".menu-button").addClass("hidden")});
  //$("#chartContainer").on('mouseover', function(){$(".menu-button").removeClass("hidden")})
  //.on('mouseout', function(){$(".menu-button").addClass("hidden")});
}
