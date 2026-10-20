const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('start-btn');
const scoreEl = document.getElementById('score');
const healthEl = document.getElementById('health');
const joystickZone = document.getElementById('joystick-zone');
const joystickStick = document.getElementById('joystick-stick');
const shootBtn = document.getElementById('shoot-btn');
const finalScoreEl = document.getElementById('final-score');

// --- Images ---
const zombieImg = new Image();
zombieImg.src = 'zomby.jpeg';

const playerImg = new Image();
playerImg.src = 'player.jpeg';

let audioCtx;
function playSound(freq, type, vol, duration, pan = 0){
  try{
    if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    const panner = audioCtx.createStereoPanner ? audioCtx.createStereoPanner() : null;
    o.type = type; o.frequency.value = freq;
    g.gain.value = vol;
    if(panner){
      panner.pan.value = pan;
      o.connect(panner); panner.connect(g); g.connect(audioCtx.destination);
    } else {
      o.connect(g); g.connect(audioCtx.destination);
    }
    o.start(); g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    o.stop(audioCtx.currentTime + duration);
  }catch(e){}
}

function vibrate(p){ try{ if('vibrate' in navigator) navigator.vibrate(p); }catch(e){} }
function speak(t){ try{ if('speechSynthesis' in window){ window.speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(t); u.rate=1.1; window.speechSynthesis.speak(u);} }catch(e){} }

let player, bullets, zombies, keys, score, health, gameRunning, animId;
let joyActive=false, joyVec={x:0,y:0};
let lastDirectionText = "";
let directionTimer = 0;

