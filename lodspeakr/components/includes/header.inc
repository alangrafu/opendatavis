<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>OpenDataVis</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="">
  <meta name="author" content="">
  <link href="{{lodspk.home}}css/bootstrap.css" rel="stylesheet" type="text/css" media="screen" />
  <link href="{{lodspk.home}}css/bootstrap-responsive.css" rel="stylesheet" type="text/css" media="screen" />
  <link href="{{lodspk.home}}css/basic.css" rel="stylesheet" type="text/css" media="screen" />
  <link rel="stylesheet" href="http://cdn.leafletjs.com/leaflet-0.5/leaflet.css" />
  <link rel="stylesheet" href="{{lodspk.home}}css/slick.grid.css"/>
  <link rel="stylesheet" href="{{lodspk.home}}css/slick.columnpicker.css"/>
  <link rel="stylesheet" href="{{lodspk.home}}css/jquery-ui-1.8.16.custom.css"/>
  <link rel="stylesheet" href="http://mleibman.github.io/SlickGrid/controls/slick.columnpicker.css"/>
  <link rel="alternate" type="application/rdf+xml" title="RDF/XML Version" href="{{lodspk.local.value}}.rdf" />
  <link rel="alternate" type="text/turtle" title="Turtle Version" href="{{lodspk.local.value}}.ttl" />
  <link rel="alternate" type="text/plain" title="N-Triples Version" href="{{lodspk.local.value}}.nt" />
  <link rel="alternate" type="application/json" title="RDFJSON Version" href="{{lodspk.local.value}}.json" />
  <!--[if lte IE 8]>
     <link rel="stylesheet" href="http://cdn.leafletjs.com/leaflet-0.5/leaflet.ie.css" />
     <![endif]-->
     <style>
     body {
      padding-top: 60px; /* 60px to make the container go all the way to the bottom of the topbar */
    }
    td{ font-size: 10px;}
    .wait{
      background-image:url('{{lodspk.home}}img/wait.gif');
      background-repeat:no-repeat;
      padding-right:20px;
      background-position: right;
    }
    .cell-title {
      font-weight: bold;
    }

    .cell-effort-driven {
      text-align: center;
    }

    .cell-selection {
      border-right-color: silver;
      border-right-style: solid;
      background: #f5f5f5;
      color: gray;
      text-align: right;
      font-size: 10px;
    }

    .slick-row.selected .cell-selection {
      background-color: transparent; /* show default selected row background */
    }
    </style>
    <script type="text/javascript" src="{{lodspk.home}}js/jquery.js"></script>
    <script type="text/javascript" src="{{lodspk.home}}js/jquery-ui-1.8.16.custom.min.js"></script>
    <script type="text/javascript" src="{{lodspk.home}}js/jquery.event.drag-2.0.min.js"></script>
    <script type="text/javascript" src="{{lodspk.home}}js/slick.formatters.js"></script>
    <script type="text/javascript" src="{{lodspk.home}}js/bootstrap.min.js"></script>
    <script type="text/javascript" src="{{lodspk.home}}js/bootstrap-typeahead.js"></script>
    <script src="http://cdn.leafletjs.com/leaflet-0.5/leaflet.js"></script>
    <script src="http://mleibman.github.io/SlickGrid/plugins/slick.rowselectionmodel.js"></script>
    <script src="http://mleibman.github.io/SlickGrid/controls/slick.columnpicker.js"></script>
    <script src="{{lodspk.home}}js/slick.core.js"></script>
    <script src="{{lodspk.home}}js/slick.dataview.js"></script>
    <script src="{{lodspk.home}}js/slick.formatters.js"></script>
    <script src="{{lodspk.home}}js/slick.grid.js"></script>
    <script type="text/javascript">
    $(document).ready(function(){
      $('.typeahead').typeahead({
        source: function (typeahead, query) {
          $('.typeahead').addClass('wait');[]
          return $.get('{{lodspk.home}}search/'+encodeURIComponent(query), { }, function (data) {
            $('.typeahead').removeClass('wait');[]
            return typeahead.process(data);
          }, 'json');
        },
        onselect: function (obj) {
          $('.typeahead').attr('disabled', true);
          window.location = obj.uri;
        }
      });
    });
    </script>
  </head>
  <body>
   <script>
   var home = "{{lodspk.home}}";
   </script>
   <div class="navbar navbar-fixed-top">
    <div class="navbar-inner">
      <div class="container">
        <a class="btn btn-navbar" data-toggle="collapse" data-target=".nav-collapse">
          <span class="icon-bar"></span>
          <span class="icon-bar"></span>
          <span class="icon-bar"></span>
        </a>
        <a class="brand" href="{{lodspk.home}}">{{lodspk.title}}</a>
        <div class="nav-collapse">
          <ul class="nav">
            <li><a href="{{lodspk.home}}">Home</a></li>
            <li><a href="{{lodspk.home}}datasets">Datasets</a></li>
            <li><a href="{{lodspk.home}}visualizations">Visualizations</a></li>
          </ul>
          <form class="navbar-search pull-left" action="#">
            <input type="text" data-provide="typeahead" class="typeahead search-query span2" placeholder="Search"/>
          </form>
        </div><!--/.nav-collapse -->
      </div>
    </div>
   </div>

