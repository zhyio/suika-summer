import './style.css';
import { GameEngine, FRUITS } from './engine.js';

const $=s=>document.querySelector(s), canvas=$('#gameCanvas'), ctx=canvas.getContext('2d'), nextCtx=$('#nextCanvas').getContext('2d');
let engine, running=false, paused=false, last=0, particles=[], audioOn=true, audio;
const panels={start:$('#startPanel'),pause:$('#pausePanel'),over:$('#gameOverPanel')};

function size(){ const r=canvas.getBoundingClientRect(), d=Math.min(devicePixelRatio,2); canvas.width=r.width*d;canvas.height=r.height*d;ctx.setTransform(d,0,0,d,0,0); if(engine)engine.resize(r.width,r.height); }
function drawFruit(c,b,scale=1){ const f=FRUITS[b.type],r=b.r*scale;c.save();c.translate(b.x,b.y);c.rotate(Math.sin(b.id||1)*.08);c.shadowColor='#68462d55';c.shadowBlur=6;c.shadowOffsetY=5;c.beginPath();c.arc(0,0,r,0,Math.PI*2);c.fillStyle=f.color;c.fill();c.lineWidth=Math.max(2,r*.06);c.strokeStyle='#273a30';c.stroke();c.globalAlpha=.22;c.beginPath();c.arc(-r*.24,-r*.25,r*.27,0,Math.PI*2);c.fillStyle='#fff';c.fill();c.globalAlpha=1;
  if(b.type===0){c.fillStyle=f.leaf;c.beginPath();c.ellipse(r*.05,-r*.93,r*.36,r*.16,-.5,0,Math.PI*2);c.fill()} if(b.type===1){c.fillStyle=f.leaf;for(let i=0;i<5;i++){c.rotate(Math.PI*2/5);c.beginPath();c.ellipse(0,-r*.83,r*.18,r*.36,0,0,Math.PI*2);c.fill()}} if(b.type===2){c.fillStyle='#bda7d1';for(let y=-.45;y<.5;y+=.32)for(let x=-.45;x<.5;x+=.32){c.beginPath();c.arc(x*r,y*r,r*.12,0,7);c.fill()}} if(b.type===4){c.strokeStyle='#fff7b5';c.lineWidth=2;c.beginPath();c.moveTo(-r*.65,0);c.quadraticCurveTo(0,-r*.2,r*.65,0);c.stroke()} if(b.type===8){c.strokeStyle='#8a6a30';c.lineWidth=2;for(let x=-.5;x<=.5;x+=.25){c.beginPath();c.moveTo(x*r,-r*.7);c.lineTo((x+.3)*r,r*.7);c.stroke()}} if(b.type>=9){c.strokeStyle='#d5df77';c.lineWidth=Math.max(2,r*.055);for(let x=-.5;x<=.5;x+=.25){c.beginPath();c.arc(x*r,0,r*.95,-1.2,1.2);c.stroke()}}
  c.fillStyle='#24352d';c.beginPath();c.arc(-r*.27,-r*.05,Math.max(2,r*.045),0,7);c.arc(r*.27,-r*.05,Math.max(2,r*.045),0,7);c.fill();c.strokeStyle='#24352d';c.lineWidth=2;c.beginPath();c.arc(0,r*.05,r*.18,.15,Math.PI-.15);c.stroke();c.restore(); }
