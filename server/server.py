#!/usr/bin/python

from flask import Flask
from flask import request
from flask import jsonify
from rdflib import Graph, URIRef, Literal, BNode, Namespace, RDF, XSD, RDFS
import urllib2
import time
import datetime
import random
from Converter import Converter, ThreadPool
import traceback

tp = ThreadPool()
tp.startPool()
app = Flask(__name__)
#host = "http://opendatav.is"
host = "http://localhost/~alvarograves/opendatavis"

@app.route('/data', methods=['POST'])
def getData():
    error = None
    try:
        if request.form['url'] != None:
            ts = time.time()
            url=request.form['url']
            print "lets get this %s"% url
            filename = url.replace(":", "_colon_").replace("/", "_slash_")+str(ts)
            r = tp.addThread(filename, url)
            if r == None:
                return jsonify({"msg": "busy"}), 503
            return jsonify({"msg": r})

        else:
            error = 'Invalid URL'
        # the code below this is executed if the request method
        # was GET or the credentials were invalid
        return error, 404
    except:
        error = "error"
        print traceback.format_exc()
    return jsonify({"msg": "error"})


@app.route('/data', methods=['GET'])
def processLevel():
    ts = None
    ts = str(request.args.get('key'))
    r = tp.checkStatus(ts)
    if r != False:
        return jsonify(r)
    else:
        return jsonify({"msg": "error"}), 404



