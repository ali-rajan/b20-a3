from flask import Flask, render_template, request, jsonify
from database_handler import *

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///words.db"
database.init_app(app)

with app.app_context():
    database.create_all()
    input_words_from_file("dictionary.txt", "answers.txt")

# Functions for routing

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
    random_word = get_random_word()
    return render_template("game.html", secret_word=random_word)


@app.route("/random_word")
def random_secret_word():
    random_word = get_random_word()
    return jsonify({"word": random_word})


@app.route("/dictionary_check", methods=["POST"])
def dictionary_check():
    word = request.get_json()["word"]
    in_dictionary = dictionary_contains_word(word)
    return jsonify({"containsWord": in_dictionary})


if __name__ == '__main__':
    app.run(debug=True)
