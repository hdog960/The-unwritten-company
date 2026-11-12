/** Light-facing, cut-paper shadow folds from the six ORIGINAL miniatures.
 * These stay below figure art; a real action pose bends the printed shadow,
 * while the pedestal and combat hitbox remain at authoritative coordinates.
 */
import {attackBeat} from './combat-beats.js';
export const PUPPET_FOLDS=Object.freeze({
  captain:Object.freeze([[.40,.75],[.56,.69],[.61,.61],[.79,.53],[.84,.57],[.77,.71],[.60,.83]]),
  brunna:Object.freeze([[.32,.75],[.49,.64],[.64,.60],[.80,.64],[.86,.77],[.67,.84],[.47,.83]]),
  kess:Object.freeze([[.42,.75],[.55,.67],[.62,.51],[.71,.49],[.78,.61],[.72,.76],[.59,.83]]),
  mirelle:Object.freeze([[.38,.76],[.51,.69],[.64,.49],[.79,.58],[.76,.71],[.68,.83],[.49,.84]]),
  briar:Object.freeze([[.31,.74],[.48,.63],[.55,.53],[.65,.62],[.80,.55],[.86,.75],[.60,.84]]),
  shade:Object.freeze([[.38,.74],[.51,.65],[.57,.51],[.70,.59],[.84,.54],[.77,.79],[.61,.84]])
});
const clamp=n=>Number.isFinite(n)?Math.max(0,Math.min(1,n)):0;
export function foldedShadowProfile(id,pose=null){
  const outline=PUPPET_FOLDS[id];
  if(!outline)return null;
  const t=pose?Math.sin(Math.PI*clamp(pose.progress)):0;
  let lean=0,lift=0;
  if(pose?.kind==='attack'){
    const swing=attackBeat(clamp(pose.progress)).sweep;
    lean=.045*swing*(pose?.bearing?.role==='attack'&&pose.bearing.x<0?-1:1);
    lift=.018*Math.abs(swing);
  }
  if(pose?.kind==='recoil'){
    lean=pose?.bearing?.role==='impact'?.065*pose.bearing.x*t:-.065*t;
    lift=-.012*t;
  }
  if(pose?.kind==='stagger'){
    lean=pose?.bearing?.role==='impact'?.08*pose.bearing.x*t:-.08*t;
    lift=-.020*t;
  }
  if(pose?.kind==='move'){lean=.012*t;lift=.03*t;}
  if(pose?.kind==='ward'){lean=0;lift=.018*t;}
  return Object.freeze(outline.map(([x,y],i)=>Object.freeze([
    Math.max(.07,Math.min(.93,x+lean*(i%3===0 ? .5 : 1))),
    Math.max(.38,Math.min(.92,y-lift))
  ])));
}
export function paintPuppetShadow(ctx,rect,id,{pose=null,fallen=false}={}){
  if(!ctx||!rect||fallen)return false;
  const pts=foldedShadowProfile(id,pose);
  if(!pts)return false;
  const {x,y,width:s}=rect;
  ctx.save();ctx.beginPath();ctx.rect(x+1,y+1,s-2,s-2);ctx.clip();
  ctx.beginPath();
  ctx.moveTo(x+pts[0][0]*s,y+pts[0][1]*s);
  for(const [u,v] of pts.slice(1))ctx.lineTo(x+u*s,y+v*s);
  ctx.closePath();
  ctx.fillStyle=id==='shade'?'#122c3978':'#151b237c';
  ctx.fill();
  ctx.strokeStyle=id==='brunna'?'#c9a9814b':id==='mirelle'?'#c9b4db45':'#ddc99b38';
  ctx.lineWidth=Math.max(.8,s*.022);ctx.stroke();
  // A small triangular fold at the cast shadow's free edge makes it physical
  // paper, rather than another colorful UI ring around the miniature.
  const tip=pts[3];
  if(tip){
    const px=x+tip[0]*s,py=y+tip[1]*s;
    ctx.beginPath();ctx.moveTo(px-s*.07,py+s*.08);
    ctx.lineTo(px,py);ctx.lineTo(px+s*.06,py+s*.07);
    ctx.strokeStyle='#e5cfa25c';ctx.lineWidth=Math.max(.75,s*.018);ctx.stroke();
  }
  ctx.restore();return true;
}
