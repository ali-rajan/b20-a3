from flask import Flask, render_template, request, jsonify, flash, redirect, url_for, session, get_flashed_messages
from database_handler import (database, bcrypt, input_words_from_file, is_valid_account_info, insert_player,
                              validate_login, USER_NOT_FOUND, INCORRECT_PASSWORD, get_random_word, get_username,
                              dictionary_contains_word, insert_leaderboard_entry, get_leaderboard_entries, insert_word,
                              is_valid_word)

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
    """Render the homepage.
    """

    return render_template("index.html")


@app.route("/register", methods=["POST"])
def register():
    """Handle the player account creation.
    """

    username = request.form["username"]
    password = request.form["password"]
    if is_valid_account_info(username, password):
        password_hash = bcrypt.generate_password_hash(password).decode("UTF-8")
        insert_player(username, password_hash)
        flash("User created successfully", "user_register")
    else:
        flash("Please enter a valid password and username that is not taken. Only use alphanumeric characters",
            "user_register")
    return render_template("index.html")


@app.route("/login", methods=["POST"])
def login():
    """Handle the player login.
    """

    username = request.form["username"]
    password = request.form["password"]
    result = validate_login(username, password)
    if result == USER_NOT_FOUND:
        flash("User not found", "login")
    elif result == INCORRECT_PASSWORD:
        flash("Incorrect password", "login")
    else:
        session["user"] = result
        flash("Welcome, %s!" % username, "login")
    return render_template("index.html")


@app.route("/logout")
def logout():
    """Handle the player logout.
    """

    session.pop("user", None)
    flash("Logged out", "login")
    return render_template("index.html")


@app.route("/game")
def game():
    """Handle the game startup based on whether the user is logged in.
    """

    user_id = session.get("user")
    if user_id:     # The user is logged in
        username = get_username(user_id)
        return render_template("game.html", username_text=username)
    else:
        flash("Please log in to play", "start_game")
        return render_template("index.html")


@app.route("/game/random_word")
def get_secret_word():
    """Return a random word from the Word table in the JSON format.
    """

    random_word = get_random_word()
    return jsonify({"word": random_word})


@app.route("/game/dictionary_check", methods=["POST"])
def dictionary_check():
    """Return whether the word posted in the request is in the DictionaryWord table. The returned value is in the JSON
    format.
    """

    word = request.get_json()["word"]
    in_dictionary = dictionary_contains_word(word)
    return jsonify({"containsWord": in_dictionary})


@app.route("/game/leaderboard_entry", methods=["POST"])
def add_leaderboard_entry():
    """Insert a new entry into the Leaderboard table with the attributes posted in the request.
    """

    # Get the leaderboard entry's attributes
    game_statistics = request.get_json()
    time = game_statistics["time"]
    guesses = game_statistics["guesses"]
    score = compute_score(time, guesses)
    time_string = game_statistics["timeString"]

    insert_leaderboard_entry(session["user"], score, time_string, guesses)

    return redirect(url_for("leaderboard"))


@app.route("/leaderboard")
def leaderboard():
    """Render the leaderboard page.
    """

    entries = get_leaderboard_entries()
    return render_template("leaderboard.html", leaderboard_entries=entries)


@app.template_filter()
def username_filter(player_id: int):
    return get_username(player_id)

@app.template_filter()
def player_id_filter(player_id: int):
    formatted_str = "%09d" % player_id
    spaced_str = formatted_str[:3] + " " + formatted_str[3: 6] + " " + formatted_str[6: 9]
    return spaced_str


@app.route("/add_word", methods=["GET", "POST"])
def add_word():
    """Handle the "Add Word" page and the insertion of a new word posted in any requests on the page.
    """

    if request.method == "POST":
        word = request.form["word"]
        if is_valid_word(word, WORD_LENGTH):
            insert_word(word)
            flash("The word '%s' was added" % word, "word_added")
        else:
            flash("Please enter a valid word", "word_added")
    return render_template("add-word.html")


def compute_score(time: int, guesses: int) -> int:
    """Return the score for a game won with the specified time spent and number of guesses.

    :param time: The amount of time spent to win the game, in milliseconds.
    :type time: int
    :param guesses: The number of guesses taken.
    :type guesses: int
    :return: The score for the game won.
    :rtype: int
    """

    max_guesses = 6
    zero_score_time = 300000    # After 5 minutes, the score is zero regardless of whether the user guesses the word
    if time >= zero_score_time or guesses >= max_guesses:
        return 0
    # This formula was made to reward taking less time exponentially and using less guesses linearly
    multiplier = max_guesses - guesses
    time_score = 2 ** ((zero_score_time - time) / (20000))
    return int(multiplier * time_score)


if __name__ == '__main__':
    app.run(debug=True)
