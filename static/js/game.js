// HTML elements for the game's components
const gridElement = document.getElementById("grid");
const keyboardElement = document.getElementById("keyboard");
const feedbackText = document.getElementById("feedback");
const timer = document.querySelector('.timerDisplay');
const backgroundMusic = document.getElementById("background-music");
const victorySound = document.getElementById("victory-sound");
const gameoverSound = document.getElementById("game-over-sound");

// CSS classes for cell colour highlighting
const CORRECT_COLOUR_CLASS = "correct";
const MISPLACED_COLOUR_CLASS = "misplaced";
const INCORRECT_COLOUR_CLASS = "incorrect";

// Game constants
const GUESSES = 6;
const WORD_LENGTH = 5;
const TIMER_INCREMENT = 10;
let secretWord;
const time = new Date(0);   // Tracks the amount of time taken
let currentInterval = null;     // The interval for the timer functionality
let guesses = 0;    // The number of guesses used
const grid = [];    // Stores the letter grid elements displayed
const cursor = {    // Stores the current position of the letter to be typed in the grid
    row: 0,
    col: 0
};
const LETTERS = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t",
    "u", "v", "w", "x", "y", "z"];

// Initialize the components and add event listeners
createGrid(GUESSES, WORD_LENGTH);
createKeyboard();
getSecretWord();
document.addEventListener("keyup", keyboardInput);
document.addEventListener("DOMContentLoaded", startTimer);
backgroundMusic.volume = 0.3;


async function getSecretWord()
{
    /**
     * Fetches a random word from the database and stores it in the variable secretWord.
     */

    await fetch("/game/random_word", {
        method: "GET",
    }).then(response => response.json())    // Extract the JSON data from the HTTP response
    .then(function(data) {
        secretWord = data["word"];
    });
}

function startTimer()
{
    /**
     * Starts the timer using intervals.
     */

    if (currentInterval !== null)
    {
        clearInterval(currentInterval, TIMER_INCREMENT);
    }
    currentInterval = setInterval(updateTimer, TIMER_INCREMENT);
}

function updateTimer()
{
    /**
     * Increments the time elapsed and updates the timer's text.
     */

    time.setTime(time.getTime() + TIMER_INCREMENT);
    // Characters 11 to 23 of the ISO string are HH:MM:SS:mmm (m is for milliseconds)
    timer.innerText = time.toISOString().slice(11, 23);
}

function createGrid(rows, cols)
{
    /**
     * Creates the grid for the word guesses with the specified number of rows and columns. There should be as many
     * rows as the number of allowed guesses, and as many columns as the length of each word.
     *
     * @param {number} rows The number of rows in the grid (a positive integer).
     * @param {number} cols The number of columns in the grid (a positive integer).
     */

    // Set the number of columns for the CSS grid template
    gridElement.style.setProperty("grid-template-columns", `repeat(${WORD_LENGTH}, 60px)`);
    // Create the cells for the grid with the designated CSS class
    for (let i = 0; i < rows; i ++)
    {
        const row = [];
        for (let j = 0; j < cols; j ++)
        {
            const cell = document.createElement("div");
            cell.classList.add("cell");
            gridElement.appendChild(cell);
            row.push(cell);
        }
        grid.push(row);
    }
}

function createKeyboard()
{
    /**
     * Creates the on-screen keyboard with the layout indicated in the array below.
     */

    const enterText = "Enter";
    const backspaceText = "\u2190";
    // Text for each of the keys
    const keys = [
        ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
        ["A", "S", "D", "F", "G", "H", "J", "K", "L", ""],
        [enterText, "Z", "X", "C", "V", "B", "N", "M", backspaceText, ""]
    ];

    // Create the keys with the designated event listener for input, CSS class, and ID
    for (let i = 0; i < keys.length; i ++)
    {
        for (let j = 0; j < keys[i].length; j ++)
        {
            const key = document.createElement("div");
            key.classList.add("key");
            key.innerText = keys[i][j];
            if (keys[i][j] === enterText)
            {
                key.id = "Enter";
            }
            else if (keys[i][j] === backspaceText)
            {
                key.id = "Backspace";
            }
            else if (keys[i][j] !== "")
            {
                key.id = keys[i][j].toLowerCase();
            }

            if (keys[i][j] !== "")
            {
                key.addEventListener("click", onScreenKeyboardInput);
            }

            keyboardElement.appendChild(key);
        }
    }
}

