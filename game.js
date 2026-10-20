const startButton = document.getElementById("start-btn");

startButton.addEventListener("click", function () {
    alert("Game Started!");

    document.getElementById("menu-screen").style.display = "none";
    document.getElementById("game-screen").style.display = "block";
});
