from flask_sqlalchemy import SQLAlchemy
from random import randint
# from sqlalchemy import exc    # Can be used for exceptions when attempting to insert duplicate entries

database = SQLAlchemy()


class DictionaryWord(database.Model):
    """A table for the dictionary words (possible guesses).

    :param database: The database to store the table.
    :type database: flask_sqlalchemy.extension.SQLAlchemy
    """

    word = database.Column(database.Text, primary_key=True)

    def __init__(self, word):
        self.word = word


class Word(database.Model):
    """A table for the answer words (which the user tries to guess).

    :param database: The database to store the table.
    :type database: flask_sqlalchemy.extension.SQLAlchemy
    """

    id = database.Column(database.Integer, primary_key=True, autoincrement=True)    # Used to get a random word
    word = database.Column(database.Text)

    def __init__(self, word):
        self.word = word


def get_random_word():
    num_entries = Word.query.count()
    word_index = randint(1, num_entries)
    random_word = Word.query.filter_by(id = word_index).first().word    # Get the word with the specified id
    return random_word


def dictionary_contains_word(guessed_word):
    dict_entry = DictionaryWord.query.filter_by(word = guessed_word).first()
    return dict_entry is not None


# To-do: check if the word is a duplicate
def add_word(word: str):
    """Insert the given word into the database of answer words.

    :param word: The word to insert.
    :type word: str
    """

    wordEntry = Word(word)
    database.session.add(wordEntry)
    database.session.commit()

    dictWordEntry = DictionaryWord(word)
    database.session.add(dictWordEntry)
    database.session.commit()


def input_words_from_file(dictionary_path: str, answers_path: str):
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
        dictWord = line.strip()
        if not DictionaryWord.query.filter_by(word = dictWord).first():     # The entry doesn't exist in the table
            wordEntry = DictionaryWord(dictWord)
            database.session.add(wordEntry)
            database.session.commit()
    dictionary.close()

    # Read the possible answers
    answers = open(answers_path, "r")
    for line in answers:
        answer = line.strip()
        if not Word.query.filter_by(word = answer).first():     # The entry doesn't exist in the table
            ansEntry = Word(answer)
            database.session.add(ansEntry)
            database.session.commit()
    answers.close()
