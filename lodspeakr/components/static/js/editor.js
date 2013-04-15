//Global varis
var vizObj = {},
dataView = new Slick.Data.DataView({ inlineFilters: true }),
searchString = "";


$(function () {   
    $.each(headerColumns, function(i, item){
        var option = "<option value='"+item+"'>"+item+"</option>";
        $("#lat").append(option);
        $("#lon").append(option);
        $("#var1").append(option);
        $("#var2").append(option);
    });
    $(".collapse-element").on('click', function(event){var elem = event.target; var id = $(elem).attr("data-target"); $("#"+id).collapse("toggle"); });
    
    var options = {
      editable: false,
      enableAddRow: false,
      enableCellNavigation: true,
      asyncEditorLoading: false,
      forceFitColumns: true,
      topPanelHeight: 25,
      multiColumnSort: true
    };
        
    
    function myFilter(item, args) {
      if(args.searchString != undefined && args.searchString != "" && item[firstField].indexOf(args.searchString) == -1) {
        return false;
      }    
      return true;
    }
    
    $("#txtSearch").keyup(function (e) {
        //Slick.GlobalEditorLock.cancelCurrentEdit();
        
        // clear on Esc
        if (e.which == 27) {
          this.value = "";
        }
        
        searchString = this.value;
        updateFilter();
    });
    
    
    function updateFilter() {
      dataView.setFilterArgs({
          searchString: searchString
      });
      dataView.refresh();
    }
    grid = new Slick.Grid("#myGrid", dataView, columns, options);
    
    dataView.onRowCountChanged.subscribe(function (e, args) {
        grid.updateRowCount();
        grid.render();
    });
    
    dataView.onRowsChanged.subscribe(function (e, args) {
        grid.invalidateRows(args.rows);
        grid.render();
    });
    
    var sortcol = "{{first.header.val.value|slugify}}";
    grid.onSort.subscribe(function (e, args) {
        sortcol = args.sortCols[0].sortCol.field;
        dataView.sort(comparer, args.sortCols[0].sortAsc);
    });
    
    function comparer(a, b) {
      var x = a[sortcol], y = b[sortcol];
      return (x == y ? 0 : (x > y ? 1 : -1));
    }
    
    dataView.beginUpdate();
    dataView.setItems(data);
    dataView.setFilter(myFilter);
    dataView.setFilterArgs(0);
    dataView.endUpdate();
    
    
    function obtainSelection(){
      dataSelection.rows = [];
      for (var i = 0; i < 10 && i < dataView.getLength(); i++) {
        dataSelection.rows.push(dataView.getItem(i));
      }
    }
    
    
    //Map chart
    $("#mapRun").on('click', function(){
        var config = {
          dataset: dataset,
          params: {
            lat: $("#lat").val(),
            lon: $("#lon").val()
          },
          height: $("#map-height").val(),
          width: $("#map-width").val(),
          readOnly: false
        }
        renderMap(config);
    });
    function renderMap(config){
      obtainSelection();
      $("#mapContainer").empty();
      $('<div id="map"></div>').prependTo("#mapContainer"); 
      if(!config.readonly){
        addMenu("map");
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
      console.log(dataSelection);
      $.each(dataSelection.rows, function(i, item){
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
        if(!config.readonly){
          //Metadata
          vizObj['map'] = {};
          vizObj['map'].type='MapVisualization';
          vizObj['map'].dataset=datasetUrl;
          vizObj['map'].width=config.width;
          vizObj['map'].height=config.height;
          vizObj['map'].params={lat:$("#lat").val(), lon: $("#lon").val()};
        }
      }else{
        $("#error-message").html("<h4>Data Error</h4><p>The fields selected did not provide valid latitude and longitude coordinates.</p>");
        $("#error-dialog").modal('show');
        $("#mapDelete").trigger('click');
      }        
      
      runEvents();
    }
    
    
    
    //Bar chart
    $("#chartRun").on('click', function(){
        config = {
          dataset: dataset,
          params: {
            lat: $("#lat").val(),
            lon: $("#lon").val()
          },
          height: $("#chart-height").val(),
          width: $("#chart-width").val(),
        readOnly: false                              };
        renderChart(config);
    });
    
    function renderChart(config){
      obtainSelection();
      $("#chartContainer").empty();
      $('<div style="width:100%;height:100px;"></div><div id="chart" style="height:'+config.height+'px;width:'+config.width+'px;position:absolute;"></div>').prependTo("#chartContainer");
      if(!config.readonly){
        addMenu("chart");
      }
      var dataObj = {}, d1 = [];
      var $var2 = $("#var2").val(), $var1 = $("#var1").val();
      $.each(dataSelection.rows, function(i, item){
          var x = item[$var1], y = parseFloat(item[$var2]);
          d1.push([x, y]);
      });
      $chart_type = $("#chart-type").val();
      
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
      if(!config.readonly){
        //Metadata
        vizObj['chart'] = {};
        vizObj['chart'].type=$chart_type;
        vizObj['chart'].dataset=datasetUrl;
        vizObj['chart'].params={x: $var1, y: $var2};
      }
      
      runEvents();
    }


    
    //auxiliary functions
    function addMenu(id){
      $('<div class="buttonContainer btn-group menu-button"><button id="'+id+'Delete" class="optionsBtn btn btn-danger deleteButton">X</button><button data-edit="'+id+'-button"class="editButton optionsBtn btn btn-info">Edit</button><button data-chart="'+id+'" class="shareButton optionsBtn btn btn-success">Share</button></div>').prependTo("#"+id+"Container"); 
    }
    
    function runEvents(){
      $(".deleteButton").on('click', function(){$(this).parent().parent().empty()});
      $(".editButton").on('click', function(){
          var modalId = "#"+$(this).attr("data-edit");
          $(modalId).trigger('click');
      });
      $(".shareButton").on('click', function(e){
          $("#confirmShare").attr("data-chart", $(this).attr("data-chart"));
          $("#title-dialog").modal('show');
      });
      
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
                    alert("NO funca :-()");
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
    }
    
    
});


