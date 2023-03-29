from flask import Flask, render_template

app = Flask(__name__)


@app.route("/")
def home():
    return render_template("index.html")

@app.route("/leaderboard")
def leaderboard():
    return render_template("leaderboard.html")

@app.route("/add_word")
def add_word():
    return render_template("add-word.html")

@app.route("/game")
def game():
    return render_template("game.html")

if __name__ == '__main__':
    app.run()
