import random

from flask import Flask, render_template

app = Flask(__name__)

@app.route('/')
def interactJS():
    return render_template('interactJS.html')


@app.route('/demo')
def demo():
    return render_template('demo.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=random.randint(2000, 9000), debug=True)
