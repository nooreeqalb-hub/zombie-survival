const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('start-btn');
const menuScreen = document.getElementById('menu-screen');
const gameScreen = document.getElementById('game-screen');
const scoreEl = document.getElementById('score');
const healthEl = document.getElementById('health');
const joystickZone = document.getElementById('joystick-zone');
const joystickStick = document.getElementById('joystick-stick');
const shootBtn = document.getElementById('shoot-btn');

let audioCtx;
function playSound(freq, type, vol, duration){
  try{
    if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.value = vol;
    o.connect(g); g.connect(audioCtx.destination);
    o.start(); g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    o.stop(audioCtx.currentTime + duration);
  }catch(e){}
}

let player, bullets, zombies, keys, score, health, gameRunning, animId;
let joyActive=false, joyVec={x:0,y:0};

function resize(){ canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', resize); resize();

function init(){
  // HUMAN PLAYER with SMG
  player = { x: canvas.width/2, y: canvas.height/2, size: 18, speed: 3.5, angle: 0, type: "Human" };
  bullets=[]; zombies=[]; score=0; health=100;
  keys={};
}

function spawnZombie(){
  if(!gameRunning) return;
  if(zombies.length >= 5) { // Bheed nahi hogi
    setTimeout(spawnZombie, 2000);
    return;
  }
  const edge = Math.floor(Math.random()*4);
  let x,y;
  if(edge===0){x=Math.random()*canvas.width; y=-30;}
  if(edge===1){x=canvas.width+30; y=Math.random()*canvas.height;}
  if(edge===2){x=Math.random()*canvas.width; y=canvas.height+30;}
  if(edge===3){x=-30; y=Math.random()*canvas.height;}
  
  // SPEED KAM KI - pehle 0.7-2.2 thi, ab 0.3-0.7
  zombies.push({x,y,size:20+Math.random()*8, speed:0.35+Math.random()*0.4+score*0.005});
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
  // SMG - 3 bullets spread
  bullets.push({x:player.x, y:player.y, vx:Math.cos(player.angle)*10, vy:Math.sin(player.angle)*10});
}

function update(){
  handleInput();
  bullets.forEach((b,i)=>{
    b.x+=b.vx; b.y+=b.vy;
    if(b.x<0||b.x>canvas.width||b.y<0||b.y>canvas.height) bullets.splice(i,1);
  });
  zombies.forEach((z, zi)=>{
    const ang=Math.atan2(player.y-z.y, player.x-z.x);
    z.x+=Math.cos(ang)*z.speed; z.y+=Math.sin(ang)*z.speed;
    if(Math.hypot(z.x-player.x, z.y-player.y) < z.size+player.size){
      zombies.splice(zi,1); health-=10; playSound(120,'sawtooth',0.4,0.3);
      if(health<=0) gameOver();
    }
    bullets.forEach((b, bi)=>{
      if(Math.hypot(z.x-b.x, z.y-b.y) < z.size+8){
        zombies.splice(zi,1); bullets.splice(bi,1);
        score+=10; playSound(900,'sine',0.3,0.15);
      }
    });
  });
  scoreEl.textContent='Score: '+score+' | HUMAN';
  healthEl.textContent='Health: '+health;
}

function draw(){
  ctx.fillStyle='#111'; ctx.fillRect(0,0,canvas.width,canvas.height);
  
  // PLAYER - HUMAN with SMG GUN
  ctx.save(); 
  ctx.translate(player.x, player.y); 
  ctx.rotate(player.angle);
  // Human Body
  ctx.fillStyle='#00ffcc'; 
  ctx.fillRect(-player.size, -player.size/2, player.size*2, player.size);
  // SMG Gun
  ctx.fillStyle='#555'; 
  ctx.fillRect(player.size, -4, 18, 8);
  ctx.fillStyle='#222';
  ctx.fillRect(player.size+14, -2, 12, 4);
  // Human Head
  ctx.fillStyle='#ffdbac';
  ctx.beginPath(); ctx.arc(-player.size+5, 0, 7, 0, Math.PI*2); ctx.fill();
  ctx.restore();
  
  // ZOMBIES - No Balls, Only Zombies
  zombies.forEach(z=>{
    ctx.fillStyle='#aa0000';
    ctx.fillRect(z.x-z.size/2, z.y-z.size/2, z.size, z.size);
    // Zombie eyes
    ctx.fillStyle='#00ff00';
    ctx.fillRect(z.x-6, z.y-6, 4, 4);
    ctx.fillRect(z.x+2, z.y-6, 4, 4);
    // Arms
    ctx.fillStyle='#660000';
    ctx.fillRect(z.x-z.size/2-4, z.y, 4, 10);
    ctx.fillRect(z.x+z.size/2, z.y, 4, 10);
  });

  ctx.fillStyle='#ffff00'; 
  bullets.forEach(b=>{
    ctx.beginPath(); ctx.arc(b.x,b.y,5,0,Math.PI*2); ctx.fill();
  });

  // CHOTA MAP - Top Right
  drawMiniMap();
}

function drawMiniMap(){
  const mapSize=90, mapX=canvas.width-mapSize-15, mapY=50;
  ctx.fillStyle='rgba(0,0,0,0.7)';
  ctx.fillRect(mapX, mapY, mapSize, mapSize);
  ctx.strokeStyle='#00ff00'; ctx.lineWidth=2;
  ctx.strokeRect(mapX, mapY, mapSize, mapSize);
  
  // Player dot in map
  ctx.fillStyle='#00ffcc';
  ctx.fillRect(mapX + (player.x/canvas.width)*mapSize, mapY + (player.y/canvas.height)*mapSize, 5, 5);
  // Zombies dot
  ctx.fillStyle='#ff0000';
  zombies.forEach(z=>{
    ctx.fillRect(mapX + (z.x/canvas.width)*mapSize, mapY + (z.y/canvas.height)*mapSize, 3, 3);
  });
  ctx.fillStyle='#fff'; ctx.font='9px Arial';
  ctx.fillText('MAP', mapX+5, mapY+8);
}

function loop(){ if(!gameRunning) return; update(); draw(); animId=requestAnimationFrame(loop); }

function gameOver(){
  gameRunning=false; cancelAnimationFrame(animId);
  playSound(80,'sawtooth',0.5,0.8);
  alert('GAME OVER! You survived as Human! Score: '+score); 
  gameScreen.style.display='none'; menuScreen.style.display='flex';
}

startBtn.addEventListener('click', ()=>{
  menuScreen.style.display='none'; gameScreen.style.display='block';
  resize(); init(); gameRunning=true; loop(); spawnZombie();
  if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
});

window.addEventListener('keydown', e=>{keys[e.key]=true; if(e.code==='Space') shoot();});
window.addEventListener('keyup', e=>{keys[e.key]=false;});
shootBtn.addEventListener('touchstart', e=>{e.preventDefault(); shoot();});
shootBtn.addEventListener('mousedown', shoot);

// Joystick - Bada kiya 140px ke hisab se
joystickZone.addEventListener('touchstart', e=>{
  joyActive=true; handleJoy(e.touches[0]);
},{passive:false});
joystickZone.addEventListener('touchmove', e=>{
  e.preventDefault(); handleJoy(e.touches[0]);
},{passive:false});
function endJoy(){ joyActive=false; joyVec={x:0,y:0}; joystickStick.style.left='40px'; joystickStick.style.top='40px'; }
joystickZone.addEventListener('touchend', endJoy);
joystickZone.addEventListener('touchcancel', endJoy);

function handleJoy(t){
  const rect=joystickZone.getBoundingClientRect();
  const cx=rect.left+rect.width/2, cy=rect.top+rect.height/2;
  let dx=t.clientX-cx, dy=t.clientY-cy;
  const dist=Math.hypot(dx,dy), max=55;
  if(dist>max){ dx=dx/dist*max; dy=dy/dist*max; }
  joystickStick.style.left=40+dx+'px'; 
  joystickStick.style.top=40+dy+'px';
  joyVec.x=dx/max; joyVec.y=dy/max;
  if(Math.hypot(joyVec.x,joyVec.y)>0.15) player.angle=Math.atan2(joyVec.y,joyVec.x);
}
