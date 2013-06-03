import threading
import csv
import sys, traceback
import requests
import urllib, urllib2
import time
import hashlib
import os.path
import json
from SPARQLWrapper import SPARQLWrapper, JSON

from rdflib.graph import Graph
from rdflib.term import URIRef, Literal, BNode
from rdflib.namespace import Namespace, RDF

class Converter(threading.Thread):
  def __init__(self, id, parent):
    self.version=20130218
    self.status={"msg": "idle"}
    self.filename=None
    self.url=None
    self.id=id
    self.sparqlUpdateURL="http://localhost:3030/asd/data"
    self.sparqlURL="http://localhost:3030/asd/query"
    #self.baseUrl='http://opendatav.is'
    self.baseUrl="http://localhost/~alvarograves/opendatavis"
    self.parent = parent
    super(Converter, self).__init__()

  def getVersion(self):
    return self.version

  def getLiteral(self, value):
    valLiteral = None
    try:
      valLiteral = unicode(value, 'utf-8')
    except UnicodeDecodeError:
      try:
        print "No unicode value, trying latin"
        valLiteral = unicode(value, "ISO-8859-1")
      except Exception:
        print "Not latin, I'll kill myself"
        self.parent._setstatus(self.id, {"msg": False})
        exit(1)
    return valLiteral

  def setStatus(self, status):
    self.status=status

  def getStatus(self):
    return self.status

  def setFilename(self, filename):
    self.filename=filename

  def setUrl(self, url):
    self.url=url

  def run(self):
    t = time.strftime("%Y-%m-%dT%H:%M:%S", time.localtime())
    print "Downloading"
    self.status={"msg": "downloading"}
    self.parent and self.parent._setstatus(self.id, {"msg":'downloading'})
    response = urllib2.urlopen(self.url)
    extension = self.url.split(".")[-1]
    if extension == self.url or "/" in self.url:
      extension = ""
    else:
      extension = "."+extension
    content = response.read()
    identifier = hashlib.md5(content).hexdigest()
    sparql = SPARQLWrapper(self.sparqlURL)
    sparql.setQuery("""
    PREFIX dcterms: <http://purl.org/dc/terms/>
    PREFIX dcat: <http://www.w3.org/ns/dcat#>

    SELECT ?dataset
    WHERE { graph ?g{ ?dataset a dcat:Dataset; dcterms:identifier "%s"}}
"""%identifier)
    sparql.setReturnFormat(JSON)
    results = sparql.query().convert()

    if len(results["results"]["bindings"]) > 0:
      print "It already exists"
      datasetURI = results["results"]["bindings"][0]["dataset"]["value"]
      self.status={"msg": "done", "url": datasetURI, "timestamp": int(time.strftime("%s", time.localtime()))}
      self.parent and self.parent._setstatus(self.id, {"msg": "done", "url": datasetURI, "timestamp": int(time.strftime("%s", time.localtime()))})
      exit(0)
    fileSize = len(content)
    self.filename=identifier+extension
    try:
      with open(self.filename) as f: pass
      #Nothing to do, file already exists
      self.status={"msg": "idle"}
      self.parent and self.parent._setstatus(self.id, {"msg": 'idle'})
      print "File already exists"
      return
    except IOError as e:
      print 'New file!'
    f=open("../original/"+self.filename, 'w')
    f.write(content)
    f.close()
    datasetURI = str(URIRef('%s/dataset/%s'%(self.baseUrl, identifier)))
    distributionURI = str(URIRef('%s/distribution/%s'%(self.baseUrl, identifier)))
    downloadURI = str(URIRef('%s/original/%s'%(self.baseUrl, self.filename)))
    jsonDistributionURI = str(URIRef('%s/distributionJson/%s'%(self.baseUrl, self.filename)))
    jsonURI = str(URIRef('%s/data/%s'%(self.baseUrl, self.filename)))
    f = open("../original/"+self.filename)
    try:
      dialect = csv.Sniffer().sniff(f.read(2048))
    except Exception:
      print "Can't sniff dialect"
      self.parent._setstatus(self.id, {"msg":False})
      exit(1)      
    f.seek(0)
    reader = csv.reader(f, dialect)
    headers = reader.next()

    #Creating JSON object
    try:
      jsonData = { 'header': [], 'rows': [], 'title': self.url.split("/").pop().replace(".", "_"), 'source': self.url}
      #Define headers
      for value in headers:
        myVal = self.getLiteral(value)
        headerValue = {"value": myVal, "name": myVal}
        jsonData['header'].append(headerValue)

      #Define rows
      rowNumber = 0
      print jsonData['header']
      for row in reader:
        colNumber=0
        currentRow = {}
        currentRow['id'] = "_id"+str(rowNumber)
        for value in row:
          try:
            thisValue = self.getLiteral(value)
            headerValue = jsonData['header'][colNumber]
            currentRow[headerValue['value']] = thisValue
            colNumber = colNumber + 1
          except IndexError:
            print "Index error on column %d" % rowNumber
            print row
        jsonData['rows'].append(currentRow)
        rowNumber = rowNumber+1
      print "Loading"
      self.parent and self.parent._setstatus(self.id, {"msg":'loading'})
      self.status={"msg": "loading"}
      with open('../data/'+self.filename, 'w') as outfile:
        json.dump(jsonData, outfile)
      turtle = u"""@prefix ex: <%s/> .
@prefix dcterms: <http://purl.org/dc/terms/> .
@prefix xsd:     <http://www.w3.org/2001/XMLSchema#> .
@prefix prov: <http://www.w3.org/ns/prov#> .
@prefix dcat: <http://www.w3.org/ns/dcat#> .
""" % self.baseUrl

      turtle = turtle + """<%s> a dcat:Dataset;
     dcterms:created "%s"^^xsd:dateTime;
     prov:wasDerivedFrom <%s> ;
     dcterms:identifier "%s";
     dcat:distribution <%s>, <%s>. """ %( datasetURI, t, self.url, identifier, distributionURI, jsonDistributionURI)

      turtle = turtle + """<%s> a dcat:Distribution;
     dcat:mediaType 'text/csv';
     dcat:downloadURL <%s> .
<%s> dcat:byteSize %d .
<%s> a dcat:Distribution;
     dcat:mediaType 'application/json';
     dcat:downloadURL <%s> .
""" %(distributionURI, downloadURI, downloadURI, fileSize, jsonDistributionURI, jsonURI)
      httpHeaders = {}
      httpHeaders['content-type'] = "text/turtle; charset=utf8"
      r = requests.post("%s?graph=%s/metadata"%(self.sparqlUpdateURL, self.baseUrl) , data=turtle.encode('utf-8'), headers=httpHeaders)
      print "Code:",r.status_code
      self.status={"msg": "done", "url": datasetURI, "timestamp": int(time.strftime("%s", time.localtime()))}
      self.parent and self.parent._setstatus(self.id, {"msg": "done", "url": datasetURI, "timestamp": int(time.strftime("%s", time.localtime()))})

    except UnicodeEncodeError, e:
      traceback.print_exc()
      exit(0)
    except:
      traceback.print_exc()
      self.parent._setstatus(self.id, {"msg":False})
      exit(0)




