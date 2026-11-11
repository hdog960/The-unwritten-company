/** Gate A — six individual articulated paper-and-enamel equipment rigs.
 * Each silhouette has its own hand-authored geometry and action pivot. Rigs
 * render INSIDE the existing miniature transform, not over the tactical map.
 * Pure drawing; no damage rolls, clock, randomness or animation timer.
 */
import {attackBeat} from './combat-beats.js';
export const WEAPON_RIGS=Object.freeze(['captain','brunna','kess','mirelle','briar','shade']);
const clamp=t=>Number.isFinite(t)?Math.min(1,Math.max(0,t)):0;
const pivots=Object.freeze({
 captain:[67,55],brunna:[76,65],kess:[27,55],mirelle:[80,73],briar:[50,53],shade:[52,53]
});
export function rigMotion(id,pose=null){
 if(!WEAPON_RIGS.includes(id))return null;
 const p=clamp(pose?.progress),pulse=Math.sin(Math.PI*p);
 let amount=0;
 if(pose?.kind==='attack')amount=([.49,.18,.62,.18,.34,-.42][WEAPON_RIGS.indexOf(id)])*attackBeat(p).sweep;
 else if(pose?.kind==='ward'&&id==='mirelle')amount=.17*pulse;
 else if(pose?.kind==='recoil')amount=-.09*pulse;
 else if(pose?.kind==='stagger')amount=-.14*pulse;
 else if(pose?.kind==='move')amount=.07*pulse;
 // Canonicalize signed zero; attack/idle keyframes remain bit-for-bit stable.
 if(amount===0)amount=0;
 return Object.freeze({angle:amount,secondary:amount===0?0:-amount*.72,pulse,resting:amount===0});
}
const swing=(xy,pivot,angle)=>{
 const x=xy[0]-pivot[0],y=xy[1]-pivot[1],a=Math.cos(angle),b=Math.sin(angle);
 return [pivot[0]+x*a-y*b,pivot[1]+x*b+y*a];
};
export function rigPoint(id,point,pose=null,secondary=false){
 const t=rigMotion(id,pose);if(!t||!Array.isArray(point))return null;
 const pivot=id==='kess'&&secondary?[76,59]:pivots[id];
 return Object.freeze(swing(point,pivot,secondary?t.secondary:t.angle));
}
function path(ctx,id,pts,pose,color,width=2,secondary=false){
 const rotated=pts.map(p=>rigPoint(id,p,pose,secondary));
 ctx.beginPath();ctx.moveTo(...rotated[0]);for(const p of rotated.slice(1))ctx.lineTo(...p);
 ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke();
}
function surface(ctx,id,pts,pose,fill,border='#25333d',width=1.6,secondary=false){
 const rotated=pts.map(p=>rigPoint(id,p,pose,secondary));
 ctx.beginPath();ctx.moveTo(...rotated[0]);for(const p of rotated.slice(1))ctx.lineTo(...p);
 ctx.closePath();ctx.fillStyle=fill;ctx.fill();
 if(border){ctx.strokeStyle=border;ctx.lineWidth=width;ctx.lineJoin='round';ctx.stroke();}
}
function bead(ctx,x,y,r,color){
 ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();
}
export function paintWeaponRig(ctx,id,pose=null){
 if(!ctx||!WEAPON_RIGS.includes(id))return false;
 ctx.save();
 if(id==='captain'){
  // An illuminated guild blade, thin enough to read separately from the cloak.
  surface(ctx,id,[[69,53],[75,31],[80,21],[83,25],[77,38],[72,55]],pose,'#cbdcd1','#334750',2);
  path(ctx,id,[[72,48],[79,27]],pose,'#fff2d0',1.6);
  path(ctx,id,[[62,48],[74,52]],pose,'#e4c584',4.1);
  surface(ctx,id,[[66,51],[71,52],[69,62],[64,63]],pose,'#6e554a','#273c43',1.6);
  bead(ctx,...rigPoint(id,[67,62],pose),2.6,'#e7cb8d');
 }else if(id==='brunna'){
  // Asymmetric wrought-bronze oath hammer, head and grip rotate as one tool.
  path(ctx,id,[[76,66],[80,21]],pose,'#624a42',7);
  path(ctx,id,[[76,63],[80,21]],pose,'#d3a572',3.5);
  surface(ctx,id,[[66,16],[88,13],[92,25],[67,29]],pose,'#b3b8ae','#37484c',2.7);
  surface(ctx,id,[[72,18],[84,17],[86,23],[72,25]],pose,'#d8d1b3','#6c6862',1.2);
  path(ctx,id,[[69,20],[85,18]],pose,'#fff1cc',1.6);
  path(ctx,id,[[75,57],[79,56]],pose,'#f3d29b',2);
 }else if(id==='kess'){
  // Two independently swung leaf-blades: opposite direction at strike apex.
  path(ctx,id,[[27,56],[18,36],[22,27]],pose,'#d9e6d5',4.1);
  path(ctx,id,[[21,34],[22,27]],pose,'#fff1d7',1.5);
  path(ctx,id,[[20,51],[32,49]],pose,'#d3b378',3.2);
  path(ctx,id,[[76,60],[85,41],[80,29]],pose,'#d5ded8',4.1,true);
  path(ctx,id,[[82,37],[80,29]],pose,'#f8efd6',1.5,true);
  path(ctx,id,[[72,54],[83,58]],pose,'#d3b378',3.2,true);
 }else if(id==='mirelle'){
  // A long copper staff with a faceted, book-folded teal witness prism.
  path(ctx,id,[[81,76],[76,18]],pose,'#5a5059',6);
  path(ctx,id,[[81,76],[76,18]],pose,'#cbb384',3.7);
  surface(ctx,id,[[76,12],[83,21],[76,30],[68,21]],pose,'#9bd1cc','#356e78',2.2);
  surface(ctx,id,[[76,15],[79,21],[76,26],[73,21]],pose,'#e1f9e9','#68a7a9',1);
  bead(ctx,...rigPoint(id,[76,21],pose),2.4,'#fff5cf');
  path(ctx,id,[[70,15],[65,12]],pose,'#e2e7d9',1.3);
  path(ctx,id,[[82,15],[87,10]],pose,'#d6ebdb',1.3);
 }else if(id==='briar'){
  // Two different living thorn claws, no duplicated recolored enemy weapon.
  path(ctx,id,[[32,56],[20,53],[12,57]],pose,'#d1bd83',4.1);
  surface(ctx,id,[[15,49],[8,57],[17,62],[21,55]],pose,'#657957','#293d35',1.6);
  surface(ctx,id,[[24,49],[20,38],[28,45]],pose,'#a3a67a','#314037',1.4);
  path(ctx,id,[[68,55],[81,51],[91,57]],pose,'#b7b68c',3.8,true);
  surface(ctx,id,[[84,47],[94,56],[84,64]],pose,'#759569','#324837',1.5,true);
 }else{
  // Spirit shade's forked hanging bells extend while a spell is prepared.
  path(ctx,id,[[27,48],[16,40],[14,54],[24,64]],pose,'#89c8c6',2.9);
  surface(ctx,id,[[13,52],[20,59],[16,68],[9,60]],pose,'#5e9c9f','#23485d',1.4);
  path(ctx,id,[[72,48],[85,38],[88,54],[79,65]],pose,'#b5e5dc',2.8,true);
  surface(ctx,id,[[83,55],[90,63],[83,69],[77,60]],pose,'#6fa6b2','#23465e',1.5,true);
 }
 ctx.restore();return true;
}
