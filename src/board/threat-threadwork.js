/** v0.09 Gate A refinement 30: individually illustrated enemy-witness threads.
 * An actual enemy-intent link is an editorial annotation of a true attack
 * target, NOT a proposed movement path, legal move or target selection.
 * Light physical stitches replace the long bright dashed trajectory,
 * preserving real source/target facts without drawing through miniature faces.
 */
import {cellRect} from './geometry.js';
export const THREAD_MATERIALS=Object.freeze({
 briar:Object.freeze({name:'thorn-stitch',back:'#29392f',fiber:'#d3b483',light:'#ffe0ad',cut:'#735e45'}),
 shade:Object.freeze({name:'bell-fracture',back:'#233a4b',fiber:'#aedbd8',light:'#e3fff0',cut:'#648c9e'})
});
const finite=v=>Number.isFinite(v);
const inside=(board,p)=>p&&Number.isInteger(p.column)&&Number.isInteger(p.row)&&
 p.column>=0&&p.row>=0&&p.column<board.columns&&p.row<board.rows;
const freezePart=p=>Object.freeze(p);
const fromRect=r=>({left:r.x,top:r.y,right:r.x+r.width,bottom:r.y+r.height});
const pointInside=(p,r,pad)=>p.x>=r.left+pad&&p.x<=r.right-pad&&
 p.y>=r.top+pad&&p.y<=r.bottom-pad;
/** Plan only the two independently authored kinds, from actual supplied
 * *real* threatEngravings marks. Ignore missing/offboard victim/sources.
 * Center-safe whitespace at heroes and enemy sources prevents painted ink
 * crossing the miniature's face and silhouette, even with 4 v 2 actors.
 */
export function threatThreadPlan(board,marks,partyPositions={}){
 if(!board||!Number.isInteger(board.columns)||!Number.isInteger(board.rows)||
 !finite(board.tile)||board.tile<4||!finite(board.x)||!finite(board.y)||
 !Array.isArray(marks))return Object.freeze([]);
 const cells=Object.values(partyPositions??{})
  .filter(p=>inside(board,p)).map(p=>fromRect(cellRect(board,p.column,p.row)));
 const out=[];
 for(const mark of marks){
  if(!Object.hasOwn(THREAD_MATERIALS,mark?.foeId)||
   !mark?.start||!mark?.end||!mark?.source||!mark?.victim||
   ![mark.start.x,mark.start.y,mark.end.x,mark.end.y,
     mark.source.x,mark.source.y,mark.victim.x,mark.victim.y].every(finite))continue;
  const s=board.tile,dx=mark.end.x-mark.start.x,dy=mark.end.y-mark.start.y;
  const length=Math.hypot(dx,dy);
  if(length<s*.11)continue;
  const nx=-dy/length,ny=dx/length;
  // The existing source/victim endpoints are validated by the true
  // engraving planner; no invented intermediate board-square path.
  const count=Math.max(2,Math.min(11,Math.floor(length/(s*.37))));
  const type=THREAD_MATERIALS[mark.foeId].name;
  const sourceZone={left:mark.source.x-s*.35,top:mark.source.y-s*.35,
   right:mark.source.x+s*.35,bottom:mark.source.y+s*.35};
  const targetZone={left:mark.victim.x-s*.35,top:mark.victim.y-s*.35,
   right:mark.victim.x+s*.35,bottom:mark.victim.y+s*.35};
  for(let i=0;i<count;i++){
   const t=(i+.5)/count,arch=Math.sin(Math.PI*t)*s*.065*
    (mark.source.x<=mark.victim.x?1:-1);
   const x=mark.start.x+dx*t+nx*arch,y=mark.start.y+dy*t+ny*arch;
   const at={x,y},extent=s*.095;
   if(x-extent<board.x||y-extent<board.y||
      x+extent>board.x+board.mapWidth||y+extent>board.y+board.mapHeight)continue;
   if(pointInside(at,sourceZone,0)||pointInside(at,targetZone,0))continue;
   if(cells.some(c=>pointInside(at,c,s*.22)))continue;
   out.push(freezePart({
    foeId:mark.foeId,victimId:mark.victimId,type,
    attack:mark.attack===true,
    index:i,x,y,s,
    tangent:freezePart({x:dx/length,y:dy/length}),
    notches:mark.attack===true?3:1
   }));
  }
 }
 return Object.freeze(out);
}
function path(ctx,p){ctx.beginPath();ctx.moveTo(...p[0]);for(const a of p.slice(1))ctx.lineTo(...a);}
function score(ctx,p,ink,w){path(ctx,p);ctx.strokeStyle=ink;ctx.lineWidth=w;
 ctx.lineJoin='round';ctx.lineCap='round';ctx.stroke();}
