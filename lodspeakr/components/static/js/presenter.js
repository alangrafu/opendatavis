
var data = [];
var newData = null;
function getData(url){
  var data = null;
  $.ajax({
    url: url,
    async: false,
    dataType: "json",
    success: function(d){
      if(d.rows !=undefined){
        data = d;
      }else if(d.groupby != undefined && d.dataset != undefined){
        var groupby = d.groupby, variable = d.variable;
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
        data.header = [
        {"name": groupby, "value": groupby},
        ];
        $.each(d.variable, function(i, v){
          data.header.push({"name": d.operation+"_"+v, "value": d.operation+"_"+v});
        });
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
        data.rows = auxData;
      }else if(d.merge !=undefined){////////BEGIN MERGE
        var datasets = new Array();
        var title = new Array();
        var id = new Array(),
        var1 = d.merge[0].field,
        var2 = d.merge[1].field;

        for(var i in d.merge){
          getData(d.merge[i].dataset);
          title[title.length] = newData.title;
          var newHeaderColumns = new Array(), newColumns = new Array();          
          var j = datasetEditors.length-1;
          if(datasetEditors[j].filter != undefined && datasetEditors[j].filter.length > 0){
            arg = datasetEditors[j].filter[0];
            datasetEditors[j].dataView.setFilter(datasetEditors[j].myFilter);
            datasetEditors[j].dataView.setFilterArgs(arg);
          }
            //datasetEditors[j].dataView.sort(self.comparer, 1);
            datasetEditors[j].dataView.endUpdate();
            id.push({id: j, hc: datasetEditors[j].headerColumns, c: datasetEditors[j].columns});

          }


          var newHeaderColumns = [], newColumns = [], newHeader = new Array();
        //New headerColumns
        for(var l in id){
          var hc1 = id[l].hc, c1 = id[l].c;
          for(var k in hc1){
            var aux = {name: title[0]+"_"+hc1[k].name, value: title[0]+"_"+hc1[k].value};
            newHeaderColumns.push(aux);
          }
          //New columns
          for(var k in c1){
            var aux = {id: title[0]+"_"+c1[k].id, name: title[0]+"_"+c1[k].name, field: title[0]+"_"+c1[k].field, cssClass: "cell-title", sortable: true };
            newColumns.push(aux);
            newHeader.push(c1[k].name);
          }
          datasetEditors[id[l].id].obtainSelection();
        }
        var id1 = id[0].id, id2 = id[1].id;
        var matchCounter = 0;
        var newRows = [];
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
        data = {header: newHeader, rows: newRows};
        console.log("prior merge", data);
          //return;
/////////////////END MERGE
}else{
  alert("something is wrong");
  return;
      }//end else
      newData = data;
      i = datasetEditors.length;

      var config = {
        sortcol: "",
        div: "dataset"+i,
        dataset: url,
        columns: [],
        data: data.rows,
        headerColumns: [],
        searchField: "",
        title: "asd",
        editorId: i,
      }
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
      alert("Normal! "+i);
      datasetEditors[i] = new Editor;
      datasetEditors[i].init(config);
      datasetEditors[i].setData(data.rows);
//BEGIN SHOW TABLE
if(showDatasetsTables){
  datasetEditors[i].showTable();
  datasetEditors[i].fillHeaders();
//END SHOW TABLE
}
}
});
}


var isInIFrame = (window.location != window.parent.location);
if(isInIFrame==true){
  $("#metadata").hide();
  $(".navbar").hide();
}else{
  $("h1").on('mouseover', function(){$(".menu-button").removeClass("hidden")})
  .on('mouseout', function(){$(".menu-button").addClass("hidden")});
  $("#chartContainer").on('mouseover', function(){$(".menu-button").removeClass("hidden")})
  .on('mouseout', function(){$(".menu-button").addClass("hidden")});
}
