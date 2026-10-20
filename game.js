const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('start-btn');
const scoreEl = document.getElementById('score');
const healthEl = document.getElementById('health');
const joystickZone = document.getElementById('joystick-zone');
const joystickStick = document.getElementById('joystick-stick');
const shootBtn = document.getElementById('shoot-btn');

const zombieImg = new Image();
zombieImg.src = 'zomby.jpeg';
const playerImg = new Image();
playerImg.src = 'player.jpeg';

let player, bullets, zombies, keys, score, health, gameRunning, animId;
let joyActive=false, joyVec={x:0,y:0};

function resize(){ canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', resize); resize();

function init(){
  player = { x: canvas.width/2, y: canvas.height/2, size: 18, speed: 3.5, angle: 0 };
  bullets=[]; zombies=[]; score=0; health=100; keys={};
  if(scoreEl) scoreEl.textContent=0;
  if(healthEl) healthEl.textContent=100;
}

function spawnZombie(){
  if(!gameRunning) return;
  const edge = Math.floor(Math.random()*4);
  let x,y;
  if(edge===0){x=Math.random()*canvas.width; y=-30;}
  if(edge===1){x=canvas.width+30; y=Math.random()*canvas.height;}
  if(edge===2){x=Math.random()*canvas.width; y=canvas.height+30;}
  if(edge===3){x=-30; y=Math.random()*canvas.height;}
  zombies.push({x,y,size:28, speed:0.8+Math.random()*0.5});
  setTimeout(spawnZombie, 2000);
}

function handleInput(){
  let moveX=0, moveY=0;
  if(keys['w']||keys['ArrowUp']) moveY=-1;
  if(keys['s']||keys['ArrowDown']) moveY=1;
  if(keys['a']||keys['ArrowLeft']) moveX=-1;
  if(keys['d']||keys['ArrowRight']) moveX=1;
  if(joyActive){ moveX=joyVec.x; moveY=joyVec.y; }
  if(moveX||moveY){
    const len = Math.hypot(moveX,moveY)||1;
    player.x += (moveX/len)*player.speed;
    player.y += (moveY/len)*player.speed;
    player.angle = Math.atan2(moveY,moveX);
  }
  player.x = Math.max(player.size, Math.min(canvas.width-player.size, player.x));
  player.y = Math.max(player.size, Math.min(canvas.height-player.size, player.y));
}

function shoot(){
  if(!gameRunning) return;
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
    if(Math.hypot(player.x-z.x, player.y-z.y) < player.size+z.size-5){
        zombies.splice(zi,1); health-=15;
        if(healthEl) healthEl.textContent=health;
        if(health<=0){ gameRunning=false; alert('Game Over! Score: '+score); location.reload(); }
    }
    bullets.forEach((b, bi)=>{
        if(Math.hypot(b.x-z.x, b.y-z.y) < z.size){
            zombies.splice(zi,1); bullets.splice(bi,1); score+=10;
            if(scoreEl) scoreEl.textContent=score;
        }
    });
  });
}

function draw(){
  ctx.clearRect(0,0,canvas.width, canvas.height);
  // Player
  ctx.save(); ctx.translate(player.x, player.y); ctx.rotate(player.angle);
  if(playerImg.complete && playerImg.naturalWidth>0){
    ctx.drawImage(playerImg, -player.size, -player.size, player.size*2.2, player.size*2.2);
  } else {
    ctx.fillStyle='#00ff88'; ctx.beginPath(); ctx.arc(0,0,player.size,0,Math.PI*2); ctx.fill();
  }
  ctx.restore();
  // Bullets
  ctx.fillStyle='#ffff00';
  bullets.forEach(b=>{ ctx.beginPath(); ctx.arc(b.x,b.y,4,0,Math.PI*2); ctx.fill(); });
  // Zombies
  zombies.forEach(z=>{
    if(zombieImg.complete && zombieImg.naturalWidth>0){
        ctx.drawImage(zombieImg, z.x-z.size, z.y-z.size, z.size*2, z.size*2);
    } else {
        ctx.fillStyle='#ff4444'; ctx.beginPath(); ctx.arc(z.x,z.y,z.size,0,Math.PI*2); ctx.fill();
    }
  });
}

function loop(){ if(!gameRunning) return; update(); draw(); animId=requestAnimationFrame(loop); }

function startGame(){
  init(); gameRunning=true;
  const ss=document.getElementById('start-screen'); if(ss) ss.style.display='none';
  spawnZombie(); loop();
}

if(startBtn) startBtn.addEventListener('click', startGame);
window.addEventListener('keydown', e=>{ keys[e.key]=true; if(e.code==='Space') shoot(); });
window.addEventListener('keyup', e=>{ keys[e.key]=false; });
if(joystickZone){
  joystickZone.addEventListener('touchstart', e=>{
    joyActive=true; const r=joystickZone.getBoundingClientRect(); const t=e.touches[0];
    const dx=t.clientX-(r.left+r.width/2), dy=t.clientY-(r.top+r.height/2);
    const d=Math.min(40,Math.hypot(dx,dy)), a=Math.atan2(dy,dx);
    joyVec.x=Math.cos(a)*d/40; joyVec.y=Math.sin(a)*d/40;
  });
  joystickZone.addEventListener('touchmove', e=>{
    if(!joyActive) return; const r=joystickZone.getBoundingClientRect(); const t=e.touches[0];
    const dx=t.clientX-(r.left+r.width/2), dy=t.clientY-(r.top+r.height/2);
    const d=Math.min(40,Math.hypot(dx,dy)), a=Math.atan2(dy,dx);
    joyVec.x=Math.cos(a)*d/40; joyVec.y=Math.sin(a)*d/40;
  });
  joystickZone.addEventListener('touchend', ()=>{ joyActive=false; joyVec={x:0,y:0}; });
}
if(shootBtn){ shootBtn.addEventListener('touchstart', e=>{e.preventDefault(); shoot();}); shootBtn.addEventListener('click', shoot); }