function resize(){ canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', resize); resize();

function init(){
  player = { x: canvas.width/2, y: canvas.height/2, size: 18, speed: 3.5, angle: 0, type: "Human" };
  bullets=[]; zombies=[]; score=0; health=100;
  keys={}; lastDirectionText=""; directionTimer=0;
}

function spawnZombie(){
  if(!gameRunning) return;
  if(zombies.length >= 5) {
    setTimeout(spawnZombie, 2000);
    return;
  }
  const edge = Math.floor(Math.random()*4);
  let x,y, dirText, pan;
  if(edge===0){x=Math.random()*canvas.width; y=-30; dirText="TOP"; pan=0;}
  if(edge===1){x=canvas.width+30; y=Math.random()*canvas.height; dirText="RIGHT"; pan=0.8;}
  if(edge===2){x=Math.random()*canvas.width; y=canvas.height+30; dirText="BOTTOM"; pan=0;}
  if(edge===3){x=-30; y=Math.random()*canvas.height; dirText="LEFT"; pan=-0.8;}
  
  zombies.push({x,y,size:28+Math.random()*8, speed:0.35+Math.random()*0.4+score*0.005});
  
  lastDirectionText = dirText;
  directionTimer = 120;
  playSound(220,'sawtooth',0.35,0.4, pan);
  vibrate(40);
  if(zombies.length % 3 === 0) speak("Zombie " + dirText);

  setTimeout(spawnZombie, Math.max(800, 2500-score*10));
}

function handleInput(){
  let moveX=0, moveY=0;
  if(keys['w']||keys['ArrowUp']) moveY=-1;
  if(keys['s']||keys['ArrowDown']) moveY=1;
  if(keys['a']||keys['ArrowLeft']) moveX=-1;
  if(keys['d']||keys['ArrowRight']) moveX=1;
  if(joyActive){ moveX=joyVec.x; moveY=joyVec.y; }
  if(moveX||moveY){
    const len = Math.hypot(moveX,moveY);
    player.x += (moveX/len)*player.speed;
    player.y += (moveY/len)*player.speed;
    player.angle = Math.atan2(moveY,moveX);
  }
  player.x = Math.max(player.size, Math.min(canvas.width-player.size, player.x));
  player.y = Math.max(player.size, Math.min(canvas.height-player.size, player.y));
}

function shoot(){
  if(!gameRunning) return;
  playSound(600,'square',0.3,0.1);
  bullets.push({x:player.x, y:player.y, vx:Math.cos(player.angle)*10, vy:Math.sin(player.angle)*10});
  vibrate(20);
}

function update(){
  handleInput();
  if(directionTimer>0) directionTimer--;
  bullets.forEach((b,i)=>{
    b.x+=b.vx; b.y+=b.vy;
    if(b.x<0||b.x>canvas.width||b.y<0||b.y>canvas.height) bullets.splice(i,1);
  });
  zombies.forEach((z, zi)=>{
    const ang=Math.atan2(player.y-z.y, player.x-z.x);
    z.x+=Math.cos(ang)*z.speed;
    z.y+=Math.sin(ang)*z.speed;

    if(Math.hypot(player.x-z.x, player.y-z.y) < player.size + z.size - 5){
        zombies.splice(zi,1);
        health-=15;
        healthEl.textContent = health;
        playSound(120,'sawtooth',0.5,0.3);
        vibrate([50,50,100]);
        if(health<=0){
            endGame();
        }
    }

    bullets.forEach((b, bi)=>{
        if(Math.hypot(b.x-z.x, b.y-z.y) < z.size){
            zombies.splice(zi,1);
            bullets.splice(bi,1);
            score+=10;
            scoreEl.textContent = score;
            playSound(400,'sine',0.4,0.2);
        }
    });
  });
}

function draw(){
  ctx.clearRect(0,0,canvas.width, canvas.height);

  // Player
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(player.angle);
  if(playerImg.complete && playerImg.naturalWidth !== 0){
    ctx.drawImage(playerImg, -player.size, -player.size, player.size*2.2, player.size*2.2);
  } else {
    ctx.fillStyle='#00ff88';
    ctx.beginPath();
    ctx.arc(0,0,player.size,0,Math.PI*2);
    ctx.fill();
    ctx.fillStyle='#fff';
    ctx.fillRect(player.size-2, -2, 12, 4);
  }
  ctx.restore();

  // Bullets
  ctx.fillStyle='#ffff00';
  bullets.forEach(b=>{
    ctx.beginPath();
    ctx.arc(b.x, b.y, 4, 0, Math.PI*2);
    ctx.fill();
  });

  // Zombies
  zombies.forEach(z=>{
    if(zombieImg.complete && zombieImg.naturalWidth !== 0){
        ctx.drawImage(zombieImg, z.x - z.size, z.y - z.size, z.size*2, z.size*2);
    } else {
        ctx.fillStyle='#ff4444';
        ctx.beginPath();
        ctx.arc(z.x, z.y, z.size, 0, Math.PI*2);
        ctx.fill();
    }
  });

  // Direction Text
  if(directionTimer>0){
    ctx.fillStyle='rgba(255,255,0,0.9)';
    ctx.font='bold 24px Arial';
    ctx.textAlign='center';
    let arrow = lastDirectionText==="TOP"?"↑" : lastDirectionText==="BOTTOM"?"↓" : lastDirectionText==="LEFT"?"←" : "→";
    ctx.fillText(`${arrow} ${lastDirectionText}`, canvas.width/2, 80);
  }
}

function loop(){
  if(!gameRunning) return;
  update();
  draw();
  animId = requestAnimationFrame(loop);
}

function startGame(){
  init();
  gameRunning=true;
  document.getElementById('start-screen').style.display='none';
  scoreEl.textContent=0;
  healthEl.textContent=100;
  spawnZombie();
  loop();
}

function endGame(){
  gameRunning=false;
  cancelAnimationFrame(animId);
  finalScoreEl.textContent=score;
  document.getElementById('end-screen').style.display='flex';
  playSound(80,'sawtooth',0.6,0.8);
  speak("Game Over");
}

startBtn.addEventListener('click', startGame);
document.getElementById('restart-btn')?.addEventListener('click', ()=>{
  document.getElementById('end-screen').style.display='none';
  document.getElementById('start-screen').style.display='flex';
});

window.addEventListener('keydown', e=>{ keys[e.key]=true; if(e.code==='Space') shoot(); });
window.addEventListener('keyup', e=>{ keys[e.key]=false; });

// Joystick
joystickZone.addEventListener('touchstart', e=>{
  joyActive=true;
  const r = joystickZone.getBoundingClientRect();
  const t = e.touches[0];
  const dx = t.clientX - (r.left+r.width/2);
  const dy = t.clientY - (r.top+r.height/2);
  const dist = Math.min(40, Math.hypot(dx,dy));
  const ang = Math.atan2(dy,dx);
  joyVec.x = Math.cos(ang)*dist/40;
  joyVec.y = Math.sin(ang)*dist/40;
  joystickStick.style.transform=`translate(${Math.cos(ang)*dist}px, ${Math.sin(ang)*dist}px)`;
});
joystickZone.addEventListener('touchmove', e=>{
  if(!joyActive) return;
  const r = joystickZone.getBoundingClientRect();
  const t = e.touches[0];
  const dx = t.clientX - (r.left+r.width/2);
  const dy = t.clientY - (r.top+r.height/2);
  const dist = Math.min(40, Math.hypot(dx,dy));
  const ang = Math.atan2(dy,dx);
  joyVec.x = Math.cos(ang)*dist/40;
  joyVec.y = Math.sin(ang)*dist/40;
  joystickStick.style.transform=`translate(${Math.cos(ang)*dist}px, ${Math.sin(ang)*dist}px)`;
});
joystickZone.addEventListener('touchend', ()=>{
  joyActive=false; joyVec={x:0,y:0};
  joystickStick.style.transform=`translate(0px, 0px)`;
});

shootBtn.addEventListener('touchstart', (e)=>{ e.preventDefault(); shoot(); });
shootBtn.addEventListener('click', shoot);