@app.route('/data/share', methods=['POST'])
def saveViz():
    if request.json:
        myData = request.json # will be
        vizIdentifier = str(int(time.time())) + str(random.randrange(1, 10000))
        fragment = "viz/%s" % (vizIdentifier )
        myurl="%s/%s" % (host, fragment)
        creationDate = datetime.datetime.fromtimestamp(time.time()).strftime('%Y-%m-%dT%H:%M:%S')
        store = Graph()
        VIZ = Namespace("http://opendatav.is/vocab/")
        DCTERMS = Namespace("http://purl.org/dc/terms/")
        PROV = Namespace("http://www.w3.org/ns/prov#")
        chartType = request.json.get("type");
        params = request.json.get("params")
        if not(params is None):
          print params
          for key in params:
            paramBNode = BNode()
            store.add((URIRef(myurl), VIZ["hasParameter"], paramBNode))
            store.add((paramBNode, VIZ["parameterValue"], Literal(params[key])))
            store.add((paramBNode, VIZ["parameterName"], Literal(key)))
        filters = request.json.get("filters")
        if not(filters is None):
            for myFilter in filters:
                print myFilter
                if "column"  in myFilter and "value" in myFilter:
                    blankFilter = BNode()
                    store.add((URIRef(myurl), VIZ["hasFilter"], blankFilter))
                    store.add((blankFilter, VIZ["filterColumn"], Literal(myFilter["column"])))
                    store.add((blankFilter, VIZ["filterValue"], Literal(myFilter["value"])))
        store.add((URIRef(myurl), RDF.type, VIZ[chartType]))
        if chartType != "MapVisualization":
          store.add((URIRef(myurl), RDF.type, VIZ["ChartVisualization"]))
        store.add((URIRef(myurl), RDF.type, VIZ["Visualization"]))
        store.add((URIRef(myurl), VIZ["hasWidth"], Literal(request.json.get("width"), datatype=XSD.nonNegativeInteger)))
        store.add((URIRef(myurl), VIZ["hasHeight"], Literal(request.json.get("height"), datatype=XSD.nonNegativeInteger)))
        if request.json.get("sortcol") != None:
          store.add((URIRef(myurl), VIZ["sortedBy"], Literal(request.json.get("sortcol"))))
        if isinstance(request.json.get("dataset"), basestring):
            store.add((URIRef(myurl), PROV["wasDerivedFrom"], URIRef(request.json.get("dataset"))))
        else:
            datasetDict = request.json.get("dataset")
            if "groupby" in datasetDict.keys():
                newDatasetURI = URIRef('%s/virtual/%s%s'%(host, str(int(time.time())), str(random.randrange(1, 99999999))))
                store.add((URIRef(myurl), PROV["wasDerivedFrom"], newDatasetURI))
                activityBNode = BNode()
                usageBNode = BNode()
                usageBNode2 = BNode()
                groupBNode = BNode()
                store.add((newDatasetURI, PROV["wasGeneratedBy"], activityBNode))
                store.add((newDatasetURI, RDF.type, VIZ["VirtualDataset"]))
                store.add((activityBNode, RDF.type, PROV["Activity"]))

                store.add((activityBNode, PROV["qualifiedUsage"], usageBNode))
                store.add((usageBNode, RDF.type, PROV["Usage"]))
                store.add((usageBNode, PROV["entity"], groupBNode))                
                store.add((usageBNode, PROV["hadRole"], VIZ["groupVariable"]))                     
                store.add((groupBNode, RDF.type, PROV["Entity"]))                
                store.add((groupBNode, RDF.type, RDFS.Literal))                
                store.add((groupBNode, RDF.value, Literal(datasetDict['groupby'])))                

                usageBNode4 = BNode()
                operationBNode = BNode()
                store.add((activityBNode, PROV["qualifiedUsage"], usageBNode4))
                store.add((usageBNode4, RDF.type, PROV["Usage"]))
                store.add((usageBNode4, PROV["entity"], operationBNode))                
                store.add((usageBNode4, PROV["hadRole"], VIZ["groupOperation"]))                     
                store.add((operationBNode, RDF.type, PROV["Entity"]))                
                store.add((operationBNode, RDF.type, RDFS.Literal))                
                store.add((operationBNode, RDF.value, Literal(datasetDict['operation'])))

                for variableName in datasetDict['variable']:
                    usageBNode3 = BNode()
                    varBNode = BNode()
                    store.add((activityBNode, PROV["qualifiedUsage"], usageBNode3))
                    store.add((usageBNode3, RDF.type, PROV["Usage"]))
                    store.add((usageBNode3, PROV["entity"], varBNode))                
                    store.add((usageBNode3, PROV["hadRole"], VIZ["variableGrouped"]))  

                    store.add((varBNode, RDF.type, PROV["Entity"]))                
                    store.add((varBNode, RDF.type, RDFS.Literal))                
                    store.add((varBNode, RDF.value, Literal(variableName)))                

                store.add((activityBNode, PROV["qualifiedUsage"], usageBNode2))
                store.add((usageBNode2, RDF.type, PROV["Usage"]))
                store.add((usageBNode2, PROV["entity"], URIRef(datasetDict['dataset'])))                
                store.add((usageBNode2, PROV["hadRole"], VIZ["datasetGrouped"]))  

                store.add((activityBNode, PROV["generated"], newDatasetURI))           
            elif "merge" in datasetDict.keys():
                newDatasetURI = URIRef('%s/virtual/%s%s'%(host, str(int(time.time())), str(random.randrange(1, 99999999))))
                store.add((URIRef(myurl), PROV["wasDerivedFrom"], newDatasetURI))
                arr = datasetDict['merge']
                activityBNode = BNode()
                store.add((newDatasetURI, PROV["wasGeneratedBy"], activityBNode))
                store.add((newDatasetURI, RDF.type, VIZ["VirtualDataset"]))
                store.add((activityBNode, RDF.type, PROV["Activity"]))
                for d in arr:
                    usageBNode = BNode()
                    mergeBNode = BNode()
                    store.add((activityBNode, PROV["qualifiedUsage"], usageBNode))
                    store.add((usageBNode, RDF.type, PROV["Usage"]))
                    store.add((usageBNode, VIZ["datasetMerged"], URIRef(d['dataset'])))
                    store.add((usageBNode, VIZ["fieldMerged"], Literal(d['field'])))                
                    store.add((usageBNode, PROV["hadRole"], VIZ["MergeDataset"]))
                    filters = d["filters"]
                    if not(filters is None):
                        for myFilter in filters:
                            print myFilter
                            if "column"  in myFilter and "value" in myFilter:
                                blankFilter = BNode()
                                print myFilter
                                store.add((usageBNode, VIZ["hasFilter"], blankFilter))
                                store.add((blankFilter, VIZ["filterColumn"], Literal(myFilter["column"])))
                                store.add((blankFilter, VIZ["filterValue"], Literal(myFilter["value"])))

            else:
                return jsonify(success=False)
        store.add((URIRef(myurl), DCTERMS["identifier"], Literal(vizIdentifier)))
        store.add((URIRef(myurl), DCTERMS["title"], Literal(request.json.get("title"))))
        store.add((URIRef(myurl), DCTERMS["created"], Literal(creationDate, datatype=XSD.dateTime)))
        store.add((URIRef(myurl), VIZ["numericXAxis"], Literal(request.json.get("numericx"), datatype=XSD.boolean)))
        rdfstring = store.serialize(format="turtle")
        print rdfstring
        opener = urllib2.build_opener(urllib2.HTTPHandler)
        r = urllib2.Request("http://localhost:3030/asd/data?graph=%s"%(myurl), data=rdfstring)
        r.add_header('Content-Type', 'text/turtle')
        r.get_method = lambda: 'PUT'
        url = opener.open(r)
        print url
        return jsonify(success=True, url=fragment)
    else:
        return jsonify(success=False)


if __name__ == "__main__":
    app.debug = True
    app.config['TRAP_BAD_REQUEST_ERRORS'] = True
    app.run()
