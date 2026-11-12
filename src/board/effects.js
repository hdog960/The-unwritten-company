/** The Illuminated Table / Gate A revision.
 * Hand-inked anticipation → travel → impact → recovery; purely presentational.
 * No time-based damage, gameplay RNG, network assets or overlaid UI text.
 */
import {cellRect} from './geometry.js';
import {visibleMarks} from './choreography.js';
import {paintImpactFragments} from './impact-fragments.js';
import {paintCombatScript} from './combat-script.js';
export const EFFECT_KINDS=Object.freeze(['hit','critical','miss','ward','move','enemy-phase']);
export const EFFECT_DURATION_MS=490;
export function isValidEffect(event){
  return !!event&&EFFECT_KINDS.includes(event.kind)&&typeof event.token==='string'&&event.token.length>0;
}
const clamp=x=>Math.max(0,Math.min(1,Number.isFinite(x)?x:0));
const center=(board,pos)=>{
  const r=pos?cellRect(board,pos.column,pos.row):null;
  return r?{x:r.x+r.width*.5,y:r.y+r.height*.5,s:r.width}:null;
};
const mix=(a,b,t)=>a+(b-a)*clamp(t);
const ease=t=>{const x=clamp(t);return x*x*(3-2*x);};
function ring(ctx,cx,cy,r,from,to,color,width){
  ctx.beginPath();ctx.arc(cx,cy,Math.max(1,r),from,to);
  ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();
}
function glyph(ctx,x,y,r,color,sides=6){
  ctx.beginPath();
  for(let i=0;i<sides;i++){
    const a=Math.PI*2*i/sides-Math.PI/6;
    const p=[x+Math.cos(a)*r,y+Math.sin(a)*r];
    if(i)ctx.lineTo(...p);else ctx.moveTo(...p);
  }
  ctx.closePath();ctx.strokeStyle=color;ctx.lineWidth=Math.max(1,r*.105);ctx.stroke();
}
function flash(ctx,x,y,s,p,kind){
  const color=kind==='critical'?'#ffedb3':kind==='miss'?'#9fe2e6':'#fac09c';
  const rays=kind==='critical'?10:kind==='miss'?4:7;
  for(let i=0;i<rays;i++){
    const a=Math.PI*2*i/rays+.13;
    const small=s*(.1+.07*p),large=s*(.2+.23*p);
    ctx.beginPath();
    ctx.moveTo(x+Math.cos(a)*small,y+Math.sin(a)*small);
    ctx.lineTo(x+Math.cos(a)*large,y+Math.sin(a)*large);
    ctx.strokeStyle=color;ctx.lineWidth=Math.max(1,s*.038)*(1-p*.48);ctx.stroke();
  }
  ring(ctx,x,y,s*(.12+.24*p),-.6,Math.PI*1.7,color,Math.max(1.5,s*.068)*(1-p*.58));
  if(kind==='critical')glyph(ctx,x,y,s*(.17+.18*p),'#fff6d3',8);
  if(kind==='miss'){
    ctx.setLineDash([s*.09,s*.075]);
    ring(ctx,x,y,s*(.3+.15*p),0,Math.PI*2,'#9fbfd5',Math.max(1,s*.028));
    ctx.setLineDash([]);
  }
}
function channel(ctx,board,mark,p){
  const origin=center(board,mark.from),dest=center(board,mark.to);
  if(!dest)return;
  const s=dest.s;
  const windup=clamp(p/.26),travel=clamp((p-.2)/.42),impact=clamp((p-.58)/.42);
  const shade=mark.kind==='miss'?'#a5dce2':mark.kind==='critical'?'#ffe4ac':mark.skillId==='sigil'?'#e8d29b':mark.skillId==='spark'?'#9adcd2':'#efa684';
  if(origin&&windup<1){
    ctx.globalAlpha=.7*(1-windup);
    glyph(ctx,origin.x,origin.y-s*.06,s*(.13+.15*windup),shade,mark.skillId==='sigil'?4:6);
    ring(ctx,origin.x,origin.y,s*(.2+.12*windup),-.8,2.1,shade,Math.max(1.3,s*.028));
    ctx.globalAlpha=1;
  }
  if(origin&&p>.15&&p<.76){
    const head=ease(travel),tx=mix(origin.x,dest.x,head),ty=mix(origin.y,dest.y,head);
    const mx=mix(origin.x,dest.x,Math.max(0,head-.21));
    const my=mix(origin.y,dest.y,Math.max(0,head-.21))-s*.04*Math.sin(Math.PI*head);
    ctx.beginPath();ctx.moveTo(mx,my);ctx.lineTo(tx,ty);
    ctx.strokeStyle=shade;ctx.lineWidth=Math.max(2,s*(mark.skillId==='strike'?.095:.07));
    ctx.lineCap='round';ctx.stroke();
    ctx.beginPath();ctx.arc(tx,ty,s*(.045+head*.035),0,Math.PI*2);
    ctx.fillStyle='#fff3d1';ctx.fill();
    // Original four-way spell paper cutouts travel with the actual projectile.
    paintCombatScript(ctx,{x:tx,y:ty,s},mark,travel,'flight');
  }
  if(p>.46){
    ctx.globalAlpha=1-.18*impact;
    flash(ctx,dest.x,dest.y,s,impact,mark.kind);
    // Real impact provenance only; a miss shows a broken, non-contact nib.
    paintCombatScript(ctx,{x:dest.x,y:dest.y,s},mark,impact,'impact');
    // Tiny physical paper flecks trail the actual impact window, never the windup.
    if(impact>0)paintImpactFragments(ctx,board,mark,impact);
    if(mark.skillId==='sigil'&&mark.kind!=='miss'){
      glyph(ctx,dest.x,dest.y,s*(.19+.18*impact),'#ecdaa3',4);
      glyph(ctx,dest.x,dest.y,s*(.11+.15*impact),'#b6e5d3',4);
    }
  }
}
function ward(ctx,board,mark,p){
  const to=center(board,mark.to);
  if(!to)return;
  const r=to.s*(.23+.17*ease(p));
  ctx.globalAlpha=1-p*.65;
  glyph(ctx,to.x,to.y,r,'#b8e9df',6);
  glyph(ctx,to.x,to.y,r*.73,'#d2bee3',6);
  ring(ctx,to.x,to.y,r*.85,-.9,2.1,'#fff2cd',Math.max(1.7,to.s*.055));
  // Glowing enamel shield motif; world-space and no text.
  ctx.beginPath();ctx.moveTo(to.x,to.y-r*.5);
  ctx.lineTo(to.x+r*.38,to.y-r*.13);ctx.lineTo(to.x+r*.26,to.y+r*.35);
  ctx.lineTo(to.x,to.y+r*.58);ctx.lineTo(to.x-r*.26,to.y+r*.35);
  ctx.lineTo(to.x-r*.38,to.y-r*.13);ctx.closePath();
  ctx.strokeStyle='#f2d6a7';ctx.lineWidth=Math.max(1,to.s*.026);ctx.stroke();
  ctx.globalAlpha=1;
}
function movement(ctx,board,mark,p){
  const path=(mark.path?.length>1?mark.path:[mark.from,mark.to]).map(at=>center(board,at)).filter(Boolean);
  if(path.length<2)return;
  const eased=ease(p);
  const total=path.length-1,f=eased*total;
  const idx=Math.min(total-1,Math.floor(f)),t=f-idx;
  const a=path[idx],b=path[idx+1];
  const px=mix(a.x,b.x,t),py=mix(a.y,b.y,t);
  ctx.setLineDash([Math.max(2,a.s*.075),Math.max(2,a.s*.085)]);
  ctx.beginPath();ctx.moveTo(path[0].x,path[0].y);
  for(let i=1;i<=idx;i++)ctx.lineTo(path[i].x,path[i].y);
  ctx.lineTo(px,py);
  ctx.strokeStyle='#b6ebca';ctx.lineWidth=Math.max(1.7,a.s*.055);ctx.stroke();
  ctx.setLineDash([]);
  ring(ctx,px,py,a.s*(.09+.08*Math.sin(Math.PI*eased)),0,Math.PI*2,'#f0e5b7',Math.max(1.5,a.s*.034));
  if(eased>.67)ring(ctx,b.x,b.y,b.s*(.08+.17*eased),-.5,2.8,'#a0dbca',Math.max(1.3,a.s*.034));
}
export function drawWorldEffect(ctx,board,frame){
  if(!ctx||!board||!isValidEffect(frame?.event))return false;
  ctx.save();ctx.beginPath();ctx.rect(board.x,board.y,board.mapWidth,board.mapHeight);ctx.clip();
  // The exact same mark timing drives physical miniature anticipation AND
  // its world-native projectile/impact: no phantom shots from the second foe
  // at frame zero or lingering completed enemy effects.
  for(const {mark,progress:local,visible} of visibleMarks(frame)){
    if(!visible)continue;
    ctx.save();ctx.globalAlpha=.98*(1-.1*local);
    if(mark.kind==='ward')ward(ctx,board,mark,local);
    else if(mark.kind==='move')movement(ctx,board,mark,local);
    else if(['hit','critical','miss'].includes(mark.kind))channel(ctx,board,mark,local);
    ctx.restore();
  }
  ctx.restore();return true;
}