function onScreenKeyboardInput(event)
{
    /**
     * Passes the on-screen keyboard click event to the keyboard event listener as if the equivalent key was pressed on
     * the physical keyboard.
     *
     * @param {KeyboardEvent} event The keyup event for the key pressed.
     */

    event.key = event.target.id;    // The key attribute is used in the keyboard event listener
    keyboardInput(event);
}

function keyboardInput(event)
{
    /**
     * Handles keyboard input to allow the user to enter the letters of the guessed word.
     *
     * @param {KeyboardEvent} event The keyup event for the key pressed.
     */

    if (cursor.row < 0 || cursor.row >= GUESSES)    // All guesses have been used up
    {
        return;
    }

    const key = event.key.toString();
    if (key === "Enter")
    {
        processWord(key);
    }
    else if (key === "Backspace")
    {
        backspaceCharacter();
    }
    else if (LETTERS.includes(key.toLowerCase()))
    {
        inputCharacter(key);
    }
}

async function processWord()
{
    /**
     * Retrieves the guessed word from the cursor's current row, checks which letters match the secret word (if any)
     * considering order as well, and highlights the cells accordingly.
     */

    if (cursor.col < WORD_LENGTH)  // Not all letters have been entered
    {
        feedbackText.innerText = "Fill in all of the letters";
        return;
    }

    let guessedWord = "";
    for (let col = 0; col < WORD_LENGTH; col ++)
    {
        guessedWord += grid[cursor.row][col].innerText;
    }

    const containsWord = await dictionaryContainsWord(guessedWord);
    if (!containsWord)
    {
        feedbackText.innerText = "Enter a word in the dictionary";
        return;
    }
    else
    {
        highlightCells(guessedWord);
        guesses ++;
    }

    cursor.row ++;
    cursor.col = 0;
    if (guessedWord === secretWord)
    {
        clearInterval(currentInterval);
        feedbackText.innerText = "You win!";
        victorySound.play();
        backgroundMusic.pause();
        cursor.row = GUESSES;
        addLeaderboardEntry(time.getTime(), timer.innerText, guesses);    // Send the information to the database
    }
    else if (cursor.row === GUESSES)
    {
        clearInterval(currentInterval);
        feedbackText.innerText = `Game over. The word was "${secretWord}"`;
        gameoverSound.play();
        backgroundMusic.pause();
    }
}

async function dictionaryContainsWord(word)
{
    /**
     * Returns whether or not the given word is in the dictionary of guessable words, as stored in the database.
     *
     * @param {string} word The word to find in the dictionary.
     *
     * @return {boolean} Whether the given word is a guessable word.
     */

    let containsWord;
    await fetch("/game/dictionary_check", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({"word": word})
    }).then(response => response.json())    // Extract the JSON data from the HTTP response
    .then(function(data) {
        containsWord = data["containsWord"];
    });
    return containsWord;
}

