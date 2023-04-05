from flask import Flask, render_template, request, jsonify, flash, get_flashed_messages
from database_handler import (database, bcrypt, input_words_from_file, get_random_word, dictionary_contains_word,
    get_leaderboard_entries, insert_word, is_valid_word)

app = Flask(__name__)
app.config["SECRET_KEY"] = "ae1fd77b66a507880a1bbd78180619d872128a6b3865c68a"
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///database.db"
database.init_app(app)
bcrypt.init_app(app)

WORD_LENGTH = 5

with app.app_context():
    database.create_all()
    input_words_from_file("dictionary.txt", "answers.txt")

# Functions for routing

@app.route("/")
def home():
    return render_template("index.html")


@app.route("/leaderboard")
def leaderboard():
    entries = get_leaderboard_entries()
    return render_template("leaderboard.html", leaderboard_entries=entries)


@app.route("/add_word", methods=["GET", "POST"])
def add_word():
    if request.method == "POST":
        word = request.form["word"]
        if is_valid_word(word, WORD_LENGTH):
            insert_word(word)
            flash("The word '%s' was added" % word, "word_added")
        else:
            flash("Please enter a valid word", "word_added")
    return render_template("add-word.html")


@app.route("/game")
def game():
    random_word = get_random_word()
    return render_template("game.html", secret_word=random_word)


@app.route("/game/random_word")
def random_secret_word():
    random_word = get_random_word()
    return jsonify({"word": random_word})


@app.route("/game/dictionary_check", methods=["POST"])
def dictionary_check():
    word = request.get_json()["word"]
    in_dictionary = dictionary_contains_word(word)
    return jsonify({"containsWord": in_dictionary})


if __name__ == '__main__':
    app.run(debug=True)
