/** Gate A 22: tactile terrain contact belongs to the REAL physical miniature,
 * not a future committed coordinate, tile selection or ability preview.
 * Six original contact signatures on the already-authored table materials.
 * Visual ink only: no input, RNG, timers, damage, pathfinding or save state.
 */
import {cellRect,getTile} from './geometry.js';

export const CONTACT_IDENTITIES=Object.freeze(['captain','brunna','kess','mirelle','briar','shade']);
export const CONTACT_TERRAINS=Object.freeze(['stone','moss','water','glyph']);
export const CONTACT_PALETTES=Object.freeze({
 captain:Object.freeze({ink:'#c8d5b6',edge:'#34545a',shape:'book-chevron',weight:1}),
 brunna:Object.freeze({ink:'#f0c493',edge:'#674348',shape:'oath-rivets',weight:1.24}),
 kess:Object.freeze({ink:'#d0e3b1',edge:'#365548',shape:'leaf-cut',weight:.77}),
 mirelle:Object.freeze({ink:'#d9c5ea',edge:'#504262',shape:'folio-fold',weight:.89}),
 briar:Object.freeze({ink:'#d2bb82',edge:'#3b513a',shape:'thorn-notch',weight:1.14}),
 shade:Object.freeze({ink:'#b6ebdf',edge:'#33516a',shape:'spirit-fringe',weight:.72})
});
const clamp=n=>Number.isFinite(n)?Math.max(0,Math.min(1,n)):0;
const good=n=>Number.isFinite(n)&&n>0;
const line=(ctx,points,color,w)=>{
 ctx.beginPath();ctx.moveTo(...points[0]);
 for(const p of points.slice(1))ctx.lineTo(...p);
 ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle=color;ctx.lineWidth=w;ctx.stroke();
};
const shape=(ctx,points,fill,edge,w=1.5)=>{
 ctx.beginPath();ctx.moveTo(...points[0]);for(const p of points.slice(1))ctx.lineTo(...p);
 ctx.closePath();ctx.fillStyle=fill;ctx.fill();
 if(edge){ctx.strokeStyle=edge;ctx.lineWidth=w;ctx.stroke();}
};
/** The material beneath the figure's actual painted foot edge, NOT the
 * reducer's already-committed destination during an interpolated walk.
 * A quiet contact impression cannot be mistaken for a destination target:
 * all detail is restricted to the 24–76% width and 72–89% height apron.
 */
export function contactPlan(board,rect,id,{fallen=false,pose=null,terrainAt=getTile}={}){
 if(!board||!rect||!CONTACT_IDENTITIES.includes(id)||fallen||
  !good(rect.width)||!Number.isFinite(rect.x)||!Number.isFinite(rect.y)||
  !good(board.tile)||typeof terrainAt!=='function')return null;
 const x=rect.x+rect.width*.5,y=rect.y+rect.width*.77;
 const column=Math.floor((x-board.x)/board.tile),row=Math.floor((y-board.y)/board.tile);
 if(!cellRect(board,column,row))return null;
 const terrain=terrainAt(row,column);
 if(!CONTACT_TERRAINS.includes(terrain))return null;
 const p=clamp(pose?.progress);
 const motion=pose?.kind==='move'?.2+Math.sin(Math.PI*p)*.28:
  pose?.kind==='recoil'||pose?.kind==='stagger'?.15*Math.sin(Math.PI*p):0;
 return Object.freeze({id,terrain,row,column,rect,
  alpha:.38+motion,weight:CONTACT_PALETTES[id].weight,shape:CONTACT_PALETTES[id].shape});
}
function material(ctx,plan){
 const w=plan.weight,ink=CONTACT_PALETTES[plan.id];
 if(plan.terrain==='water'){
  // Two broken horizontal wakes, no target rings; rise only in the heel apron.
  line(ctx,[[24,79],[30,76],[38,79],[45,77]],'#8dd2c9',2.4*w);
  line(ctx,[[55,77],[63,79],[70,76],[76,79]],'#c6e7ca',2.1*w);
  line(ctx,[[32,84],[43,82],[50,84],[58,82],[68,84]],'#356d78',1.7*w);
 }else if(plan.terrain==='moss'){
  // Pressed leaf folds bend outward from the actual miniature's weight.
  shape(ctx,[[26,81],[35,76],[43,79],[36,85]],'#73906a',ink.edge,1.3);
  shape(ctx,[[74,81],[65,76],[57,79],[65,85]],'#a4ba86',ink.edge,1.3);
  line(ctx,[[29,82],[38,80]],'#e2d7a6',1.5);
  line(ctx,[[62,80],[71,82]],'#d4e0a5',1.5);
 }else if(plan.terrain==='glyph'){
  // Foil pressure scoring stays low and disconnected from targeting corners.
  line(ctx,[[26,83],[35,78],[43,82]],'#f1d397',2.2*w);
  line(ctx,[[57,82],[65,78],[74,83]],'#c5dac0',2*w);
  line(ctx,[[37,86],[50,84],[63,86]],'#796953',1.4);
 }else{
  // Tactile paper abrasion over stone, no duplicated movement arrow.
  line(ctx,[[26,80],[35,77],[43,80]],'#bda987',1.5*w);
  line(ctx,[[57,80],[65,77],[74,80]],'#e2d4b6',1.6*w);
  line(ctx,[[37,85],[48,83],[62,85]],'#3d4546',1.3*w);
 }
}
function signature(ctx,plan){
 const {ink,edge,shape:type}=CONTACT_PALETTES[plan.id],w=plan.weight;
 // Six miniature-owned ornamental cuttings; ALL remain below the figure's face
 // and above its real terrain. No circles/diamonds around targetable tiles.
 if(type==='book-chevron'){
  line(ctx,[[43,78],[50,83],[57,78]],ink,2.6*w);
  line(ctx,[[46,80],[50,84],[54,80]],edge,1.3);
 }else if(type==='oath-rivets'){
  for(const x of [44,50,56]){
   shape(ctx,[[x-2,80],[x,77],[x+2,80],[x,83]],ink,edge,1.1);
  }
 }else if(type==='leaf-cut'){
  shape(ctx,[[41,82],[50,76],[58,81],[49,86]],ink,edge,1.3);
  line(ctx,[[43,82],[55,80]],edge,1.1);
 }else if(type==='folio-fold'){
  line(ctx,[[42,78],[48,84],[51,80],[58,85]],ink,2.3*w);
  line(ctx,[[48,84],[53,84],[58,79]],edge,1.5);
 }else if(type==='thorn-notch'){
  line(ctx,[[42,83],[47,78],[51,84],[56,77],[60,82]],ink,2.4*w);
  line(ctx,[[47,78],[45,76]],edge,1.25);
 }else{
  line(ctx,[[42,80],[47,84],[52,78],[58,83]],ink,2.2*w);
  line(ctx,[[43,85],[50,87],[58,85]],edge,1.3);
 }
}
/** True Canvas drawing is confined to the miniature's moving tile-size
 * rectangle. Draw after subtle backing, below real target/legal marks and the
 * figure/pedestal. The board and battle state are never modified.
 */
export function paintTerrainContact(ctx,board,rect,id,options={}){
 const plan=contactPlan(board,rect,id,options);
 if(!ctx||!plan)return false;
 const {x,y,width:s}=rect;
 ctx.save();ctx.beginPath();ctx.rect(x+1,y+1,s-2,s-2);ctx.clip();
 ctx.translate(x,y);ctx.scale(s/100,s/100);ctx.globalAlpha=plan.alpha;
 material(ctx,plan);signature(ctx,plan);
 ctx.restore();return true;
}
