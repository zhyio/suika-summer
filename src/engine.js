export const FRUITS = [
  { name:'樱桃', r:15, color:'#e83f43', leaf:'#38865a', score:2 },
  { name:'草莓', r:20, color:'#f2545b', leaf:'#477c3b', score:4 },
  { name:'葡萄', r:26, color:'#8165a8', leaf:'#416f50', score:8 },
  { name:'橘子', r:33, color:'#f7923b', leaf:'#4b8b50', score:16 },
  { name:'柠檬', r:40, color:'#f5cf45', leaf:'#639548', score:32 },
  { name:'苹果', r:48, color:'#e84b3c', leaf:'#46794d', score:64 },
  { name:'梨子', r:57, color:'#b9cf57', leaf:'#477a45', score:128 },
  { name:'桃子', r:67, color:'#f59a84', leaf:'#47865e', score:256 },
  { name:'菠萝', r:78, color:'#e8ae38', leaf:'#43835d', score:512 },
  { name:'哈密瓜', r:90, color:'#adc85a', leaf:'#467e52', score:1024 },
  { name:'大西瓜', r:104, color:'#438b59', leaf:'#245f43', score:2048 }
];

export class GameEngine {
  constructor(width=480,height=680, random=Math.random){ this.width=width; this.height=height; this.random=random; this.reset(); }
  reset(){ this.bodies=[]; this.score=0; this.next=this.randomFruit(); this.current=this.randomFruit(); this.dropX=this.width/2; this.canDrop=true; this.over=false; this.dangerTime=0; this.id=0; }
  randomFruit(){ return Math.floor(this.random()*5); }
  resize(w,h){ const sx=w/this.width, sy=h/this.height; this.bodies.forEach(b=>{b.x*=sx;b.y*=sy;b.vx*=sx;b.vy*=sy}); this.dropX*=sx; this.width=w;this.height=h; }
  aim(x){ const r=FRUITS[this.current].r; this.dropX=Math.max(r+5,Math.min(this.width-r-5,x)); }
  drop(){ if(!this.canDrop||this.over)return null; const r=FRUITS[this.current].r; const b={id:++this.id,type:this.current,x:this.dropX,y:42+r,vx:0,vy:0,r,age:0,merged:false}; this.bodies.push(b); this.current=this.next; this.next=this.randomFruit(); this.canDrop=false; return b; }
  step(dt){
    if(this.over)return []; const events=[]; const g=1250;
    for(const b of this.bodies){ b.age+=dt;b.vy+=g*dt;b.x+=b.vx*dt;b.y+=b.vy*dt;b.vx*=0.994; b.vy*=0.998; if(b.x-b.r<4){b.x=b.r+4;b.vx=Math.abs(b.vx)*.55} if(b.x+b.r>this.width-4){b.x=this.width-b.r-4;b.vx=-Math.abs(b.vx)*.55} if(b.y+b.r>this.height-5){b.y=this.height-b.r-5;b.vy=-Math.abs(b.vy)*.28;b.vx*=.93} }
    for(let pass=0;pass<3;pass++) for(let i=0;i<this.bodies.length;i++) for(let j=i+1;j<this.bodies.length;j++){
      const a=this.bodies[i],b=this.bodies[j]; if(a.merged||b.merged)continue; const dx=b.x-a.x,dy=b.y-a.y,dist=Math.hypot(dx,dy)||.01,min=a.r+b.r;
      if(dist<min){ if(a.type===b.type && a.type<FRUITS.length-1 && a.age>.08 && b.age>.08){ const type=a.type+1; a.merged=b.merged=true; const n={id:++this.id,type,x:(a.x+b.x)/2,y:(a.y+b.y)/2,vx:(a.vx+b.vx)/2,vy:Math.min((a.vy+b.vy)/2,-100),r:FRUITS[type].r,age:0,merged:false}; this.score+=FRUITS[type].score;events.push({type:'merge',body:n,score:FRUITS[type].score});this.bodies.push(n); }
        else { const nx=dx/dist,ny=dy/dist,overlap=min-dist, total=a.r+b.r; a.x-=nx*overlap*(b.r/total);a.y-=ny*overlap*(b.r/total);b.x+=nx*overlap*(a.r/total);b.y+=ny*overlap*(a.r/total); const rel=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;if(rel<0){const impulse=-rel*.48;a.vx-=impulse*nx;b.vx+=impulse*nx;a.vy-=impulse*ny;b.vy+=impulse*ny;} }
      }
    }
    this.bodies=this.bodies.filter(b=>!b.merged);
    if(!this.canDrop && this.bodies.every(b=>b.age>.42))this.canDrop=true;
    const danger=this.bodies.some(b=>b.age>1 && b.y-b.r<112 && Math.hypot(b.vx,b.vy)<80); this.dangerTime=danger?this.dangerTime+dt:Math.max(0,this.dangerTime-dt*2); if(this.dangerTime>2.2){this.over=true;events.push({type:'gameover'});} return events;
  }
}