function cut(ctx,p,fill,edge,w){path(ctx,p);ctx.closePath();ctx.fillStyle=fill;ctx.fill();
 ctx.strokeStyle=edge;ctx.lineWidth=w;ctx.lineJoin='round';ctx.stroke();}
/** Bespoke page-cut segments, not text, rings, glows, UI or additional
 * trajectory geometry. Briar: irregular thorn/ink barb. Shade: broken
 * bell-silk shard. Approach has ONE notch, actual attack has THREE.
 * Source and target already own stronger danger sigils.
 */
export function paintThreatThreadwork(ctx,board,marks,partyPositions={}){
 const plan=threatThreadPlan(board,marks,partyPositions);
 if(!ctx||!plan.length)return 0;
 ctx.save();ctx.beginPath();ctx.rect(board.x,board.y,board.mapWidth,board.mapHeight);ctx.clip();
 for(const mark of plan){
  const c=THREAD_MATERIALS[mark.foeId],s=mark.s;
  ctx.save();
  ctx.translate(mark.x,mark.y);
  ctx.rotate(Math.atan2(mark.tangent.y,mark.tangent.x));
  ctx.globalAlpha=mark.attack?.89:.58;
  // Hand-cut physical shadow and colored upper paper, <=18% of the cell.
  if(mark.foeId==='briar'){
   cut(ctx,[[-s*.083,s*.017],[-s*.033,-s*.055],[s*.008,-s*.035],
     [s*.08,s*.018],[s*.03,s*.048]],c.back,c.cut,Math.max(.6,s*.015));
   cut(ctx,[[-s*.074,s*.003],[-s*.025,-s*.06],[s*.064,s*.013],
     [s*.018,s*.031]],c.fiber,c.back,Math.max(.7,s*.014));
   score(ctx,[[-s*.061,s*.008],[-s*.011,-s*.009],[s*.034,s*.012]],
     c.light,Math.max(.65,s*.013));
  }else{
   cut(ctx,[[-s*.075,-s*.032],[-s*.014,-s*.052],[s*.075,s*.004],
     [s*.017,s*.051],[-s*.043,s*.032]],c.back,c.cut,Math.max(.7,s*.014));
   cut(ctx,[[-s*.064,-s*.037],[s*.016,-s*.038],[s*.057,s*.009],
     [s*.007,s*.037]],c.fiber,c.back,Math.max(.7,s*.015));
   score(ctx,[[-s*.034,s*.025],[s*.018,-s*.008],[s*.041,s*.013]],
     c.light,Math.max(.65,s*.014));
  }
  // Attack/approach are distinguishable by the actual number of hard
  // transverse score cuts, independent of hue, animation and alpha.
  for(let i=0;i<mark.notches;i++){
   const u=mark.notches===1?0:(i-1)*s*.027;
   score(ctx,[[u-s*.004,-s*.041],[u+s*.013,s*.029]],
    mark.attack?c.light:c.cut,Math.max(.75,s*.018));
  }
  ctx.restore();
 }
 ctx.restore();return plan.length;
}
