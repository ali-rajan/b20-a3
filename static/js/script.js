const typingSound = document.getElementById("typing-sound");
document.addEventListener("input", typingSoundEffect);

function typingSoundEffect()
{
    /**
     * Plays the typing sound.
     */

    typingSound.play();
}
