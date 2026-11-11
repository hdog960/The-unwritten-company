/** Six miniature-owned, manuscript-inlaid battle signatures. Visual-only.
 * The existing puppetPose is the sole clock: no false target, timer or HUD. */
import {attackBeat} from './combat-beats.js';
export const ACTION_SEALS=Object.freeze({
 captain:Object.freeze({kind:'guild-chevron',ink:'#edd8a6'}),
 brunna:Object.freeze({kind:'oath-rivets',ink:'#e9bb97'}),
 kess:Object.freeze({kind:'paired-leaves',ink:'#d0daa1'}),
 mirelle:Object.freeze({kind:'star-folio',ink:'#c9cfeb'}),
 briar:Object.freeze({kind:'thorn-crown',ink:'#d7c58f'}),
 shade:Object.freeze({kind:'empty-bell',ink:'#b3e4df'})
});
const limit=n=>Number.isFinite(n)?Math.max(0,Math.min(1,n)):0;
export function actionSealState(id,pose,fallen=false){
 if(fallen||!Object.hasOwn(ACTION_SEALS,id)||!['attack','ward'].includes(pose?.kind))return null;
 const p=limit(pose.progress);if(p<=0||p>=1)return null;
 const swing=pose.kind==='attack'?attackBeat(p).sweep:Math.sin(Math.PI*p)*.4;
 return Object.freeze({id,kind:pose.kind,pattern:ACTION_SEALS[id].kind,
   phase:pose.kind==='ward'?'guard':attackBeat(p).phase,
   backwards:swing<0,strength:Math.min(1,.28+Math.abs(swing)*.72)});
}
const stroke=(ctx,p,c,w)=>{
 ctx.beginPath();ctx.moveTo(...p[0]);for(const v of p.slice(1))ctx.lineTo(...v);
 ctx.strokeStyle=c;ctx.lineWidth=w;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke();
};
const rhombus=(ctx,x,y,r,c)=>{
 stroke(ctx,[[x,y-r],[x+r,y],[x,y+r],[x-r,y],[x,y-r]],c,1.1);
};
export function paintActionSeal(ctx,rect,id,pose,{fallen=false}={}){
 const state=actionSealState(id,pose,fallen);
 if(!ctx||!rect||!state)return false;
 const {x,y,width:s}=rect,cx=x+s*.5,cy=y+s*.76;
 const c=ACTION_SEALS[id].ink,p=(dx,dy)=>[cx+dx*s,cy+dy*s];
 const w=Math.max(.9,s*.026),z=state.backwards?-1:1;
 ctx.save();ctx.beginPath();ctx.rect(x+1,y+1,s-2,s-2);ctx.clip();
 ctx.globalAlpha=.30+state.strength*.43;
 ctx.beginPath();ctx.arc(cx,cy,s*.25,Math.PI*.12,Math.PI*.86);
 ctx.strokeStyle='#203a3f';ctx.lineWidth=w*1.2;ctx.stroke();
 ctx.beginPath();ctx.arc(cx,cy,s*.25,Math.PI*1.11,Math.PI*1.90);
 ctx.strokeStyle=c;ctx.lineWidth=w;ctx.stroke();
 if(id==='captain'){
  stroke(ctx,[p(-.15,.02),p(0,-.10),p(.15,.02)],c,w*1.25);
  stroke(ctx,[p(-.1,.07),p(0,-.01),p(.1,.07)],c,w);
  rhombus(ctx,cx,cy-s*.03,s*.034,c);
 }else if(id==='brunna'){
  stroke(ctx,[p(-.15,-.08),p(.15,-.08)],c,w*1.4);
  for(const dx of [-.10,0,.10]){
   ctx.beginPath();ctx.arc(cx+dx*s,cy+s*.04,Math.max(.9,s*.028),0,Math.PI*2);
   ctx.fillStyle=c;ctx.fill();
  }
  stroke(ctx,[p(-.09,.12),p(.09,.12)],c,w);
 }else if(id==='kess'){
  stroke(ctx,[p(-.045,.03),p(-.18,-.07),p(-.10,.09),p(-.045,.03)],c,w);
  stroke(ctx,[p(.045,.03),p(.18,-.07),p(.10,.09),p(.045,.03)],c,w);
 }else if(id==='mirelle'){
  rhombus(ctx,cx,cy,s*.13,c);
  stroke(ctx,[p(-.11,0),p(.11,0)],c,w);
  stroke(ctx,[p(0,-.11),p(0,.11)],c,w);
  ctx.beginPath();ctx.arc(cx,cy,s*.027,0,Math.PI*2);ctx.fillStyle=c;ctx.fill();
 }else if(id==='briar'){
  stroke(ctx,[p(-.18,.04),p(-.10,-.13),p(-.04,-.06),p(0,-.16)],c,w);
  stroke(ctx,[p(.18,.04),p(.10,-.13),p(.04,-.06),p(0,-.16)],c,w);
  stroke(ctx,[p(-.16,.04),p(-.1,.10),p(-.03,.07)],c,w*.8);
 }else{
  stroke(ctx,[p(-.13,-.09),p(-.09,.01),p(0,.105),p(.09,.01),p(.13,-.09)],c,w);
  stroke(ctx,[p(-.08,-.06),p(0,.02),p(.08,-.06)],c,w*.8);
  rhombus(ctx,cx+s*.16,cy,s*.024,c);
  rhombus(ctx,cx-s*.16,cy,s*.024,c);
 }
 stroke(ctx,[p(z*.19,.08),p(z*.21,.13)],c,w*.8);
 ctx.restore();return true;
}
