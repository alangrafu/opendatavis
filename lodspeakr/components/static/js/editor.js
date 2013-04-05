//Global varis
var vizObj = {};


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
  $.ajax({
    url:home+"showDataset/"+config.dataset,
    contentType: "application/json",
    dataType: "json",
    success: function(data){
      var north,south,east,west;
      var center = [0, 0];
      var validPoints = 0;
      var indexLat = config.params.lat, indexLong = config.params.lon;
      north = -100, south=100, east = -100, west = 100;
      $.each(data.rows, function(i, item){
        lat = parseFloat(item[indexLat]);
        lon = parseFloat(item[indexLong]);
        if(!isNaN(lat) && !isNaN(lon)){
          var m = L.marker([lat,lon]).addTo(map);       
          m.bindPopup(item[2]+"<br/>"+lat+", "+lon);
          validPoints++;
          center[0]+=lat;
          center[1]+=lon;
          console.log(south, lat);
          south = Math.min(south, lat);
          north = Math.max(north, lat);
          east = Math.max(east, lon);
          west = Math.min(west, lon);
          console.log([lat, lon], north, south, east, west);
        }
      });
      if(validPoints > 0){
        //map.panTo([center[0]/validPoints, center[1]/validPoints]);
        console.log([north, west], [south, east]);
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

    }
  });
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
  $("#chartContainer").empty();
  $('<div id="chart" style="height:'+config.height+'px;width:'+config.width+'px"></div>').prependTo("#chartContainer");
  if(!config.readonly){
    addMenu("chart");
  }
  $.ajax({
    url:home+"showDataset/"+config.dataset,
    contentType: "application/json",
    dataType: "json",
    success: function(data){      
      var dataObj = {}, d1 = [];
      var $var2 = $("#var2").val(), $var1 = $("#var1").val();
      $.each(data.rows, function(i, item){
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
    }
  });
  runEvents();
}


//auxiliary functions
function addMenu(id){
    $('<div class="buttonContainer btn-group btn-group-vertical"><button id="'+id+'Delete" class="optionsBtn btn btn-danger deleteButton">X</button><button data-edit="'+id+'-button"class="editButton optionsBtn btn btn-info">Edit</button><button data-chart="'+id+'" class="shareButton optionsBtn btn btn-success">Share</button></div>').prependTo("#"+id+"Container"); 
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
