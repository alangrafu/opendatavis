#!/usr/bin/python

from flask import Flask
from flask import request
from flask import jsonify
from rdflib import Graph, URIRef, Literal, BNode, Namespace, RDF, XSD
import urllib2
import time
import datetime
import random
from Converter import Converter, ThreadPool
import traceback

tp = ThreadPool()
tp.startPool()
app = Flask(__name__)
host = "http://opendatav.is"

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
                return "\n\n\nBusy!\n\n\n", 503
            return jsonify(id = r)

        else:
            error = 'Invalid URL'
        # the code below this is executed if the request method
        # was GET or the credentials were invalid
        return error, 404
    except:
        error = "error"
        print traceback.format_exc()
    return jsonify(msg2 = error)


@app.route('/data', methods=['GET'])
def processLevel():
    ts = None
    ts = str(request.args.get('key'))
    r = tp.checkStatus(ts)
    if r != False:
        return jsonify(msg = r)
    else:
        return jsonify(msg = "error"), 404



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
        chartType = request.json.get("type");
        params = request.json.get("params")
        if not(params is None):
          print params
          for key in params:
            paramBNode = BNode()
            store.add((URIRef(myurl), VIZ["hasParameter"], paramBNode))
            store.add((paramBNode, VIZ["parameterValue"], Literal(params[key])))
            store.add((paramBNode, VIZ["parameterName"], Literal(key)))

        store.add((URIRef(myurl), RDF.type, VIZ[chartType]))
        store.add((URIRef(myurl), DCTERMS["identifier"], Literal(vizIdentifier)))
        store.add((URIRef(myurl), DCTERMS["created"], Literal(creationDate, datatype=XSD.dateTime)))
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
