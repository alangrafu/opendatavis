
//Map chart
$("#runMap").on('click', function(){
  $("#map").remove();
  $('<div id="map"></div>').prependTo("#mapContainer"); 
  $("#map").css("width", $("#map-width").val()+"px").css("height", $("#map-height").val()+"px");
  var map = L.map('map').setView([0, 0], 13);
  L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
    maxZoom: 18,
    trackResize: true
  }).addTo(map);
  $.ajax({
    url:"/~alvarograves/gov/showDataset/"+dataset,
    contentType: "application/json",
    dataType: "json",
    success: function(data){
      console.log(data);
      var center = [0, 0];
      var validPoints = 0;
      var indexLat = $("#lat").val(), indexLong = $("#lon").val();
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
        console.log(center[0]/validPoints, center[1]/validPoints, center[0], validPoints);
        console.log(south, west, north, east);
        map.panTo([center[0]/validPoints, center[1]/validPoints]);
        
      });
    }
  });
});



//Bar chart
$("#runChart").on('click', function(){
  $.ajax({
    url:"/~alvarograves/gov/showDataset/{{lodspk.args.all}}",
    contentType: "application/json",
    dataType: "json",
    success: function(data){
      results = [{values: [], key: "test"}];
      $.each(data.rows, function(i, item){
        results[0]['values'].push({"label":item[$("#var1").val()], "value":parseFloat(item[$("#var2").val()])});
      });
      nv.addGraph(function() {
        var chart = nv.models.discreteBarChart()
        .x(function(d) { return d.label })
        .y(function(d) { return d.value })
        .staggerLabels(true)
        .tooltips(false)
        .showValues(true)

        d3.select('#test1').attr("height", 400).attr("width", 400)
        .datum(results)
        .transition().duration(500)
        .call(chart);

        nv.utils.windowResize(chart.update);

        return chart;
      });
    }
  });
});
