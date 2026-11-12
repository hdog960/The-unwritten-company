/** Gate A 21 — physically printed footsteps in a confirmed miniature walk.
 * The only source is an ALREADY COMMITTED legal path from the game reducer.
 * A path preview, unconfirmed tap, phantom destination or invalid movement
 * never prints a footprint. No independent animation timer or save state.
 */
import {cellRect} from './geometry.js';

export const FOOTFALL_IDS=Object.freeze(['captain','brunna','kess','mirelle']);
export const FOOTFALL_MATERIALS=Object.freeze({
 captain:Object.freeze({ink:'#b9ad8b',edge:'#263d43',type:'boot',stride:13}),
 brunna:Object.freeze({ink:'#e0b989',edge:'#5b3e40',type:'plate',stride:10}),
 kess:Object.freeze({ink:'#d2e5be',edge:'#35564b',type:'leaf',stride:16}),
 mirelle:Object.freeze({ink:'#d2c0dc',edge:'#46405b',type:'folio',stride:12})
});
const clamp=x=>Number.isFinite(x)?Math.max(0,Math.min(1,x)):0;
const smooth=x=>{const p=clamp(x);return p*p*(3-2*p);};
const same=(a,b)=>!!a&&!!b&&a.column===b.column&&a.row===b.row;
const valid=(board,p)=>!!p&&Number.isInteger(p.column)&&Number.isInteger(p.row)&&
 p.column>=0&&p.row>=0&&p.column<board.columns&&p.row<board.rows;
const manhattan=(a,b)=>Math.abs(a.column-b.column)+Math.abs(a.row-b.row);
function motionData(board,frame,at,id){
 const event=frame?.event,path=event?.path;
 if(!board||event?.kind!=='move'||event.actorId!==id||
  !FOOTFALL_IDS.includes(id)||!Array.isArray(path)||path.length<2||
  !valid(board,at)||!same(at,path.at(-1))||
  !path.every((p,i)=>valid(board,p)&&(i===0||manhattan(p,path[i-1])===1)))return null;
 const progress=clamp(frame.progress),distance=smooth(progress)*(path.length-1),
  segment=Math.min(path.length-2,Math.floor(distance));
 return {path,progress,distance,segment};
}
/** Real currently traversed cardinal segment; no static default facing.
 * This is used for both paper gait artwork and actual animated body motion.
 */
export function movementDirection(board,frame,at,id){
 const m=motionData(board,frame,at,id);
 if(!m)return null;
 const a=m.path[m.segment],b=m.path[m.segment+1];
 return Object.freeze({x:b.column-a.column,y:b.row-a.row,role:'move'});
}
/** Already visited tiles only; neither the goal nor future steps are painted.
 * Immutable plan is tied to exactly the same smooth movement position as the
 * existing animatedHeroRect(). No pathfinding or resource changes.
 */
export function footfallPlan(board,frame,at,id){
 const m=motionData(board,frame,at,id);
 if(!m||m.progress<=0||m.progress>=1)return Object.freeze([]);
 const entries=[];
 for(let i=0;i<m.path.length-1;i++){
  // A tile is marked only once the real walking animation left it.
  if(m.distance<=i+.08)break;
  const point=m.path[i],next=m.path[i+1],r=cellRect(board,point.column,point.row);
  if(!r)continue;
  const age=Math.max(0,m.distance-i-.08);
  const alpha=Math.max(.04,.55/(1+age*.85)*(1-m.progress*.28));
  entries.push(Object.freeze({
   position:Object.freeze({column:point.column,row:point.row}),
   rect:r,id,alpha,dir:Object.freeze([next.column-point.column,next.row-point.row]),
   parity:i%2,age
  }));
 }
 return Object.freeze(entries);
}
const stroke=(ctx,pts,color,width)=>{
 ctx.beginPath();ctx.moveTo(...pts[0]);for(const p of pts.slice(1))ctx.lineTo(...p);
 ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke();
};
const filled=(ctx,pts,color,edge,width)=>{
 ctx.beginPath();ctx.moveTo(...pts[0]);for(const p of pts.slice(1))ctx.lineTo(...p);
 ctx.closePath();ctx.fillStyle=color;ctx.fill();
 if(edge){ctx.strokeStyle=edge;ctx.lineWidth=width;ctx.stroke();}
};
/** Draw source-ink heel/toe impressions in a tiny 100-unit local cut-card tile.
 * Positions stay inside 24..76% of the tile, do not resemble target corners,
 * and never cover future/invalid squares or the right/left UI rails.
 */
export function paintFootfall(ctx,board,entry){
 const item=FOOTFALL_MATERIALS[entry?.id],rect=entry?.rect;
 if(!ctx||!board||!item||!rect||!Number.isFinite(entry?.alpha))return false;
 const {x,y,width:s}=rect;if(!(s>0))return false;
 const [dx,dy]=entry.dir??[0,0];
 if(Math.abs(dx)+Math.abs(dy)!==1)return false;
 ctx.save();ctx.beginPath();ctx.rect(x+1,y+1,s-2,s-2);ctx.clip();
 ctx.translate(x+s*.5,y+s*.56);
 ctx.scale(s/100,s/100);ctx.rotate(Math.atan2(dy,dx)+Math.PI/2);
 ctx.globalAlpha=Math.max(0,Math.min(.52,entry.alpha));
 const side=entry.parity?-1:1,d=item.stride;
 // Two physically staggered imprints. Distinct outline and tread by person.
 for(const [index,offset] of [[0,-d*.68],[1,d*.68]]){
  const u=(index?1:-1)*8,v=offset*side;
  if(item.type==='boot'){
   filled(ctx,[[u-6,v-9],[u+3,v-12],[u+9,v-6],[u+9,v+7],[u+2,v+11],[u-6,v+6]],item.ink,item.edge,2.5);
   stroke(ctx,[[u-4,v+1],[u+7,v+1]],item.edge,2);
   stroke(ctx,[[u-3,v+5],[u+7,v+5]],item.edge,1.7);
  }else if(item.type==='plate'){
   filled(ctx,[[u-9,v-10],[u+9,v-10],[u+12,v+8],[u-11,v+8]],item.ink,item.edge,3.3);
   stroke(ctx,[[u-7,v-4],[u+7,v-4],[u+9,v+3]],item.edge,2.1);
  }else if(item.type==='leaf'){
   filled(ctx,[[u,v-14],[u+7,v-5],[u+6,v+9],[u,v+13],[u-5,v+8],[u-7,v-4]],item.ink,item.edge,2);
   stroke(ctx,[[u,v-9],[u,v+9]],item.edge,1.3);
  }else{
   filled(ctx,[[u,v-12],[u+8,v-1],[u,v+11],[u-8,v-1]],item.ink,item.edge,2.1);
   stroke(ctx,[[u-5,v-1],[u+5,v-1]],item.edge,1.6);
   stroke(ctx,[[u,v-7],[u,v+6]],item.edge,1.3);
  }
 }
 ctx.restore();return true;
}
export function paintRealFootfalls(ctx,board,frame,positions){
 if(!ctx||!board||!positions||!frame?.event)return 0;
 const id=frame.event.actorId,at=positions[id],plan=footfallPlan(board,frame,at,id);
 let count=0;for(const entry of plan)if(paintFootfall(ctx,board,entry))count++;
 return count;
}
