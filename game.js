document.addEventListener("DOMContentLoaded", function () {
    const startBtn = document.getElementById("start-btn");
    const menuScreen = document.getElementById("menu-screen");
    const gameScreen = document.getElementById("game-screen");
    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas ? canvas.getContext("2d") : null;

    let player, zombies, bullets, keys, mouse, health, score, kills, gameRunning;

    function resizeCanvas() {
        if(canvas) {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight - 50;
        }
    }

    function initGame() {
        resizeCanvas();
        player = { x: canvas.width/2, y: canvas.height/2, size: 20, speed: 4 };
        zombies = [];
        bullets = [];
        keys = {};
        mouse = { x: 0, y: 0 };
        health = 100;
        score = 0;
        kills = 0;
        gameRunning = true;
        
        window.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
        window.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);
        
        canvas.addEventListener("mousemove", e => {
            const rect = canvas.getBoundingClientRect();
            mouse.x = e.clientX - rect.left;
            mouse.y = e.clientY - rect.top;
        });
        
        canvas.addEventListener("click", shoot);
        requestAnimationFrame(gameLoop);
        setInterval(spawnZombie, 1500);
    }

    function spawnZombie() {
        if(!gameRunning) return;
        const edge = Math.floor(Math.random()*4);
        let x, y;
        if(edge==0){x=0; y=Math.random()*canvas.height}
        else if(edge==1){x=canvas.width; y=Math.random()*canvas.height}
        else if(edge==2){x=Math.random()*canvas.width; y=0}
        else {x=Math.random()*canvas.width; y=canvas.height}
        zombies.push({x, y, size: 18, speed: 0.8 + Math.random()*0.8});
    }

    function shoot() {
        if(!gameRunning) return;
        const angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
        bullets.push({x: player.x, y: player.y, dx: Math.cos(angle)*8, dy: Math.sin(angle)*8});
    }

    function gameLoop() {
        if(!gameRunning) return;
        
        if(keys['w']) player.y -= player.speed;
        if(keys['s']) player.y += player.speed;
        if(keys['a']) player.x -= player.speed;
        if(keys['d']) player.x += player.speed;
        player.x = Math.max(0, Math.min(canvas.width, player.x));
        player.y = Math.max(0, Math.min(canvas.height, player.y));

        zombies.forEach(z => {
            const angle = Math.atan2(player.y - z.y, player.x - z.x);
            z.x += Math.cos(angle)*z.speed;
            z.y += Math.sin(angle)*z.speed;
            if(Math.hypot(z.x-player.x, z.y-player.y) < z.size+player.size) {
                health -= 0.5;
                if(health<=0){ gameRunning=false; alert("Game Over! Score: "+score); location.reload(); }
            }
        });

        bullets.forEach((b,i) => {
            b.x += b.dx; b.y += b.dy;
            if(b.x<0||b.x>canvas.width||b.y<0||b.y>canvas.height) bullets.splice(i,1);
            zombies.forEach((z,j) => {
                if(Math.hypot(b.x-z.x, b.y-z.y) < z.size+5) {
                    zombies.splice(j,1); bullets.splice(i,1);
                    score+=10; kills++;
                }
            });
        });

        ctx.fillStyle="#1a1a1a"; ctx.fillRect(0,0,canvas.width,canvas.height);
        ctx.fillStyle="#00ff88"; ctx.beginPath(); ctx.arc(player.x, player.y, player.size,0,Math.PI*2); ctx.fill();
        ctx.strokeStyle="#ffffff55"; ctx.beginPath(); ctx.moveTo(player.x, player.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
        ctx.fillStyle="#ff3333"; zombies.forEach(z=>{ctx.beginPath(); ctx.arc(z.x,z.y,z.size,0,Math.PI*2); ctx.fill();});
        ctx.fillStyle="#ffff00"; bullets.forEach(b=>{ctx.beginPath(); ctx.arc(b.x,b.y,4,0,Math.PI*2); ctx.fill();});

        document.getElementById("health-display").innerText="Health: "+Math.floor(health);
        document.getElementById("score-display").innerText="Score: "+score;
        document.getElementById("kills-display").innerText="Kills: "+kills;

        requestAnimationFrame(gameLoop);
    }

    startBtn.addEventListener("click", function () {
        menuScreen.style.display = "none";
        gameScreen.style.display = "block";
        initGame();
});
});
