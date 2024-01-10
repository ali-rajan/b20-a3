# Totally Not Wordle

## Description

This website is a remake of the popular word-guessing game "Wordle", with several spinoff features. The objective of
"Totally Not Wordle" is to guess a five-letter word within six guesses in the least amount of time possible. To play
the game, follow these instructions:

1. Click "Register" on the navigation bar and create an account by following the prompts on the website.
2. Once creating an account, go back to the homepage by clicking "Home" on the navigation bar. From here, log in
   using the same account you just created.
3. After logging in, read the instructions with the examples provided and click "Start" once you are ready to play.
4. A timer will begin as soon as the page is loaded. Try to guess the word; you may type using your physical
   keyboard or the on-screen keyboard.
5. If you manage to guess the word successfully, a leaderboard entry with your account information and game
   statistics will be created. Otherwise, no leaderboard entry will be created.
6. To view the leaderboard page, click "Leaderboard" on the navigation bar.
7. On the leaderboard, you can view all of the entries and search/filter them using the options available.
8. If you want to add a new word to be used as a possible answer in the game, click "Add a Word" on the navigation
   bar and follow the prompt on the page to enter a new word.

## Noteworthy Features

Some noteworthy features of the site are:

- Flask SQLAlchemy backend used for storing words, user accounts, and leaderboard entries
- Input validation for the user login information when registering and for the "Add a Word" page
- Password hashing using Bcrypt for secure password storage in the database
- Dynamic UI components using Bootstrap
- Smooth visual animations for letter cell highlighting based on whether each letter is placed correctly
- JavaScript timer for score calculation purposes
- Typing sound effects and in-game background music
- Leaderboard table with advanced search (to search for text in any of the columns) and filter options for various
  columns with the use of range sliders

## Dependencies

Python:

- flask v2.2.3
- SQLAlchemy v2.0.8
- flask_bcrypt v1.0.1
- random (Python built-in)

HTML/JS/CSS:
- Bootstrap v3.4.1 CSS and JS (for UI components such as dropdowns)
- jQuery v1.12.4 (required for Bootstrap)

SQLite: v3.40.1

## Other Notes

Some things to note:

- The words are initially read from a text file and stored in the database if they are not present; this can take
  several minutes if the database is empty (or the file is not found)
- Flask SQLAlchemy stores the database file in different directories based on the operating system (e.g. /instance/
  Windows, /var/main-instance/ for Mac), which is why the database file may not be found
- If the words are already present in the database, it should not take too long for the website to launch
