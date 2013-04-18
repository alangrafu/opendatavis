import threading
import csv
import sys, traceback
import requests
import urllib, urllib2
import time
import hashlib
import os.path

from rdflib.graph import Graph
from rdflib.term import URIRef, Literal, BNode
from rdflib.namespace import Namespace, RDF

class Converter(threading.Thread):
  def __init__(self, id, parent):
    self.version=20130218
    self.status="idle"
    self.filename=None
    self.url=None
    self.id=id
    self.baseUrl='http://opendatav.is'
    self.parent = parent
    super(Converter, self).__init__()

  def getVersion(self):
    return self.version

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
    self.status="downloading"
    self.parent and self.parent._setstatus(self.id, 'downloading')
    response = urllib2.urlopen(self.url)
    extension = self.url.split(".")[-1]
    if extension == self.url or "/" in self.url:
      extension = ""
    else:
      extension = "."+extension
    content = response.read()
    identifier = hashlib.md5(content).hexdigest()
    fileSize = len(content)
    self.filename=identifier+extension
    try:
      with open(self.filename) as f: pass
      #Nothing to do, file already exists
      self.status="idle"
      self.parent and self.parent._setstatus(self.id, 'idle')
      print "File already exists"
      return
    except IOError as e:
      print 'New file!'
    f=open("../data/"+self.filename, 'w')
    f.write(content)
    f.close()
    print "Converting"
    self.parent and self.parent._setstatus(self.id, 'converting')
    self.status="converting"
    f = open("../data/"+self.filename)
    try:
      dialect = csv.Sniffer().sniff(f.read(2048))
    except Exception:
      print "Can't snif dialect"
      self.parent._setstatus(self.id, False)
      exit(1)      
    f.seek(0)
    reader = csv.reader(f, dialect)
    datasetURI = str(URIRef('%s/dataset/%s'%(self.baseUrl, identifier)))
    distributionURI = str(URIRef('%s/distribution/%s'%(self.baseUrl, identifier)))
    downloadURI = str(URIRef('%s/data/%s'%(self.baseUrl, self.filename)))
    rowNumber=0
    ex_hasCell = u'ex:hasCell'
    ex_hasRecord = u'ex:hasRecord'
    ex_colNumber = u'ex:colNumber'
    ex_rowNumber = u'ex:rowNumber'
    ex_value = u'ex:value'

    buff=[]
    buff.append(u"@prefix ex: <%s/> .\n@prefix dcat: <http://www.w3.org/ns/dcat#> .\n"%self.baseUrl)
    try:
      header = reader.next()
      xbuff = u"<%s> a dcat:Dataset. "%(datasetURI)
      colNumber=0
      for value in header:
        try:
          valLiteral = Literal(unicode(value, 'utf-8'))
        except UnicodeDecodeError:
          try:
            print "No unicode value, trying latin"
            valLiteral = Literal(unicode(value, "ISO-8859-1"))
          except Exception:
            print "Not latin, I'll kill myself"
            self.parent._setstatus(self.id, False)
            exit(1)
        xbuff += u"""<%s> ex:header <%s/dataset/%s/header/%d> .
                     <%s/dataset/%s/header/%d> ex:value \"%s\"; 
                                                              ex:colNumber %d . """%(datasetURI, self.baseUrl, identifier, colNumber, self.baseUrl, identifier, colNumber, valLiteral, colNumber)
        colNumber = colNumber+1  
      buff.append(xbuff)                                                            
      for row in reader:
        colNumber=0
        recordURI = u'%s/dataset/%s/%d'%(self.baseUrl, identifier, rowNumber)
        for value in row:
          try:
            valLiteral = Literal(unicode(value, 'utf-8'))
          except UnicodeDecodeError:
            try:
              print "No unicode value, trying latin"
              valLiteral = Literal(unicode(value, "ISO-8859-1"))
            except Exception:
              print "Not latin, I'll kill myself"
              self.parent._setstatus(self.id, False)
              exit(1)
          currentURI = u'%s/dataset/%s/%d/%d'%(self.baseUrl, identifier, rowNumber, colNumber)
          xbuff = u"<%s> %s <%s> .\n"%(datasetURI, ex_hasRecord, recordURI) 
          xbuff += u"<%s> %s %d .\n"%(recordURI, ex_rowNumber, rowNumber) 
          xbuff += u"<%s> %s <%s> .\n"%(recordURI, ex_hasCell, currentURI) 
          xbuff += u"<%s> %s %d;\n"%(currentURI, ex_colNumber, colNumber) 
          xbuff += u"%s \"%s\".\n"%(ex_value, valLiteral) 
          buff.append(xbuff)
          colNumber = colNumber+1
        rowNumber = rowNumber+1
      print "Loading"
      self.parent and self.parent._setstatus(self.id, 'loading')
      headers = {'content-type': 'text/turtle; charset=utf-8'}
      turtle = u''.join(buff)
      self.status="loading"
      r = requests.post("http://localhost:3030/asd/data?graph=%s"%datasetURI, data=turtle.encode('utf-8'), headers=headers)
      print "Code:",r.status_code

      turtle = u"""@prefix ex: <%s/> .
@prefix dcterms: <http://purl.org/dc/terms/> .
@prefix xsd:     <http://www.w3.org/2001/XMLSchema#> .
@prefix prov: <http://www.w3.org/ns/prov#> .
@prefix dcat: <http://www.w3.org/ns/dcat#> .

<%s> a dcat:Dataset;
     dcterms:created "%s"^^xsd:dateTime;
     prov:wasDerivedFrom <%s> ;
     dcterms:identifier "%s";
     dcat:distribution <%s>.
<%s> a dcat:Distribution;
     dcat:downloadURL <%s> .
<%s> dcat:byteSize %d .
"""%(self.baseUrl, datasetURI, t, self.url, identifier, distributionURI, distributionURI, downloadURI, downloadURI, fileSize)
      r = requests.post("http://localhost:3030/asd/data?graph=%s/metadata"%self.baseUrl , data=turtle.encode('utf-8'), headers=headers)
      print "Code:",r.status_code
      self.status="idle"
      self.parent and self.parent._setstatus(self.id, 'idle')

    except UnicodeEncodeError, e:
      traceback.print_exc()
      exit(0)




class ThreadPool:
  def __init__(self):
    self.MAXTHREADS=5
    self.THREADS=[]
    self.THREADSTATUS=[]


  def _setstatus(self, id, status):
    if id >= 0 and id < self.MAXTHREADS:
      self.THREADSTATUS[id] = status
      if status == 'idle':
        self.THREADS[id] = None

  def startPool(self, numberOfThreads=None):
    if numberOfThreads == None:
      numberOfThreads = self.MAXTHREADS

    for i in xrange(numberOfThreads):
      self.THREADS.append(None)
      self.THREADSTATUS.append('idle')

  def addThread(self, filename=None, url=None):
    r = None
    print "Adding to pool %s %s"%(url, filename)
    if filename == None or url == None:
      return False
    for i in xrange(self.MAXTHREADS):
      if self.THREADSTATUS[i] == 'idle':
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
      return None
    if i >= 0 and i < self.MAXTHREADS:
      return self.THREADSTATUS[i]

    return False

