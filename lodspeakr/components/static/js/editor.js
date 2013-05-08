//Global varis
var vizObj = {};
var sortcol = null;
var datasetNumber = 1;

function Editor(){
  return {
  dataSelection: {rows: []},
  div: null,
  searchString: "",
  sortcol: null,
  dataView: null,
  dataset: null,
  editorId: 0,
  data: null,
  headerColumns: [],
  searchField: null,
  init: function(config){
    var self = this;
    if(config != undefined){
      if(config.sortcol != undefined){
        self.sortcol = config.sortcol;
      }
      if(config.editorId != undefined){
        self.editorId = config.editorId;
      }
      if(config.data != undefined){
        self.data = config.data;
      }
      if(config.columns != undefined){
        self.columns = config.columns;
      }
      if(config.headerColumns != undefined){
        self.headerColumns = config.headerColumns;
      }
    }      
    self.div = config.div;
    self.dataset = config.dataset;
    $("#main").append('<div class="row dataset'+self.editorId+'"><div class="span12 dataset'+self.editorId+' datasetCell"></div></div>');
    $cell = $(".dataset"+self.editorId+" .datasetCell");
    $cell.prepend('<input type="text" class="dataset'+self.editorId+' txtSearch" />');
    $cell.prepend('<select class="fieldSearch dataset'+self.editorId+'"></select>');
    $cell.prepend('<div class="btn-group"><button class="btn btn-large btn-info group-button editor'+self.editorId+'" data-dataset="'+config.dataset+'" data-toggle="modal" data-target="#group-dialog">Group Data</button><button class="btn btn-large btn-info chart-button editor'+self.editorId+'" data-dataset="'+config.dataset+'" data-toggle="modal" data-target="#chart-dialog">Chart</button><button class="btn btn-large btn-info map-button editor'+self.editorId+'" data-dataset="'+config.dataset+'" data-toggle="modal" data-target="#map-dialog">Map</button></div>');
    $cell.prepend('<div style="width:100%;min-height:300px;max-height:500px;" class="span5 grid dataset'+self.editorId+'"></div>');
    $cell.prepend('<h5 class="numberOfSelected dataset'+self.editorId+'"></h5>');
    options = "";
    $.each(self.headerColumns, function(i, item){
      options += "<option value='"+item.value+"'>"+item.name+"</option>";
    });
    $('.fieldSearch.'+self.div).html(options);
    $(".fieldSearch."+self.div).on('change', function(){
      aux = $(".fieldSearch."+self.div+" option:selected").val()
      self.searchField = aux;
    });
    $(".fieldSearch."+self.div).trigger('change');
    $('.editor'+self.editorId).on('click', function(){
      self.fillHeaders();
    })

    $(".group-button").on('click', function(){
      $("#group-dataset").val($(this).attr("data-dataset"));
    });
    $("#confirmShare").unbind('click');
    $("#confirmShare").on('click', function(event){
      var id = $(this).attr("data-chart");
      vizObj[id].title = $("#visualization-title").val();
      if(vizObj[id].url == undefined){
        $.ajax({
          url:'/data/share',
          type: 'POST',
          contentType: "application/json",
          dataType: 'json',
          data: JSON.stringify(vizObj[id]),
          success: function(data){
            if(data.success == true){
              vizObj[id].url = home+data.url;
              $("#share-link").attr("href", vizObj[id].url).html(vizObj[id].url);
              $("#share-dialog").modal('show');
            }else{
              alert("Error while storing visualization");
            }
          },
          error: function(){
            $("#error-message").html("<h4>Share Error</h4><p>OpenDataVis couldn't connect with the server. Try later.</p>");
            $("#error-dialog").modal('show');
          }
        });
      }else{
        $("#share-link").attr("href", vizObj[id].url).html(vizObj[id].url);
        $("#share-dialog").modal('show');
      }
    });
},
setData: function(data){
  var self = this;
  self.dataView = new Slick.Data.DataView({ inlineFilters: true });
  self.dataView.setItems(data);
  self.dataSelection["rows"] = data;
},
fillHeaders: function (){
  var self = this;
  var option = "";
  $.each(self.headerColumns, function(i, item){
    option += "<option value='"+item.value+"'>"+item.name+"</option>";
  });
  $("#lat").html(option);
  $("#lon").html(option);
  $("#var1").html(option);
  $("#var2").html(option);
  $("#group-variable").html(option);
  $("#grouped-by").html(option);
},
myFilter: function(item, args) {
  var self = args;
  if(args.searchString != undefined && args.searchString != "" && item[self.searchField] != undefined && item[self.searchField].indexOf(args.searchString) == -1) {
    return false;
  }    
  return true;
},
showTable: function(){
  var self = this;
  $(".collapse-element").on('click', function(event){var elem = event.target; var id = $(elem).attr("data-target"); $("#"+id).collapse("toggle"); });

  //self.fillHeaders();
  self.dataView = new Slick.Data.DataView({ inlineFilters: true });


  var options = {
    editable: false,
    enableAddRow: false,
    enableCellNavigation: true,
    asyncEditorLoading: false,
    forceFitColumns: true,
    topPanelHeight: 25,
    multiColumnSort: true
  };
  $(".txtSearch."+self.div).keyup(function (e) {
      //Slick.GlobalEditorLock.cancelCurrentEdit();
      // clear on Esc
      if (e.which == 27) {
        this.value = "";
      }
      self.searchString = this.value;
      self.updateFilter();
      $(".numberOfSelected."+self.div).html(self.dataView.getLength()+" rows selected")
    });

  grid = new Slick.Grid(".grid."+self.div, self.dataView, self.columns, options);
        $('html, body').stop().animate({
                      scrollTop: $(".grid."+self.div).offset().top
                    }, 1000);

  self.dataView.onRowCountChanged.subscribe(function (e, args) {
    grid.updateRowCount();
    grid.render();
  });

  self.dataView.onRowsChanged.subscribe(function (e, args) {
    grid.invalidateRows(args.rows);
    grid.render();
  });

  grid.onSort.subscribe(function (e, args) {
    sortcol = args.sortCols[0].sortCol.field;
    self.dataView.sort(self.comparer, args.sortCols[0].sortAsc);
  });


  self.dataView.beginUpdate();
  self.dataView.setItems(self.data);
  self.dataView.setFilter(self.myFilter);
  self.dataView.setFilterArgs(0);
  self.dataView.endUpdate();
  $(".numberOfSelected."+self.div).html(self.dataView.getLength()+" rows selected")

//Map chart
$("#mapRun").on('click', function(){
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
  self.renderMap(config);
});


//Bar chart
$("#chartRun").on('click', function(){
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
  self.renderChart(config);
});
    
//Group operations
$("#runGroup").on('click', function(){
  var fields = [];
  $.each($(".group-variable"), function(i, item){
    fields.push($(item).find(":selected").val());
  });
  config = {
    dataset: $("#group-dataset").val(),
    operation: $("#group-operation option:selected").val(), 
    groupby: $("#grouped-by option:selected").val(),
    variable: fields
  };
  self.renderGroup(config);
});



  },
  renderGroup: function(config){
    var self = this;
    var groupby = config.groupby, variables = config.variable;
    self.obtainSelection();
    var i = datasetEditors.length;
    var countData = [], sumData = [];
    $.each(self.dataSelection.rows, function(i, item){
      if(item[groupby] != undefined){
        if(countData[item[groupby]] == undefined){
          countData[item[groupby]] = {};
        }


        if(sumData[item[groupby]] == undefined){
          sumData[item[groupby]] = {};
        }

        $.each(variables, function(i, variable){
          if(countData[item[groupby]][config.operation+"_"+variable] == undefined){
            countData[item[groupby]][config.operation+"_"+variable] = 1;
          }else{
            countData[item[groupby]][config.operation+"_"+variable]++;          
          }

          if(sumData[item[groupby]][config.operation+"_"+variable] == undefined){
            sumData[item[groupby]][config.operation+"_"+variable] = parseFloat(item[variable]);
          }else{
            sumData[item[groupby]][config.operation+"_"+variable] += parseFloat(item[variable]);
          }
        });
      }
    });
    var newData = [], groupedData = [];

    //What operation was asked?
    //TODO: Median!
    if(config.operation == "count"){
      groupedData = countData;
    }else if(config.operation == "sum"){
      groupedData = sumData;
    }else if(config.operation == "average"){
      for(i in sumData){
        for(j in sumData[i]){
          if(groupedData[i] == undefined){
            groupedData[i] = {};
          }
          groupedData[i][j] = sumData[i][j]/countData[i][j];
        }
      }
    }

    //Convert into slickgrid data structure
    var counter = 0;
    var newColumn = [], headerColumns = [{name: groupby, value: groupby}], columns = [{id: groupby, name: groupby, field: groupby, cssClass: "cell-title", sortable: true }]
    $.each(variables, function(i, variable){
      newColumn.push(config.operation+"_"+variable);
      headerColumns.push({name: config.operation+"_"+variable, value: config.operation+"_"+variable});
      columns.push({id: config.operation+"_"+variable, name: config.operation+"_"+variable, field: config.operation+"_"+variable, cssClass: "cell-title", sortable: true });
    });
    for(i in groupedData){
      var newItem = {};
      var item = groupedData[i];
      newItem["id"] = "id_"+counter;
      newItem[groupby] = i;
      $.each(groupedData[i], function(j, item){
        newItem[j] = item;
      });
      newData.push(newItem);
      counter++;
    }
    var c = {
      dataset: {
        groupby: groupby,
        operation: config.operation,
        variable: variables,
        dataset: self.dataset,
        filterby: [ {column: self.searchField, value: self.searchString} ]
      },
      editorId: i,
      div: "dataset"+i,
      columns: columns,
      headerColumns: headerColumns,
      data: newData
    }
    datasetEditors[i] = new Editor;
    datasetEditors[i].init(c);
    datasetEditors[i].showTable();
  },
  updateFilter: function() {
    var self = this;
    self.dataView.setFilterArgs({
      searchString: self.searchString,
      searchField: self.searchField
    });
    self.dataView.refresh();
  },

  comparer: function(a, b) {
    var self = this;
    var x = a[sortcol], y = b[sortcol];
    return (x == y ? 0 : (x > y ? 1 : -1));
  },
  obtainSelection: function(){
    var self = this;
    self.dataSelection.rows = [];
    for (var i = 0; i < self.dataView.getLength(); i++) {
      self.dataSelection.rows.push(self.dataView.getItem(i));
    }
  },
  renderMap: function(config){
    var self = this;
    if(config.sortcol != undefined){
      sortcol = config.sortcol;
    }
      if(config.manualdata == true){
        self.dataView.beginUpdate();
        if(config.filter.length > 0){
          arg = config.filter[0];
          self.dataView.setFilter(self.myFilter);
          self.dataView.setFilterArgs(arg);
        }
        self.dataView.sort(self.comparer, 1);
       self.dataView.endUpdate();
    }
    self.obtainSelection();
    $("#mapContainer").empty();
    $('<div id="map"></div>').prependTo("#mapContainer"); 
    if(!config.readonly){
      self.addMenu("map");
    }
    $("#map").css("width", config.width+"px").css("height", config.height+"px");
    var map = L.map('map').setView([0, 0], 13);
    L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
      maxZoom: 18,
      trackResize: true
    }).addTo(map);
    var north,south,east,west;
    var center = [0, 0];
    var validPoints = 0;
    var indexLat = config.params.lat, indexLong = config.params.lon;
    north = -100, south=100, east = -100, west = 100;
    $.each(self.dataSelection.rows, function(i, item){
      lat = parseFloat(item[indexLat]);
      lon = parseFloat(item[indexLong]);
      console.log(indexLat, indexLong, lat, lon, item);
      if(!isNaN(lat) && !isNaN(lon)){
        var m = L.marker([lat,lon]).addTo(map);       
        m.bindPopup(item[2]+"<br/>"+lat+", "+lon);
        validPoints++;
        center[0]+=lat;
        center[1]+=lon;
        south = Math.min(south, lat);
        north = Math.max(north, lat);
        east = Math.max(east, lon);
        west = Math.min(west, lon);
      }
    });
    if(validPoints > 0){
      //map.panTo([center[0]/validPoints, center[1]/validPoints]);
      map.fitBounds([[north, west], [south, east]]);
      $('html, body').stop().animate({
                      scrollTop: $('#map').offset().top
                    }, 1000);
        if(!config.readonly){
          //Metadata
          vizObj['map'] = {};
          vizObj['map'].type='MapVisualization';
          vizObj['map'].dataset=self.dataset;
          vizObj['map'].width=config.width;
          vizObj['map'].height=config.height;
          vizObj['map'].params={lat:$("#lat").val(), lon: $("#lon").val()};
          vizObj['map'].filters = [ {column: self.searchField, value: self.searchString} ];
          vizObj['map'].sortcol = sortcol;
        }
    }else{
        $("#error-message").html("<h4>Data Error</h4><p>The fields selected did not provide valid latitude and longitude coordinates.</p>");
        $("#error-dialog").modal('show');
        $("#mapDelete").trigger('click');
    }        
      
      self.runEvents();
    },
    renderChart: function(config){
      var self = this;
      if(config.sortcol != undefined){
        sortcol = config.sortcol;
      } 
      if(config.manualdata == true){
        self.dataView.beginUpdate();
        if(config.filter != undefined && config.filter.length > 0){
          arg = config.filter[0];
          self.dataView.setFilter(self.myFilter);
          self.dataView.setFilterArgs(arg);
        }
        self.dataView.sort(self.comparer, 1);
        self.dataView.endUpdate();
      }
      self.obtainSelection();
      $("#chartContainer").empty();
      $('<div id="chart" style="height:'+config.height+'px;width:'+config.width+'px;position:absolute;"></div>').prependTo("#chartContainer");
      if(!config.readonly){
        $('<div style="width:100%;height:100px;"></div>').prependTo("#chartContainer");
        self.addMenu("chart");
      }
      var dataObj = {}, d1 = [];
      var $var2 = config.params.var2, $var1 = config.params.var1;
      var options = {
        yaxis : {
            show : true,
            axisLabel : $var2,
            position: 'left',
        },
        xaxis : {
            show : true,
            axisLabel : $var1,
        },
        grid: {
            hoverable: true,
        }
      };
      var xCounter = 0;
      var ticks = [];
      $chart_type = config.chartType
      $.each(self.dataSelection.rows, function(i, item){
        var x = item[$var1], y = (item[$var2]);
        if(config.numericx){
          d1.push([xCounter, y]);
          ticks.push([xCounter++, x]);
        }else{
          d1.push([x, y]);
        }
      });

      if($chart_type == "ColumnChartVisualization"){
        dataObj = {
          data: d1,
          bars: { show: true }
        };
      }
      if($chart_type == "LineChartVisualization"){
        dataObj = {
          data: d1,
          lines: { show: true, fill: false }
        }
      }
      if($chart_type == "ScatterPlotVisualization"){
        dataObj = {
          data: d1,
          points: { show: true }
        }
      }
      if(config.numericx){
        options.xaxis.ticks = ticks;
      }
      
      var d1 = [];
      $.plot("#chart", [dataObj], options);
        $('html, body').stop().animate({
                      scrollTop: $('#chart').offset().top
                    }, 1000);
      if(!config.readonly){
        //Metadata
        vizObj['chart'] = {};
        vizObj['chart'].type=$chart_type;
        vizObj['chart'].dataset=self.dataset;
        vizObj['chart'].width=config.width;
        vizObj['chart'].height=config.height;
        vizObj['chart'].params={x: $var1, y: $var2};
        vizObj['chart'].filters = [ {column: self.searchField, value: self.searchString} ];
        vizObj['chart'].sortcol = sortcol;
        vizObj['chart'].numericx = config.numericx;
      }
      $("#chart").bind("plothover", function (event, pos, item) {
        var str = "(" + pos.x.toFixed(2) + ", " + pos.y.toFixed(2) + ")";
        if (item) {
          if (previousPoint != item.dataIndex) {

            previousPoint = item.dataIndex;

            $("#tooltip").remove();
            var x = item.datapoint[0].toFixed(2),
            y = item.datapoint[1].toFixed(2);

            self.showTooltip(item.pageX, item.pageY,
                "(" + x + ", " + y+")");
          }
        } else {
          $("#tooltip").remove();
          previousPoint = null;            
        }
    });
      self.runEvents();
    },
    showTooltip: function(x, y, contents) {
      $("<div id='tooltip'>" + contents + "</div>").css({
        position: "absolute",
        display: "none",
        top: y + 5,
        left: x + 5,
        border: "1px solid #fdd",
        padding: "2px",
        "background-color": "#fee",
        opacity: 0.80
      }).appendTo("body").fadeIn(200);
    },

    
    //auxiliary functions
    addMenu: function(id){
      $('<div class="buttonContainer btn-group menu-button"><button id="'+id+'Delete" class="optionsBtn btn btn-danger deleteButton">X</button><button data-edit="'+id+'-button"class="editButton optionsBtn btn btn-info">Edit</button><button data-chart="'+id+'" class="shareButton optionsBtn btn btn-success">Share</button></div>').prependTo("#"+id+"Container"); 
    },
    runEvents: function(){
      $(".chart-button").on('click', function(){
        $("#chart-dataset").val($(this).attr("data-dataset"));
      });
      $(".map-button").on('click', function(){
        $("#map-dataset").val($(this).attr("data-dataset"));
      });
      $(".deleteButton").on('click', function(){$(this).parent().parent().empty()});
      $(".editButton").on('click', function(){
        var modalId = "#"+$(this).attr("data-edit");
        $(modalId).trigger('click');
      });
      $(".shareButton").on('click', function(e){
        $("#confirmShare").attr("data-chart", $(this).attr("data-chart"));
        $("#title-dialog").modal('show');
      });      
    }
    
    
  }
}


