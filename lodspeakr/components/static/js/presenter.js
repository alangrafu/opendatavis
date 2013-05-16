
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
      }else{
        if(d.groupby != undefined && d.dataset != undefined){
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
                          {"name": "id", "value": "id"},
                          {"name": groupby, "value": groupby},
                        ];
          $.each(d.variable, function(i, v){
            data.header.push({"name": v, "value": v});
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
        }else if(d.merge !=undefined){
   ////////BEGIN MERGE
          var datasets = new Array();
          var title = new Array();

          for(var i in d.merge){
            getData(d.merge[i].dataset);
            title[title.length] = newData.title;
            var newHeaderColumns = new Array(), newColumns = new Array();
            for(var k in newData.header){
              var aux = {name: title[i]+"_"+newData.header[k].name, value: title[i]+"_"+newData.header[k].value};
              newHeaderColumns.push(aux);
              aux = {id: title[i]+"_"+newData.header[k].name, name: title[i]+"_"+newData.header[k].name, field: title[i]+"_"+newData.header[k].name, cssClass: "cell-title", sortable: true };
              newColumns.push(aux);
            }
            var newConfig = {
              columns: newColumns,
              headerColumns: newHeaderColumns,
              searchField: "",
              title: "Merge dataset ("+title[0]+" and "+title[1]+")",
              editorId: datasetEditors.length,
              data: newData.rows,
              filter: [ {searchString: d.merge[i].filter[0].value, searchField: d.merge[i].filter[0].column }]

            };
            var j = datasetEditors.length;
            datasetEditors[j] = new Editor;
            datasetEditors[j].init(newConfig);
            datasetEditors[j].setData(newData.rows);
            datasetEditors[j].dataView.beginUpdate();
            console.log(newConfig);
            if(newConfig.filter != undefined && newConfig.filter.length > 0){
              arg = newConfig.filter[0];
              datasetEditors[j].dataView.setFilter(datasetEditors[j].myFilter);
              datasetEditors[j].dataView.setFilterArgs(arg);
            }
            //datasetEditors[j].dataView.sort(self.comparer, 1);
            datasetEditors[j].dataView.endUpdate();

          }

          var id1 = 0,
              id2 = 1,
              var1 = d.merge[0].field,
              var2 = d.merge[1].field;

          var newHeaderColumns = [], newColumns = [];
          var hc1 = datasetEditors[id1].headerColumns,
              hc2 = datasetEditors[id2].headerColumns,
              c1 = datasetEditors[id1].columns,
              c2 = datasetEditors[id2].columns;
          //New headerColumns
          for(var k in hc1){
            var aux = {name: title[0]+"_"+hc1[k].name, value: title[0]+"_"+hc1[k].value};
            newHeaderColumns.push(aux);
          }
          for(var k in hc2){
            var aux = {name: title[1]+"_"+hc2[k].name, value: title[1]+"_"+hc2[k].value};
            newHeaderColumns.push(aux);
          }

          //New columns
          var newHeader = new Array();
          for(var k in c1){
            var aux = {id: title[0]+"_"+c1[k].id, name: title[0]+"_"+c1[k].name, field: title[0]+"_"+c1[k].field, cssClass: "cell-title", sortable: true };
            newColumns.push(aux);
            newHeader.push(c1[k].name);
          }
          for(var k in c2){
            var aux = {id: title[1]+"_"+c2[k].id, name: title[1]+"_"+c2[k].name, field: title[1]+"_"+c2[k].field, cssClass: "cell-title", sortable: true };
            newColumns.push(aux);
            newHeader.push(c2[k].name);
          }
          datasetEditors[id1].obtainSelection();
          datasetEditors[id2].obtainSelection();
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
          newData = {header: newHeader, rows: newRows};
          return;
/////////////////END MERGE
        }else{
          alert("something is wrong");
          return;
        }
      }//end else
      newData = data;
    }
  });
}
