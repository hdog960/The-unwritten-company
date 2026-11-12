/** Gate A 23 — hand-pressed, FACE-CLEAR attack outcome witnesses.
 * Real confirmed combat events alone decide hit, critical, miss and skill.
 * This is a transient LOWER-APRON bookboard illustration, not a damage
 * reducer, combat log, target reticle, tile overlay or animation clock.
 */
import {cellRect} from './geometry.js';
import {combatScriptStyle} from './combat-script.js';

export const WITNESS_OUTCOMES=Object.freeze(['hit','critical','miss']);
export const WITNESS_STYLES=Object.freeze(['strike','spark','sigil','foe']);
export const WITNESS_INKS=Object.freeze({
 strike:Object.freeze({paper:'#efbd96',foil:'#f9e5bc',edge:'#744639',type:'blade-score'}),
 spark:Object.freeze({paper:'#a1e4d9',foil:'#e7fff1',edge:'#286773',type:'lightning-fork'}),
 sigil:Object.freeze({paper:'#d5c1e3',foil:'#f9e3b6',edge:'#68566e',type:'folio-fold'}),
 foe:Object.freeze({paper:'#b7c991',foil:'#f0d9aa',edge:'#3c5942',type:'thorn-cut'})
});
const clamp=n=>Math.max(0,Math.min(1,n));
const point=(board,p)=>p&&cellRect(board,p.column,p.row);
const trace=(ctx,pts,ink,width)=>{
 ctx.beginPath();ctx.moveTo(...pts[0]);
 for(const p of pts.slice(1))ctx.lineTo(...p);
 ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle=ink;ctx.lineWidth=width;ctx.stroke();
};
const cut=(ctx,pts,fill,edge,width)=>{
 ctx.beginPath();ctx.moveTo(...pts[0]);
 for(const p of pts.slice(1))ctx.lineTo(...p);ctx.closePath();
 ctx.fillStyle=fill;ctx.fill();
 if(edge){ctx.strokeStyle=edge;ctx.lineWidth=width;ctx.stroke();}
};
/** Immutable, authentic event-bound source plan. It never presumes an attack
 * hit because it reached a tile: confirmed miss uses only airy, open strokes.
 * World strike bearing offsets the foot-level witness a few pixels, without
 * moving any gameplay coordinate or placing a marker over a miniature's head.
 */
export function impactWitnessPlan(board,mark,progress){
 if(!board||!mark||!WITNESS_OUTCOMES.includes(mark.kind)||
  !Number.isFinite(progress)||!point(board,mark.from)||!point(board,mark.to))return null;
 const phase=(progress-.53)/.43;
 if(phase<=0||phase>=1)return null;
 const style=combatScriptStyle(mark),palette=WITNESS_INKS[style];
 if(!palette)return null;
 const dx=mark.to.column-mark.from.column,dy=mark.to.row-mark.from.row;
 const side=Math.sign(dx)||Math.sign(dy)||1;
 const t=clamp(phase),strength=mark.kind==='critical'?1:mark.kind==='hit'?.83:.62;
 return Object.freeze({
   rect:point(board,mark.to),kind:mark.kind,style,signature:palette.type,
   palette,shift:side*2.2,tilt:Math.sign(dy),
   alpha:Number((Math.sin(Math.PI*t)*strength*.91).toFixed(5)),
   progress:t,
   // Closed paper tear = real contact only; a MISS must never imply injury.
   contact:mark.kind!=='miss',
   doubleCut:mark.kind==='critical'
 });
}
/** A tiny dimensional witness, physically pressed along 66–83% of the
 * target's own tile. Nested clipping makes face and HP-base clearance
 * structural, not a comment or a guess about sprite silhouettes.
 */
export function paintImpactWitness(ctx,board,mark,progress){
 const plan=impactWitnessPlan(board,mark,progress);
 if(!ctx||!plan)return false;
 const {rect,kind,palette,shift,tilt}=plan,{x,y,width:s}=rect;
 ctx.save();ctx.beginPath();ctx.rect(x+1,y+1,s-2,s-2);ctx.clip();
 ctx.translate(x,y);ctx.scale(s/100,s/100);
 ctx.beginPath();ctx.rect(16,66,68,17);ctx.clip();
 ctx.globalAlpha=plan.alpha;
 const q=n=>n+shift;
 if(kind==='miss'){
   // Two broken, non-contact wind swishes: no seal, gouge, shield or recoil.
   ctx.beginPath();ctx.moveTo(q(26),72);
   ctx.quadraticCurveTo(q(42),68+tilt,q(53),73);
   ctx.strokeStyle='#b1e8e5';ctx.lineWidth=3.3;ctx.stroke();
   ctx.beginPath();ctx.moveTo(q(56),74);
   ctx.quadraticCurveTo(q(68),78,q(75),72);
   ctx.strokeStyle=palette.edge;ctx.lineWidth=2;ctx.stroke();
 }else{
   // Embossed contact notch and an exposed asymmetric manuscript paper edge.
   cut(ctx,[[q(26),77],[q(39),70],[q(51),75],[q(60),69],[q(75),77],
     [q(65),80],[q(49),77],[q(36),81]],palette.edge,palette.foil,2.5);
   trace(ctx,[[q(27),76],[q(39),70],[q(51),75],[q(60),69],[q(74),76]],
     palette.paper,3.7);
   trace(ctx,[[q(36),79],[q(46),75],[q(55),78],[q(64),76]],palette.foil,1.9);
   if(plan.doubleCut){
     // A second divergent fracture makes criticals distinct without using a
     // huge face-obscuring explosion or an ambiguous target selection ring.
     trace(ctx,[[q(34),68],[q(44),73],[q(52),69],[q(61),74],[q(71),68]],
       '#fff1c4',2.8);
     trace(ctx,[[q(30),81],[q(40),77],[q(47),81],[q(55),78],[q(67),81]],
       '#de9f73',2.4);
   }
 }
 // Four genuinely different skill-family tails in the safe lower apron.
 if(plan.style==='strike'){
   trace(ctx,[[q(43),70],[q(51),78],[q(58),70]],palette.foil,2.4);
 }else if(plan.style==='spark'){
   trace(ctx,[[q(43),69],[q(49),73],[q(47),78],[q(59),70]],palette.foil,2.8);
 }else if(plan.style==='sigil'){
   trace(ctx,[[q(43),70],[q(49),75],[q(55),70],[q(61),75]],palette.foil,2.1);
 }else{
   trace(ctx,[[q(41),70],[q(49),76],[q(55),71],[q(62),78]],palette.foil,2.2);
 }
 ctx.restore();return true;
}