class ThreadPool:
  def __init__(self):
    self.MAXTHREADS=5
    self.THREADS=[]
    self.THREADSTATUS=[]
    self.restTimeForThread = 10


  def _setstatus(self, id, status):
    if id >= 0 and id < self.MAXTHREADS:
      self.THREADSTATUS[id] = status
      if status["msg"] == 'done':
        self.THREADS[id] = None

  def startPool(self, numberOfThreads=None):
    if numberOfThreads == None:
      numberOfThreads = self.MAXTHREADS

    for i in xrange(numberOfThreads):
      self.THREADS.append(None)
      self.THREADSTATUS.append({"msg": "idle"})

  def addThread(self, filename=None, url=None):
    r = None
    print "Adding to pool %s %s"%(url, filename)
    print self.THREADSTATUS
    if filename == None or url == None:
      return False
    for i in xrange(self.MAXTHREADS):
      if self.THREADSTATUS[i]["msg"] == 'done':
        if self.THREADSTATUS[i]["timestamp"] + self.restTimeForThread < int(time.strftime("%s", time.localtime())):
          print "rest time for thread %d is over, switching to idle state"%i
          self.THREADSTATUS[i]["msg"] = 'idle'
      if self.THREADSTATUS[i]["msg"] == 'idle':
        self.THREADS[i] = Converter(i, self)
        self.THREADS[i].setFilename(filename)
        self.THREADS[i].setUrl(url)
        self.THREADS[i].start()
        print "Starting thread %d"% i
        r = i
        break
    return r

  def checkStatus(self, id):
    try:
      i = int(id)
    except Exception, e:
      return {"msg": False}
    if i >= 0 and i < self.MAXTHREADS:
      return self.THREADSTATUS[i]

    return {"msg": False}