function draw(){ const w=engine.width;ctx.clearRect(0,0,w,engine.height); if(running&&!paused&&!engine.over){const f=FRUITS[engine.current];ctx.save();ctx.setLineDash([5,7]);ctx.strokeStyle='#8b6c4c88';ctx.beginPath();ctx.moveTo(engine.dropX,0);ctx.lineTo(engine.dropX,65);ctx.stroke();ctx.restore();drawFruit(ctx,{type:engine.current,x:engine.dropX,y:35+f.r*.55,r:f.r*.7,id:2});} for(const b of engine.bodies)drawFruit(ctx,b); particles.forEach(p=>{ctx.globalAlpha=p.life;ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,4,4)});ctx.globalAlpha=1; }
function loop(t){const dt=Math.min((t-last)/1000,.025)||.016;last=t;if(running&&!paused){for(const e of engine.step(dt)){if(e.type==='merge'){burst(e.body);beep(350+e.body.type*55);updateScore()}if(e.type==='gameover')gameOver()}particles.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=300*dt;p.life-=dt});particles=particles.filter(p=>p.life>0)}draw();requestAnimationFrame(loop)}
function burst(b){for(let i=0;i<18;i++){const a=Math.PI*2*i/18;particles.push({x:b.x,y:b.y,vx:Math.cos(a)*(60+Math.random()*90),vy:Math.sin(a)*(60+Math.random()*90),life:.8,color:FRUITS[b.type].color})}}
function beep(freq){if(!audioOn)return;audio??=new AudioContext();const o=audio.createOscillator(),g=audio.createGain();o.frequency.value=freq;o.type='sine';g.gain.setValueAtTime(.08,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.16);o.connect(g).connect(audio.destination);o.start();o.stop(audio.currentTime+.16)}
function updateScore(){ $('#score').textContent=engine.score;const best=Math.max(engine.score,+(localStorage.suikaBest||0));$('#bestScore').textContent=best;localStorage.suikaBest=best;drawNext(); }
function drawNext(){nextCtx.clearRect(0,0,84,84);const f=FRUITS[engine.next];drawFruit(nextCtx,{type:engine.next,x:42,y:42,r:Math.min(f.r,31),id:3});}
function show(name){Object.entries(panels).forEach(([k,v])=>v.classList.toggle('show',k===name))}
function start(){engine.reset();running=true;paused=false;show('');$('#pauseBtn').disabled=false;$('#restartSmallBtn').disabled=false;updateScore();}
function gameOver(){running=false;$('#finalScore').textContent=engine.score;show('over');$('#pauseBtn').disabled=true;beep(140);}
function togglePause(){if(!running)return;paused=!paused;show(paused?'pause':'');$('#pauseBtn').textContent=paused?'▶ 继续':'Ⅱ 暂停'}
function aimEvent(e){const r=canvas.getBoundingClientRect(),x=('touches'in e?e.touches[0].clientX:e.clientX)-r.left;engine.aim(x)}
canvas.addEventListener('pointermove',aimEvent);canvas.addEventListener('pointerdown',e=>{if(running&&!paused){aimEvent(e);engine.drop();beep(210)}});
window.addEventListener('keydown',e=>{if(!running||paused)return;if(e.key==='ArrowLeft')engine.aim(engine.dropX-24);if(e.key==='ArrowRight')engine.aim(engine.dropX+24);if(e.code==='Space'){e.preventDefault();engine.drop();beep(210)}});
$('#startBtn').onclick=start;$('#restartBtn').onclick=start;$('#restartSmallBtn').onclick=start;$('#pauseBtn').onclick=togglePause;$('#resumeBtn').onclick=togglePause;
$('#soundBtn').onclick=()=>{audioOn=!audioOn;$('#soundBtn').textContent=audioOn?'♫':'×';$('#soundBtn').ariaLabel=audioOn?'关闭音效':'开启音效'};
$('#helpBtn').onclick=()=>$('#helpDialog').showModal();$('#closeHelp').onclick=$('#gotIt').onclick=()=>$('#helpDialog').close();
FRUITS.forEach((f,i)=>{const row=document.createElement('div');row.className='guide-row';row.innerHTML=`<span class="guide-dot" style="background:${f.color}">${i===10?'瓜':''}</span><span>${f.name}</span>`;$('#fruitGuide').append(row)});
engine=new GameEngine();size();updateScore();addEventListener('resize',size);requestAnimationFrame(loop);
