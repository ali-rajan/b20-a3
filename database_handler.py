from flask_sqlalchemy import SQLAlchemy
from random import randint
from sqlalchemy import exc, desc
from flask_bcrypt import Bcrypt

database = SQLAlchemy()
bcrypt = Bcrypt()

# Constants for the login query return values used later
USER_NOT_FOUND = -2
INCORRECT_PASSWORD = -1


class DictionaryWord(database.Model):
    """A table for the dictionary words (possible guesses).

    :param database: The database to store the table in.
    :type database: flask_sqlalchemy.extension.SQLAlchemy
    """

    word = database.Column(database.Text, primary_key=True)

    def __init__(self, word: str) -> None:
        self.word = word


class Word(database.Model):
    """A table for the answer words (which the user tries to guess).

    :param database: The database to store the table in.
    :type database: flask_sqlalchemy.extension.SQLAlchemy
    """

    id = database.Column(database.Integer, primary_key=True, autoincrement=True)    # Used to get a random word
    word = database.Column(database.Text)
    # Note: autoincrement cannot be used for primary keys with multiple attributes
    # Since word cannot be part of the primary key, checking for an exc.IntegrityError does not guarantee that the word
    # is not a duplicate (when inserting)

    def __init__(self, word: str) -> None:
        self.word = word


class Player(database.Model):
    """A table storing the information of each player.

    :param database: The database to store the table in.
    :type database: flask_sqlalchemy.extension.SQLAlchemy
    """

    id = database.Column(database.Integer, primary_key=True, autoincrement=True)
    username = database.Column(database.Text, nullable=False)
    password_hash = database.Column(database.Text, nullable=False)

    def __init__(self, username: str, password_hash: str) -> None:
        self.username = username
        self.password_hash = password_hash


class Leaderboard(database.Model):
    """A table for each of the leaderboard entries.

    :param database: The database to store the table in.
    :type database: flask_sqlalchemy.extension.SQLAlchemy
    """

    id = database.Column(database.Integer, primary_key=True, autoincrement=True)
    player_id = database.Column(database.Integer, database.ForeignKey("player.id"), nullable=False)
    score = database.Column(database.Integer, database.CheckConstraint("score >= 0"), nullable=False)
    time = database.Column(database.Text, nullable=False)
    guesses = database.Column(database.Integer, database.CheckConstraint("guesses > 0"), nullable=False)

    def __init__(self, player_id: int, score: int, time: str, guesses: int) -> None:
        self.player_id = player_id
        self.score = score
        self.time = time
        self.guesses = guesses


##### Functions for the player table #####


def is_valid_account_info(username_query: str, password_query: str) -> bool:
    """Return whether the given username and password can be used to create a new player account.

    :param username_query: The username to validate.
    :type username_query: str
    :param password_query: The (plaintext) password to validate.
    :type password_query: str
    :return: True if the username and password are valid, False otherwise.
    :rtype: bool
    """

    existing = Player.query.filter_by(username=username_query).first()
    if existing:    # The user already exists
        return False
    return username_query.isalnum() and password_query.isalnum()    # Check that only alphanumeric characters are used


def insert_player(username: str, password_hash: str) -> None:
    """Insert the player with the given login information into the Player table. The input should be validated using
    :func:is_valid_user before attempting to insert.

    :param username: The username.
    :type username: str
    :param password_hash: The hash generated for the password.
    :type password_hash: str
    """

    try:
        player = Player(username, password_hash)
        database.session.add(player)
        database.session.commit()
    except exc.IntegrityError:
        database.session.rollback()


def validate_login(username_query: str, password_query: str) -> int:
    """Return the player ID after verifying the given login information. If the player does not exist or the password
    is incorrect, the corresponding constants are returned.

    :param username_query: The username provided when logging in.
    :type username_query: str
    :param password_query: The password provided when logging in.
    :type password_query: str
    :return: The player ID, if the login information matches that of some user. If the player does not exist,
        USER_NOT_FOUND is returned, and if the password is incorrect, INCORRECT_PASSWORD is returned.
    :rtype: int
    """

    player = Player.query.filter_by(username=username_query).first()
    if not player:  # The user does not exist
        return USER_NOT_FOUND
    elif not bcrypt.check_password_hash(player.password_hash, password_query):  # An incorrect password was provided
        return INCORRECT_PASSWORD
    return player.id


def get_username(player_id: int) -> str:
    """Return the username of the player with the given ID. If the ID is not found, an empty string is returned.

    :param player_id: The player ID.
    :type player_id: int
    :return: The username of the given player, or an empty string if the player does not exist in the table.
    :rtype: str
    """

    player = Player.query.filter_by(id=player_id).first()
    if not player:
        return ""
    return player.username


