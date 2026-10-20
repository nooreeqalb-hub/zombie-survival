const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('start-btn');
const scoreEl = document.getElementById('score');
const healthEl = document.getElementById('health');
const joystickZone = document.getElementById('joystick-zone');
const joystickStick = document.getElementById('joystick-stick');
const shootBtn = document.getElementById('shoot-btn');
const finalScoreEl = document.getElementById('final-score');

// --- Zombie Image ---
const zombieImg = new Image();
zombieImg.src = 'zombie.png';

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

// === V1 LIGHT BLIND SUPPORT ===
function vibrate(p){ try{ if('vibrate' in navigator) navigator.vibrate(p); }catch(e){} }
function speak(t){ try{ if('speechSynthesis' in window){ window.speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(t); u.rate=1.1; window.speechSynthesis.speak(u);} }catch(e){} }

let player, bullets, zombies, keys, score, health, gameRunning, animId;
let joyActive=false, joyVec={x:0,y:0};
let lastDirectionText = ""; // arrow ke liye
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
  
  // === BLIND + DIRECTION CUE ===
  lastDirectionText = dirText;
  directionTimer = 120; // 2 second tak dikhega
  playSound(220,'sawtooth',0.35,0.4, pan); // left/right sound
  vibrate(40);
  // Har 3rd zombie pe direction bole taaki spam na ho
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
    const ang=Math.atan2(player.y-z.y, player
