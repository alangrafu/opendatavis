<script src="http://d3js.org/d3.v2.js?2.9.1"></script>
<script>

// http://blog.thomsonreuters.com/index.php/mobile-patent-suits-graphic-of-the-day/


var nodes = {};

// Compute the distinct nodes from the links.
links.forEach(function(link) {
  link.source = nodes[link.source] || (nodes[link.source] = {name: link.source});
  link.target = nodes[link.target] || (nodes[link.target] = {name: link.target});
});

var width = 350,
    height = 400;

var force = d3.layout.force()
    .nodes(d3.values(nodes))
    .links(links)
    .size([width, height])
    .linkDistance(60)
    .charge(-300)
    .on("tick", tick)
    .start();
d3.select("#metadata").append("hr");
var svg = d3.select("#metadata").append("svg")
    .attr("width", width)
    .attr("height", height);

svg.append("svg:marker")
    .attr("id", "Triangle")
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 15)
    .attr("refY", -1.5)
    .attr("markerWidth", 6)
    .attr("markerHeight", 6)
    .attr("orient", "auto")
  .append("svg:path")
    .attr("d", "M0,-5L10,0L0,5");

var link = svg.selectAll(".link")
    .data(force.links())
  .enter().append("line")
    .attr("class", "link").attr("marker-end", function(d) { return "url(#Triangle)"; });

var node = svg.selectAll(".node")
    .data(force.nodes())
  .enter().append("g")
    .attr("class", "node")
    .attr("data-url", function(d){return d.name})
    .on("mouseover", mouseover)
    .on("mouseout", mouseout)
    .on("click", clickNode)
    .call(force.drag);

node.append("circle")
    .attr("r", 8);
 node.append("image")
      .attr("svg:xlink:href", "https://github.com/favicon.ico")
      .attr("x", -8)
      .attr("y", -8)
      .attr("width", 16)
      .attr("height", 16);
node.append("text")
    .attr("x", 12)
    .attr("dy", ".35em")
    .text(function(d) { return d.name; });

function tick() {
  link
      .attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; });

  node
      .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
}

function mouseover() {
  d3.select(this).select("circle").transition()
      .duration(250)
      .attr("r", 16);
}

function mouseout() {
  d3.select(this).select("circle").transition()
      .duration(250)
      .attr("r", 8);
}

function clickNode(){
  window.location= d3.select(this).attr("data-url");
}

</script>
