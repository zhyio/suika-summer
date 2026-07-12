import './style.css';
import { GameEngine, FRUITS } from './engine.js';

const $=s=>document.querySelector(s),canvas=$('#gameCanvas'),ctx=canvas.getContext('2d'),nextCtx=$('#nextCanvas').getContext('2d');
const panels={start:$('#startPanel'),pause:$('#pausePanel'),over:$('#gameOverPanel')};
const files=['cherry','strawberry','grapes','orange','lemon','apple','pear','peach','pineapple','cantaloupe','watermelon'];
const images=files.map(name=>{const img=new Image();img.src=`${import.meta.env.BASE_URL}fruits/${name}.png`;return img});
const keys={left:false,right:false};
let engine,running=false,paused=false,last=0,particles=[],effects=[],audioOn=true,audio,shake=0;

function size(){const r=canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio,2);canvas.width=r.width*d;canvas.height=r.height*d;ctx.setTransform(d,0,0,d,0,0);if(engine)engine.resize(r.width,r.height)}
function fallback(c,b,r){const f=FRUITS[b.type];c.beginPath();c.arc(0,0,r,0,Math.PI*2);c.fillStyle=f.color;c.fill();c.lineWidth=Math.max(2,r*.06);c.strokeStyle='#273a30';c.stroke()}
function drawFruit(c,b,scale=1){const r=b.r*scale,img=images[b.type];c.save();c.translate(b.x,b.y);c.rotate(Math.sin(b.id||1)*.08);c.shadowColor='#4b301f66';c.shadowBlur=Math.max(4,r*.14);c.shadowOffsetY=Math.max(3,r*.09);if(img.complete&&img.naturalWidth){const s=r*2.4;c.drawImage(img,-s/2,-s/2,s,s)}else fallback(c,b,r);c.restore()}
function draw(){ctx.clearRect(0,0,engine.width,engine.height);ctx.save();if(shake>0)ctx.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);if(running&&!paused&&!engine.over){const f=FRUITS[engine.current];ctx.save();ctx.setLineDash([5,7]);ctx.strokeStyle='#8b6c4c88';ctx.beginPath();ctx.moveTo(engine.dropX,0);ctx.lineTo(engine.dropX,65);ctx.stroke();ctx.restore();drawFruit(ctx,{type:engine.current,x:engine.dropX,y:35+f.r*.55,r:f.r*.7,id:2})}for(const b of engine.bodies){const fx=effects.find(e=>e.bodyId===b.id);drawFruit(ctx,b,fx?1+Math.sin(fx.life*20)*fx.life*.14:1)}effects.forEach(e=>{const p=1-e.life/e.max;ctx.globalAlpha=e.life/e.max;ctx.strokeStyle=e.color;ctx.lineWidth=7*(1-p)+1;ctx.beginPath();ctx.arc(e.x,e.y,e.r*(.3+p*1.25),0,Math.PI*2);ctx.stroke();ctx.globalAlpha=.12*(1-p);ctx.fillStyle=e.color;ctx.beginPath();ctx.arc(e.x,e.y,e.r*(1-p*.4),0,Math.PI*2);ctx.fill()});particles.forEach(p=>{ctx.globalAlpha=Math.max(0,p.life/p.max);ctx.fillStyle=p.color;ctx.beginPath();p.kind==='drop'?ctx.ellipse(p.x,p.y,p.size*.6,p.size,Math.atan2(p.vy,p.vx)+Math.PI/2,0,Math.PI*2):ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill()});ctx.globalAlpha=1;ctx.restore()}
function loop(t){const dt=Math.min((t-last)/1000,.025)||.016;last=t;if(running&&!paused){const dir=(keys.right?1:0)-(keys.left?1:0);if(dir){engine.aim(engine.dropX+dir*280*dt);syncSlider()}for(const e of engine.step(dt)){if(e.type==='merge'){burst(e.body);beep(350+e.body.type*55);updateScore()}if(e.type==='gameover')gameOver()}particles.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=430*dt;p.vx*=.99;p.life-=dt});particles=particles.filter(p=>p.life>0);effects.forEach(e=>e.life-=dt);effects=effects.filter(e=>e.life>0);shake=Math.max(0,shake-38*dt)}draw();requestAnimationFrame(loop)}
function burst(b){const f=FRUITS[b.type];effects.push({x:b.x,y:b.y,r:b.r*1.25,life:.55,max:.55,color:f.color,bodyId:b.id});shake=Math.min(10,3+b.type*.65);for(let i=0;i<30;i++){const a=Math.random()*Math.PI*2,speed=55+Math.random()*(130+b.type*7),life=.45+Math.random()*.55;particles.push({kind:i%4?'drop':'pulp',x:b.x+Math.cos(a)*b.r*.25,y:b.y+Math.sin(a)*b.r*.25,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed-55,life,max:life,size:2+Math.random()*4,color:i%3?f.color:'#fff0b0'})}}
function beep(freq){if(!audioOn)return;audio??=new AudioContext();const o=audio.createOscillator(),g=audio.createGain();o.frequency.value=freq;o.type='sine';g.gain.setValueAtTime(.08,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.16);o.connect(g).connect(audio.destination);o.start();o.stop(audio.currentTime+.16)}
function updateScore(){$('#score').textContent=engine.score;const best=Math.max(engine.score,+(localStorage.suikaBest||0));$('#bestScore').textContent=best;localStorage.suikaBest=best;drawNext()}
function drawNext(){nextCtx.clearRect(0,0,84,84);const f=FRUITS[engine.next];drawFruit(nextCtx,{type:engine.next,x:42,y:42,r:Math.min(f.r,31),id:3})}
function show(name){Object.entries(panels).forEach(([k,v])=>v.classList.toggle('show',k===name))}
function syncSlider(){$('#aimSlider').value=Math.round(engine.dropX/engine.width*1000)}
function start(){engine.reset();running=true;paused=false;particles=[];effects=[];show('');$('#pauseBtn').disabled=false;$('#restartSmallBtn').disabled=false;$('#aimSlider').disabled=false;syncSlider();updateScore()}
function gameOver(){running=false;$('#finalScore').textContent=engine.score;show('over');$('#pauseBtn').disabled=true;$('#aimSlider').disabled=true;beep(140)}
function togglePause(){if(!running)return;paused=!paused;show(paused?'pause':'');$('#pauseBtn').textContent=paused?'▶ 继续':'Ⅱ 暂停'}
function aimEvent(e){const r=canvas.getBoundingClientRect(),x=e.clientX-r.left;engine.aim(x);syncSlider()}
canvas.addEventListener('pointermove',aimEvent);canvas.addEventListener('pointerdown',e=>{if(running&&!paused){aimEvent(e);engine.drop();beep(210)}});
window.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'){keys.left=true;e.preventDefault()}if(e.key==='ArrowRight'){keys.right=true;e.preventDefault()}if(running&&!paused&&e.code==='Space'&&!e.repeat){e.preventDefault();engine.drop();beep(210)}});
window.addEventListener('keyup',e=>{if(e.key==='ArrowLeft')keys.left=false;if(e.key==='ArrowRight')keys.right=false});window.addEventListener('blur',()=>{keys.left=keys.right=false});
$('#aimSlider').addEventListener('input',e=>{if(engine)engine.aim(engine.width*(+e.target.value/1000))});$('#aimSlider').disabled=true;
$('#startBtn').onclick=start;$('#restartBtn').onclick=start;$('#restartSmallBtn').onclick=start;$('#pauseBtn').onclick=togglePause;$('#resumeBtn').onclick=togglePause;
$('#soundBtn').onclick=()=>{audioOn=!audioOn;$('#soundBtn').textContent=audioOn?'♫':'×';$('#soundBtn').ariaLabel=audioOn?'关闭音效':'开启音效'};
$('#helpBtn').onclick=()=>$('#helpDialog').showModal();$('#closeHelp').onclick=$('#gotIt').onclick=()=>$('#helpDialog').close();
FRUITS.forEach((f,i)=>{const row=document.createElement('div');row.className='guide-row';row.innerHTML=`<img src="${images[i].src}" alt=""><span>${f.name}</span>`;$('#fruitGuide').append(row)});
engine=new GameEngine();size();updateScore();addEventListener('resize',size);images.forEach(img=>img.addEventListener('load',()=>{draw();drawNext()}));requestAnimationFrame(loop);
