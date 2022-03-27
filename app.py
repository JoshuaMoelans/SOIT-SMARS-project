from flask import Flask, jsonify, request, render_template
import requests
import json

app = Flask(__name__)


@app.route('/')
def interactJS():
    return render_template('interactJS.html')


if __name__ == '__main__':
    app.run()