function highlightCells(guessedWord)
{
    /**
     * Highlights the cell of each letter and the corresponding on-screen keyboard button based on the guessed word as
     * follows:
     *  - If the letter is in the correct position, a green highlight is applied
     *  - If the letter is present in the secret word but in a different position, a yellow highlight is used
     *  - If the letter is not present, a red highlight is used
     *
     * @param {string} guessedWord The word guessed, all lowercase.
     */

    const letterColourClass = {};   // Maps each character to its most prominent colour class
    // Comparing the guess letter by letter (to change the highlight cell by cell)
    for (let col = 0; col < WORD_LENGTH; col ++)
    {
        const letter = guessedWord[col];
        let colourClass;    // The CSS class to change the highlight colour
        if (letter === secretWord[col])     // The letter is in the correct position
        {
            colourClass = CORRECT_COLOUR_CLASS;
        }
        else if (secretWord.includes(letter))   // The letter is in the secret word but not in the right position
        {
            colourClass = MISPLACED_COLOUR_CLASS;
        }
        else    // The letter is not in the secret word
        {
            colourClass = INCORRECT_COLOUR_CLASS;
        }
        grid[cursor.row][col].classList.add(colourClass);
        // Change the corresponding keyboard button's colour
        const keyButton = document.getElementById(letter);
        updateKeyColour(keyButton, colourClass, letterColourClass);
    }
}

function updateKeyColour(keyButton, colourClass, letterColourClass)
{
    /**
     * Updates the colour class of the given on-screen keyboard button according to the precedence
     * correct > misplaced > incorrect. That is, if a letter has been marked with a colour class of higher precedence
     * than the one we are attempting to set it to, the class is not updated.
     *
     * @param {Element} keyButton           The on-screen keyboard button element whose class is to be modified.
     * @param {string} colourClass          The colour class to apply on the button (while checking the precedence
     *                                      rules).
     * @param {Object} letterColourClass    An object mapping each guessed letter to its colour class of highest
     *                                      precedence.
     */

    const letter = keyButton.id;
    // The letter has not been highlighted or it is being marked as correct (which takes precedence over other classes)
    if (colourClass === CORRECT_COLOUR_CLASS || !(letter in letterColourClass))
    {
        letterColourClass[letter] = colourClass;
    }
    // The letter was in the wrong position in the current guess and it has not been marked as correct yet
    else if (letterColourClass[letter] !== CORRECT_COLOUR_CLASS && colourClass === MISPLACED_COLOUR_CLASS)
    {
        letterColourClass[letter] = MISPLACED_COLOUR_CLASS;
    }
    // The letter is either already marked as misplaced, or it has not been marked and is being set to misplaced
    else if (letterColourClass[letter] !== MISPLACED_COLOUR_CLASS && colourClass === INCORRECT_COLOUR_CLASS)
    {
        letterColourClass[letter] = INCORRECT_COLOUR_CLASS;
    }

    keyButton.classList.remove(CORRECT_COLOUR_CLASS);
    keyButton.classList.remove(MISPLACED_COLOUR_CLASS);
    keyButton.classList.remove(INCORRECT_COLOUR_CLASS);
    keyButton.classList.add(letterColourClass[letter]);
}

function backspaceCharacter()
{
    /**
     * Backspaces (deletes) the letter at the cursor's current position.
     */

    if (cursor.col <= 0)    // The cursor is at the first letter's position
    {
        return;
    }

    grid[cursor.row][cursor.col - 1].innerText = "";
    cursor.col --;
    if (cursor.col < 0)
    {
        cursor.col = 0;
    }
}

function inputCharacter(letter)
{
    /**
     * Enters the given letter at the cursor's current position.
     *
     * @param {string} letter The letter to enter.
     */

    // The cursor is out of bounds
    if (cursor.row < 0 || cursor.row >= GUESSES || cursor.col < 0 || cursor.col >= WORD_LENGTH)
    {
        return;
    }

    grid[cursor.row][cursor.col].innerText = letter.toLowerCase();
    cursor.col ++;
}

function addLeaderboardEntry(time, timeString, guesses)
{
    /**
     * Posts the given leaderboard entry data to the server for insertion into the Leaderboard table.
     *
     * @param {number} time         The time taken to win the game, in milliseconds.
     * @param {string} timeString   The timer string representation of the time taken.
     * @param {number} guesses      The number of guesses used.
     */

    fetch("/game/leaderboard_entry", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({"time": time, "timeString": timeString, "guesses": guesses})
    });
}