##### Functions for the leaderboard table #####


def insert_leaderboard_entry(player_id: int, score: int, time: str, guesses: int) -> None:
    """Insert a new entry with the given attributes into the Leaderboard table.

    :param player_id: The player ID.
    :type player_id: int
    :param score: The player's score for the game played.
    :type score: int
    :param time: The string representation of the time taken.
    :type time: str
    :param guesses: The number of guesses used.
    :type guesses: int
    """

    try:
        entry = Leaderboard(player_id, score, time, guesses)
        database.session.add(entry)
        database.session.commit()
    except exc.IntegrityError:
        database.session.rollback()


def get_leaderboard_entries() -> list[Leaderboard]:
    """Return all the leaderboard entries in the list.

    :return: A list of all the leaderboard entries.
    :rtype: list[Leaderboard]
    """

    entries = Leaderboard.query.order_by(desc(Leaderboard.score)).all()
    return entries


def get_filtered_leaderboard_entries(min_score: int, max_guesses: int) -> list[Leaderboard]:
    """Return all the leaderboard entries with the specified filter options.

    :param min_score: The minimum score for any entry to include.
    :type min_score: int
    :param max_guesses: The maximum number of guesses for any entry to include
    :type max_guesses: int
    :return: A list of all the filtered leaderboard entries.
    :rtype: list[Leaderboard]
    """

    entries = Leaderboard.query.filter(Leaderboard.score >= min_score, Leaderboard.guesses <= max_guesses)
    entries = entries.order_by(desc(Leaderboard.score)).all()
    return entries


##### Functions for the word tables #####


def get_random_word() -> str:
    """Return a word selected at random from the Word table in the database.

    :return: A random word.
    :rtype: str
    """

    num_entries = Word.query.count()
    word_index = randint(1, num_entries)
    random_word = Word.query.filter_by(id = word_index).first().word    # Get the word with the randomly chosen ID
    return random_word


def dictionary_contains_word(guessed_word: str) -> bool:
    """Return whether the given word is in the dictionary (the DictionaryWord table in the database).

    :param guessed_word: The word to check.
    :type guessed_word: str
    :return: True if the given word is in the database's DictionaryWord table, False otherwise.
    :rtype: bool
    """

    dict_entry = DictionaryWord.query.filter_by(word = guessed_word).first()
    return dict_entry is not None


def is_valid_word(word: str, word_length: int) -> bool:
    """Return whether the given word is valid; that is, whether it contains only alphabetic characters, and is of the
    specified length.

    :param word: The word to validate.
    :type word: str
    :param word_length: The string length for the word to be valid.
    :type word_length: int
    :return: True if the given word is valid, False otherwise.
    :rtype: bool
    """

    return word.isalpha() and len(word) == word_length


# To-do: check if the word is a duplicate
def insert_word(new_word: str) -> None:
    """Insert the given word into the database of answer words and dictionary words, if it doesn't exist. The word is
    only inserted into tables where it is not a duplicate.

    :param new_word: The word to insert.
    :type new_word: str
    """

    if not Word.query.filter_by(word = new_word).first():   # The new word is not a duplicate
        word_entry = Word(new_word)
        database.session.add(word_entry)
        database.session.commit()
    if not DictionaryWord.query.filter_by(word = new_word).first():     # The new word is not a duplicate
        dict_word_entry = DictionaryWord(new_word)
        database.session.add(dict_word_entry)
        database.session.commit()


def input_words_from_file(dictionary_path: str, answers_path: str) -> None:
    """Read the dictionary words (possible guesses) and answers from the given text files and store them in the
    corresponding database tables. Any duplicate entries are ignored.

    :param dictionary_path: The path of the file to read dictionary words from. There must be exactly one word per
        line. This file must contain all the words in the file answers_path.
    :type dictionary_path: str
    :param answers_path: The path of the file to read the answer words from. There must be exactly one word per line.
    :type answers_path: str
    """

    # Read the dictionary words (possible guesses)
    dictionary = open(dictionary_path, "r")
    for line in dictionary:
        dict_word = line.strip()
        if not DictionaryWord.query.filter_by(word = dict_word).first():    # The word does not exist in the table
            word_entry = DictionaryWord(dict_word)
            database.session.add(word_entry)
            database.session.commit()
            continue
    dictionary.close()

    # Read the possible answers
    answers = open(answers_path, "r")
    for line in answers:
        answer = line.strip()
        if not Word.query.filter_by(word = answer).first():     # The word does not exist in the table
            ans_entry = Word(answer)
            database.session.add(ans_entry)
            database.session.commit()
    answers.close()
