from flask import Flask
from flask import request
from flask import jsonify
import urllib2
import time
from Converter import Converter, ThreadPool
import traceback

tp = ThreadPool()
tp.startPool()
app = Flask(__name__)

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



if __name__ == "__main__":
    app.debug = True
    app.config['TRAP_BAD_REQUEST_ERRORS'] = True
    app.run()
