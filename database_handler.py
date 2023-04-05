from flask_sqlalchemy import SQLAlchemy
from random import randint
from sqlalchemy import exc
from flask_bcrypt import Bcrypt

database = SQLAlchemy()
bcrypt = Bcrypt()


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


# To-do
def insert_player(username, password_hash):
    try:
        player = Player(username, password_hash)
        database.session.add(player)
        database.session.commit()
    except exc.IntegrityError:
        database.session.rollback()


##### Functions for the leaderboard table #####


# To-do
def insert_leaderboard_entry(player_id, score, time, guesses):
    try:
        entry = Leaderboard(player_id, score, time, guesses)
        database.session.add(entry)
        database.session.commit()
    except exc.IntegrityError:
        database.session.rollback()


# To-do
def get_leaderboard_entries() -> list[tuple]:
    # return [("rank", "name", "player id", "score", "time", "guesses")]
    entries = Leaderboard.query.all()
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
    :return: Whether the given word is in the database's DictionaryWord table.
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
    :return: Whether the given word is valid
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
