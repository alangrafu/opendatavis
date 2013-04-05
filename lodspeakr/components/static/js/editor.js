//Global varis
var vizObj = {};


//Map chart
$("#mapRun").on('click', renderMap);
function renderMap(){
  $("#mapContainer").empty();
  $('<div id="map"></div>').prependTo("#mapContainer"); 
  addMenu("map");
  $("#map").css("width", $("#map-width").val()+"px").css("height", $("#map-height").val()+"px");
  var map = L.map('map').setView([0, 0], 13);
  L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
    maxZoom: 18,
    trackResize: true
  }).addTo(map);
  $.ajax({
    url:home+"showDataset/"+dataset,
    contentType: "application/json",
    dataType: "json",
    success: function(data){
      console.log(data);
      var center = [0, 0];
      var validPoints = 0;
      var indexLat = $("#lat").val(), indexLong = $("#lon").val();console.log(data.rows);
      $.each(data.rows, function(i, item){
        lat = parseFloat(item[indexLat]);
        lon = parseFloat(item[indexLong]);
        north = -100, south=100, east = -100, west = 100;
        if(!isNaN(lat) && !isNaN(lon)){
          var m = L.marker([lat,lon]).addTo(map);       
          m.bindPopup(item[2]+"<br/>"+lat+", "+lon);
          validPoints++;
          console.log(lat,lon, validPoints);
          center[0]+=lat;
          center[1]+=lon;
          south = Math.min(south, lat);
          north = Math.max(north, lat);
          east = Math.max(east, lon);
          west = Math.min(west, lon);
        }
        if(validPoints > 0){
        map.panTo([center[0]/validPoints, center[1]/validPoints]);
        vizObj['map'] = {};
        vizObj['map'].type='MapVisualization';
        vizObj['map'].dataset=datasetUrl;
        vizObj['map'].params={lat:$("#lat").val(), lon: $("#lon").val()};

        }else{
          $("#error-message").html("<h4>Data Error</h4><p>The fields selected did not provide valid latitude and longitude coordinates.</p>");
          $("#error-dialog").modal('show');
          $("#mapDelete").trigger('click');
        }        
      });
    }
  });
  runEvents();
}



//Bar chart
$("#chartRun").on('click', function(){
  $("#chartContainer").empty();
  $('<div id="chart" style="height:400px;width:500px"></div>').prependTo("#chartContainer");   
  addMenu("chart");
  $.ajax({
    url:home+"showDataset/"+dataset,
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
      //Metadata
      vizObj['chart'] = {};
      vizObj['chart'].type=$chart_type;
      vizObj['chart'].dataset=datasetUrl;
      vizObj['chart'].params={x: $var1, y: $var2};
    }
  });
  runEvents();
});


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
                                      var id = $(this).attr("data-chart");
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
                                            }
                                        });
                                      }else{
                                        $("#share-link").attr("href", vizObj[id].url).html(vizObj[id].url);
                                        $("#share-dialog").modal('show');
                                      }
  });
}
