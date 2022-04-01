from flask import Flask, jsonify, request, render_template, Response
import json
import random

app = Flask(__name__)


@app.route('/')
def interactJS():
    return render_template('interactJS.html')


if __name__ == '__main__':
    app.run(host='0.0.0.0',port=random.randint(2000, 9000))
