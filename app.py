from flask import Flask, jsonify, request, render_template, Response
import json
import random

app = Flask(__name__)


@app.route('/')
def interactJS():
    return render_template('interactJS.html')


# TODO add network information to file output dynamically
# labels: back-end
@app.route("/getCodeOutput", methods=['POST'])
def getCodeOutput():
    jsdata = request.form['javascript_data']
    pyFile = f'if __name__ == \'__main__\': \n\tprint(\'{jsdata}\')'
    return Response(
        pyFile,
        mimetype="text/plain",
        headers={"Content-Type": "application/octet-stream", "Content-disposition": "attachment; filename=myCode.py"})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=random.randint(2000, 9000))
