document.addEventListener("DOMContentLoaded", function () {

    const startBtn = document.getElementById("start-btn");
    const menuScreen = document.getElementById("menu-screen");
    const gameScreen = document.getElementById("game-screen");

    startBtn.addEventListener("click", function () {

        menuScreen.style.display = "none";
        gameScreen.style.display = "block";

        alert("Welcome to Zombie Survival!");

    });

});
