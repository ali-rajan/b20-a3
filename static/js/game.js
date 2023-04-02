const GUESSES = 6;
const WORD_LENGTH = 5;

const gridElement = document.getElementById("grid");
const keyboardElement = document.getElementById("keyboard");
const feedbackText = document.getElementById("feedback");

const grid = [];
const keyboard = [];
const secretWord = "squid";     // To-do: get this from the database

createGrid(GUESSES, WORD_LENGTH);
createKeyboard();   // To-do
document.addEventListener("keyup", keyboardInput);

function createGrid(rows, cols)
{
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
    // Text for each of the keys
    const enterText = "Enter";
    const backspaceText = "\u2190";
    const keys = [
        ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
        ["A", "S", "D", "F", "G", "H", "J", "K", "L", ""],
        [enterText, "Z", "X", "C", "V", "B", "N", "M", backspaceText, ""]
    ];

    // Create the keys with the designated event listener for input, CSS class, and ID
    for (let i = 0; i < keys.length; i ++)
    {
        const row = [];
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
            row.push(key);
        }
        keyboard.push(row);
    }
}

function onScreenKeyboardInput(event)
{
    event.key = event.target.id;
    keyboardInput(event);
}

const letters = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t",
    "u", "v", "w", "x", "y", "z"];
const cursor = {    // Stores the current position of the letter to be typed in the grid
    row: 0,
    col: 0
};

function keyboardInput(event)
{
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
    else if (letters.includes(key.toLowerCase()))
    {
        inputCharacter(key);
    }
}

function processWord()
{
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
    const words = ["squid", "cigar", "sissy", "awake"];
    return words.includes(word);
}

function highlightCells(guessedWord)
{
    for (let col = 0; col < WORD_LENGTH; col ++)
    {
        const char = guessedWord[col];
        if (char === secretWord[col])   // The letter is in the correct position
        {
            grid[cursor.row][col].classList.toggle("correct-cell");
        }
        else if (secretWord.includes(char))     // The letter is in the secret word but not in the right position
        {
            grid[cursor.row][col].classList.toggle("misplaced-cell");
        }
        else    // The letter is not in the secret word
        {
            grid[cursor.row][col].classList.toggle("incorrect-cell");
        }
    }
}

function backspaceCharacter()
{
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

function inputCharacter(key)
{
    // The cursor is out of bounds
    if (cursor.row < 0 || cursor.row >= GUESSES || cursor.col < 0 || cursor.col >= WORD_LENGTH)
    {
        return;
    }

    grid[cursor.row][cursor.col].innerText = key;
    cursor.col ++;
}
