$(function(){

  $("#confirmLoad").on('click', function(){
    var loadDataset = $("#dataset-list option:selected").val();
    var config = {
      sortcol: "{{first.header.val.value|slugify}}",
      div: "dataset"+datasetEditors.length,
      dataset: loadDataset,
      editorId: datasetEditors.length,
      title: $("#dataset-list option:selected").html(),
      columns: [],
      headerColumns: null,
      searchField: ""
    };
    createEditor(config)
  });

  //Remove added fields in grouping dialog
  $("body").on('click', ".remove-group-field", function(){
    $(this).parent().remove();
  });
  
  //Add fields in grouping dialog
  $("#add-group-field").on('click', function(){
    var o = $("#group-variable").html();
    $("#group-fields").append("<div><select class='group-variable'>"+o+"</select> <button class='btn btn-warning btn-mini remove-group-field'>Remove field</button></div>");
  });


//Map chart
$("#mapRun").on('click', function(){
  var id = $("#map-editor-id").val()
  log("running map from editor "+id);
  var config = {
    dataset: $("#map-dataset").val(),
    params: {
      lat: $("#lat").val(),
      lon: $("#lon").val()
    },
    height: $("#map-height").val(),
    width: $("#map-width").val(),
    readOnly: false
  };
  datasetEditors[id].renderMap(config);
});


//Bar chart
$("#chartRun").on('click', function(){
  var id = $("#chart-editor-id").val()
  log("running chart from editor "+id);
  config = {
    chartType: $("#chart-type").val(),
    dataset: $("#chart-dataset").val(),
    params: {
      var1: $("#var1").val(),
      var2: $("#var2").val(),
    },
    height: $("#chart-height").val(),
    width: $("#chart-width").val(),
    readOnly: false,
    numericx: $('#var1string').is(':checked')
  };
  datasetEditors[id].renderChart(config);
});

//Group operations
$("#runGroup").on('click', function(){
  var id = $("#group-editor-id").val()
  var fields = [];
  log("running group from editor "+id);
  $.each($(".group-variable"), function(i, item){
    fields.push($(item).find(":selected").val());
  });
  log($("#group-dataset").val());
  config = {
    dataset: $("#group-dataset").val(),
    operation: $("#group-operation option:selected").val(), 
    groupby: $("#grouped-by option:selected").val(),
    variable: fields
  };
  datasetEditors[id].renderGroup(config);
});

$("#merge-dataset1").on('change', function(){
  var id = $("#merge-dataset1 option:selected").val();
  var options = "";
  $.each(datasetEditors[id].headerColumns, function(i, item){
    options += "<option value='"+item.value+"'>"+item.name+"</option>";
  });
  $("#merge-field1").html(options);
});


$("#merge-dataset2").on('change', function(){
  var id = $("#merge-dataset2 option:selected").val();
  var options = "";
  $.each(datasetEditors[id].headerColumns, function(i, item){
    options += "<option value='"+item.value+"'>"+item.name+"</option>";
  });
  $("#merge-field2").html(options);
});

$("#runMerge").on('click', function(){
  var id1 = $("#merge-dataset1 option:selected").val(),
      id2 = $("#merge-dataset2 option:selected").val(),
      var1 = $("#merge-field1 option:selected").val(),
      var2 = $("#merge-field2 option:selected").val();

  var title1 = datasetEditors[id1].title.replace(".", "_"),
      title2 = datasetEditors[id2].title.replace(".", "_");

  var newHeaderColumns = [], newColumns = [];
  var hc1 = datasetEditors[id1].headerColumns,
      hc2 = datasetEditors[id2].headerColumns,
      c1 = datasetEditors[id1].columns,
      c2 = datasetEditors[id2].columns;

  //New headerColumns
  for(var k in hc1){
    var aux = {name: title1+"_"+hc1[k].name, value: title1+"_"+hc1[k].value};
    newHeaderColumns.push(aux);
  }
  for(var k in hc2){
    var aux = {name: title2+"_"+hc2[k].name, value: title2+"_"+hc2[k].value};
    newHeaderColumns.push(aux);
  }

  //New columns
  for(var k in c1){
    var aux = {id: title1+"_"+c1[k].id, name: title1+"_"+c1[k].name, field: title1+"_"+c1[k].field, cssClass: "cell-title", sortable: true };
    newColumns.push(aux);
  }
  for(var k in c2){
    var aux = {id: title2+"_"+c2[k].id, name: title2+"_"+c2[k].name, field: title2+"_"+c2[k].field, cssClass: "cell-title", sortable: true };
    newColumns.push(aux);
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
            newItem[title1+"_"+k] = item1[k];
          }
        }
        for(var k in item2){
          if(k != "id"){
            newItem[title2+"_"+k] = item2[k];
          }
        }
        newRows.push(newItem);
      }    
    });
  });
var newConfig = {
    sortcol: "",
    div: "dataset"+datasetEditors.length,
    dataset: {
               merge: [
                        {
                          dataset: datasetEditors[id1].dataset,
                          field: var1,
                          filters: [{column: datasetEditors[id1].searchField, value: datasetEditors[id1].searchString}]
                        },
                        {
                          dataset: datasetEditors[id2].dataset,
                          field: var2,
                          filters: [{column: datasetEditors[id2].searchField, value: datasetEditors[id2].searchString}]
                        }

               ]
    },
    columns: newColumns,
    headerColumns: newHeaderColumns,
    searchField: "",
    title: "Merge dataset ("+title1+" and "+title2+")",
    editorId: datasetEditors.length,
    data: newRows
  };
    console.log("===== merge =====");
    console.log(newConfig.dataset);

      newConfig['sortcol'] = newConfig.headerColumns[0];
      i = datasetEditors.length;
      datasetEditors[i] = new Editor;
      datasetEditors[i].init(newConfig);
      datasetEditors[i].showTable();
});

}