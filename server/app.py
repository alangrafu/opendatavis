from flask import Flask
from flask import request
import urllib2
import time
from Converter import Converter, ThreadPool

tp = ThreadPool()
tp.startPool()
app = Flask(__name__)

@app.route('/data', methods=['POST'])
def getData():
    error = None
    if request.form['url'] != None:
        ts = time.time()
        url=request.form['url']
        filename = url.replace(":", "_colon_").replace("/", "_slash_")+str(ts)
        r = tp.addThread(filename, url)
        if r == None:
            return "\n\n\nBusy!\n\n\n", 503
        return "%s\n\n"%str(r)

    else:
        error = 'Invalid URL'
        # the code below this is executed if the request method
        # was GET or the credentials were invalid
        return error, 404


@app.route('/data', methods=['GET'])
def processLevel():
    ts = None
    ts = str(request.args.get('key'))
    r = tp.checkStatus(ts)
    if r != False:
        return r
    else:
        return "Invalid key", 404



if __name__ == "__main__":
    app.debug = True
    app.run()
