//Global varis
var vizObj = {};
var sortcol = null;
var datasetNumber = 1;

var Editor = {
  dataSelection: {rows: []},
  div: null,
  searchString: "",
  sortcol: null,
  dataView: null,
  dataset: null,
  init: function(config){
    var self = this;
    if(config != undefined && config.sortcol != undefined){
      self.sortcol = config.sortcol;
    }
    self.div = config.div;
    self.dataset = config.dataset;
    $("#main").append('<div class="row dataset0"><div class="span12 dataset0 datasetCell"></div></div>');
    $cell = $(".dataset0 .datasetCell");
    $cell.append('<h5 class="numberOfSelected dataset0"></h5>');
    $cell.append('<div style="width:100%;min-height:300px;max-height:500px;" class="span5 grid dataset0"></div>');
    $cell.append('<div class="btn-group"><button class="btn btn-large btn-info chart-button" data-dataset="'+config.dataset+'" data-toggle="modal" data-target="#chart-dialog">Chart</button><button class="btn btn-large btn-info map-button" data-dataset="'+config.dataset+'" data-toggle="modal" data-target="#map-dialog">Map</button><button class="btn btn-large btn-info" id="dataset-button" data-toggle="modal" data-target="#dataset-dialog">New dataset</button></div>');
    $cell.append('<select class="fieldSearch dataset0"></select>');
    $cell.append('<input type="text" class="dataset0 txtSearch" />');
    $("#main").append('<div class="span12"><div id="mapContainer" class="vizContainer"></div><div id="chartContainer" class="vizContainer"></div></div>');
    $("#confirmShare").on('click', function(){
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

    $("#confirmLoad").on('click', function(){
      var loadDataset = $("#dataset-list option:selected").val();
      alert(loadDataset);
    })
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
  $.each(headerColumns, function(i, item){
    option += "<option value='"+item.value+"'>"+item.name+"</option>";
  });
  $("#lat").append(option);
  $("#lon").append(option);
  $("#var1").append(option);
  $("#var2").append(option);
  console.log($(".fieldSearch."+self.div).length, self.div);
  $(".fieldSearch."+self.div).append(option).on('change', function(){
    searchField = $(".fieldSearch."+self.div+" option:selected").val();
  });
},
myFilter: function(item, args) {
  self = this;
  if(args.searchString != undefined && args.searchString != "" && item[searchField].indexOf(args.searchString) == -1) {
    return false;
  }    
  return true;
},
showTable: function(){
  var self = this;
  $(".collapse-element").on('click', function(event){var elem = event.target; var id = $(elem).attr("data-target"); $("#"+id).collapse("toggle"); });

  self.fillHeaders();
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
      console.log($(".numberOfSelected."+self.div));
      $(".numberOfSelected."+self.div).html(self.dataView.getLength()+" rows selected")
    });

  grid = new Slick.Grid(".grid."+self.div, self.dataView, columns, options);

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
  self.dataView.setItems(data);
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
        readOnly: false
      };
      self.renderChart(config);
    });
    


  },
  updateFilter: function() {
    var self = this;
    self.dataView.setFilterArgs({
      searchString: self.searchString
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
          vizObj['map'].filters = [ {column: $(".fieldSearch."+self.div+" option:selected").val(), value: $("#txtSearch").val()} ];
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
        if(config.filter.length > 0){
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

      $.each(self.dataSelection.rows, function(i, item){
        var x = item[$var1], y = (item[$var2]);
        d1.push([x, y]);
      });
      $chart_type = config.chartType
      
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
      
      var d1 = [];
      $.plot("#chart", [dataObj]);
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
        vizObj['chart'].filters = [ {column: $("#fieldSearch option:selected").val(), value: $("#txtSearch").val()} ];
        vizObj['chart'].sortcol = sortcol;
        console.log(vizObj['chart']);
      }
      
      self.runEvents();
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


