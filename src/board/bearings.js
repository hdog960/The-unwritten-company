/** Gate A seventeen — visual-only physical bearing of an AUTHORITATIVE event.
 * The source reducer's event provides the exact from/to. There is no guessed
 * target, autoplay clock, input handler, RNG, hitbox or gameplay mutation.
 */
import {visibleMarks} from './choreography.js';
import {movementDirection} from './paper-footfalls.js';

const same=(a,b)=>!!a&&!!b&&a.column===b.column&&a.row===b.row;
const valid=p=>!!p&&Number.isInteger(p.column)&&Number.isInteger(p.row);
const vector=(from,to)=>{
 if(!valid(from)||!valid(to)||same(from,to))return null;
 const dx=to.column-from.column,dy=to.row-from.row;
 return Object.freeze({x:Math.sign(dx),y:Math.sign(dy)});
};
/** 'attack' points from a true attacker toward a chosen target; 'impact'
 * points from a true defender away from its actual incoming source.
 * The second enemy's scheduled mark is invisible until its own segment.
 */
export function combatBearing(frame,position,pose){
 if(!frame?.event||!valid(position)||!pose)return null;
 for(const {mark,visible} of visibleMarks(frame)){
  if(!visible||!mark||!['hit','miss','critical'].includes(mark.kind))continue;
  if(pose.kind==='attack'&&same(position,mark.from)){
   const v=vector(mark.from,mark.to);
   return v?Object.freeze({...v,role:'attack'}):null;
  }
  if(['recoil','stagger'].includes(pose.kind)&&mark.kind!=='miss'&&same(position,mark.to)){
   const v=vector(mark.from,mark.to);
   return v?Object.freeze({...v,role:'impact'}):null;
  }
 }
 return null;
}
/** Adds metadata to the already real puppet pose without editing either the
 * frame, mark, positions or original pose object; no new gameplay branches. */
export function bearingPose(frame,position,pose,board=null){
 if(!pose)return null;
 const bearing=pose.kind==='move'&&board?
  movementDirection(board,frame,position,frame?.event?.actorId):
  combatBearing(frame,position,pose);
 return bearing?Object.freeze({...pose,bearing}):pose;
}
