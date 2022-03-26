from flask import Flask, jsonify, request, render_template
import requests
import json
app = Flask(__name__)


@app.route('/')
def blockPrototype():  # put application's code here
    return render_template('blockPrototype.html')


@app.route('/interactJS')
def interactJS():
    return render_template('interactJS.html')

if __name__ == '__main__':
    app.run()
