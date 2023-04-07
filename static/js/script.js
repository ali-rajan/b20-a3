const typingSound = document.getElementById("typing-sound")
document.addEventListener("keydown", typingSoundEffect);

function typingSoundEffect()
{
    /**
     * Plays the typing sound.
     */

    typingSound.play();
}