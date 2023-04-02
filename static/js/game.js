const GUESSES = 6;
const WORD_LENGTH = 5;

const gridElement = document.getElementById("grid");
const keyboardElement = document.getElementById("keyboard");
const feedbackText = document.getElementById("feedback");

const grid = [];
const secretWord = "squid";     // To-do: get this from the database
const LETTERS = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t",
    "u", "v", "w", "x", "y", "z"];
const cursor = {    // Stores the current position of the letter to be typed in the grid
    row: 0,
    col: 0
};

createGrid(GUESSES, WORD_LENGTH);
createKeyboard();
document.addEventListener("keyup", keyboardInput);

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

function processWord()
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

    if (!dictionaryContainsWord(guessedWord))
    {
        for (let col = 0; col < WORD_LENGTH; col ++)    // Clear the guessed word
        {
            grid[cursor.row][col].innerText = "";
        }
        cursor.col = 0;
        feedbackText.innerText = "Enter a word in the dictionary";
        return;
    }
    else
    {
        highlightCells(guessedWord);
    }

    cursor.row ++;
    cursor.col = 0;
    if (guessedWord === secretWord)
    {
        feedbackText.innerText = "You win";
        cursor.row = GUESSES;
    }
    else if (cursor.row === GUESSES)
    {
        feedbackText.innerText = "Game over";
    }
}

// To-do: get this from the database
function dictionaryContainsWord(word)
{
    /**
     * Returns whether or not the given word is in the dictionary of guessable words, as stored in the database.
     *
     * @param {string} word The word to find in the dictionary.
     *
     * @return {boolean} Whether the given word is a guessable word.
     */

    const words = ["squid", "cigar", "sissy", "awake"];
    return words.includes(word);
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

    resetKeyboardColours();
    // Comparing the guess letter by letter (to change the highlight cell by cell)
    for (let col = 0; col < WORD_LENGTH; col ++)
    {
        const char = guessedWord[col];
        let colourClass;    // The CSS class to change the highlight colour
        if (char === secretWord[col])   // The letter is in the correct position
        {
            colourClass = "correct";
            // grid[cursor.row][col].classList.toggle("correct");
        }
        else if (secretWord.includes(char))     // The letter is in the secret word but not in the right position
        {
            // grid[cursor.row][col].classList.toggle("misplaced");
            colourClass = "misplaced";
        }
        else    // The letter is not in the secret word
        {
            // grid[cursor.row][col].classList.toggle("incorrect");
            colourClass = "incorrect";
        }
        grid[cursor.row][col].classList.toggle(colourClass);
        // Change the corresponding keyboard button's colour
        document.getElementById(char).classList.toggle(colourClass);
    }
}

function resetKeyboardColours()
{
    /**
     * Resets the highlight colours of each of the keyboard's buttons.
     */

    const buttons = keyboardElement.children;
    for (let i = 0; i < buttons.length; i ++)   // Iterate over the buttons and reset their colours
    {
        const button = buttons[i];
        console.log(button.id);
        button.classList.remove("correct");
        button.classList.remove("misplaced");
        button.classList.remove("incorrect");
    }
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

    grid[cursor.row][cursor.col].innerText = letter;
    cursor.col ++;
}
