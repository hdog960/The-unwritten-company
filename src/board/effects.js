/** v0.09 original, terrain-clipped battle VFX. Pure drawing; no game logic or RNG. */
import {cellRect} from './geometry.js';
export const EFFECT_KINDS=Object.freeze(['hit','critical','miss','ward','move','enemy-phase']);
export const EFFECT_DURATION_MS=390;
export function isValidEffect(event){
  return !!event&&EFFECT_KINDS.includes(event.kind)&&typeof event.token==='string'&&event.token.length>0;
}
const clamp=p=>Math.max(0,Math.min(1,Number.isFinite(p)?p:0));
const center=(board,pos)=>{
  const r=pos?cellRect(board,pos.column,pos.row):null;
  return r?{x:r.x+r.width*.5,y:r.y+r.height*.5,s:r.width}:null;
};
function arc(ctx,cx,cy,r,from,to,color,width){
  ctx.beginPath();ctx.arc(cx,cy,r,from,to);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();
}
function rune(ctx,cx,cy,r,color){
  ctx.beginPath();
  for(let i=0;i<6;i++){const a=(Math.PI/3)*i-Math.PI/6;const x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r;if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);}
  ctx.closePath();ctx.strokeStyle=color;ctx.lineWidth=Math.max(1.5,r*.115);ctx.stroke();
}
function strike(ctx,board,mark,p){
  const from=center(board,mark.from),to=center(board,mark.to);
  if(!to)return;
  const s=to.s;
  const color=mark.kind==='critical'?'#ffe4a2':mark.kind==='miss'?'#a5d7e7':'#f7a688';
  if(from){
    ctx.beginPath();
    ctx.moveTo(from.x,from.y-s*.1);
    ctx.quadraticCurveTo((from.x+to.x)/2,to.y-s*.4,to.x,to.y);
    ctx.strokeStyle=color;ctx.lineWidth=Math.max(2.3,s*.08)*(1-p*.5);
    ctx.stroke();
  }
  if(mark.kind==='miss'){
    ctx.setLineDash([s*.14,s*.13]);
    arc(ctx,to.x,to.y,s*(.2+.21*p),0,Math.PI*2,color,Math.max(1.5,s*.052));
    ctx.setLineDash([]);
    return;
  }
  for(let i=0;i<(mark.kind==='critical'?9:6);i++){
    const angle=i*Math.PI*2/(mark.kind==='critical'?9:6)+.2;
    const inner=s*(.12+.07*p),outer=s*(.25+.17*p);
    ctx.beginPath();
    ctx.moveTo(to.x+Math.cos(angle)*inner,to.y+Math.sin(angle)*inner);
    ctx.lineTo(to.x+Math.cos(angle)*outer,to.y+Math.sin(angle)*outer);
    ctx.strokeStyle=color;ctx.lineWidth=Math.max(1.2,s*.039)*(1-p*.32);ctx.stroke();
  }
  arc(ctx,to.x,to.y,s*(.13+.22*p),-.6,Math.PI*.85,color,Math.max(2,s*.073)*(1-p*.5));
  if(mark.kind==='critical'){
    ctx.beginPath();
    for(let i=0;i<8;i++){
      const a=i*Math.PI/4;
      const r=s*(i%2===0?.21:.09)*(1+p*.6);
      const x=to.x+Math.cos(a)*r,y=to.y+Math.sin(a)*r;
      if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);
    }
    ctx.closePath();ctx.strokeStyle='#fff3cc';ctx.lineWidth=1.6;ctx.stroke();
  }
}
function ward(ctx,board,mark,p){
  const to=center(board,mark.to);
  if(!to)return;
  const r=to.s*(.26+.1*p);
  rune(ctx,to.x,to.y,r,'#b7f6de');
  rune(ctx,to.x,to.y,r*.7,'#c6c4ed');
  arc(ctx,to.x,to.y,r*.85,-.8,1.9,'#e8d8a4',Math.max(1.8,to.s*.038));
}
function movement(ctx,board,mark,p){
  const a=center(board,mark.from),b=center(board,mark.to);
  if(!a||!b)return;
  ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);
  ctx.setLineDash([Math.max(2,a.s*.11),Math.max(2,a.s*.08)]);
  ctx.lineWidth=Math.max(2,a.s*.05);ctx.strokeStyle='#b9f1d5';ctx.stroke();ctx.setLineDash([]);
  arc(ctx,b.x,b.y,b.s*(.12+.18*p),0,Math.PI*2,'#d6e8b3',Math.max(1.6,b.s*.035));
}
export function drawWorldEffect(ctx,board,frame){
  if(!ctx||!board||!isValidEffect(frame?.event))return false;
  const p=clamp(frame.progress);
  ctx.save();
  ctx.beginPath();ctx.rect(board.x,board.y,board.mapWidth,board.mapHeight);ctx.clip();
  ctx.globalAlpha=.95*(1-p*.88);
  const marks=frame.event.kind==='enemy-phase'?frame.event.marks??[]:[frame.event];
  for(const mark of marks){
    if(mark.kind==='ward')ward(ctx,board,mark,p);
    else if(mark.kind==='move')movement(ctx,board,mark,p);
    else strike(ctx,board,mark,p);
  }
  ctx.restore();return true;
}
