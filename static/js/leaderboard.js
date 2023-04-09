// Sliders for the leaderboard filters
const scoreSlider = document.getElementById("score-slider");
const guessSlider = document.getElementById("guesses-slider");
const scoreFilterText = document.getElementById("score-text");
const guessFilterText = document.getElementById("guess-text");

document.addEventListener("input", updateFilterTexts);

function updateFilterTexts()
{
    /**
     * Updates the text for the filters based on the new inputted value(s).
     */

    const minScore = scoreSlider.value;
    const maxGuesses = guessSlider.value;
    scoreFilterText.innerText = `Minimum score: ${minScore}`;
    guessFilterText.innerText = `Maximum guesses: ${maxGuesses}`;
}
