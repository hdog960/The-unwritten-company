/** v0.09 Gate A 26 — genuine movement-cost bookbinder's tickets.
 * These are original hand-inked, removable *preview-only* world artifacts.
 * The already-validated Dijkstra path and WALK_COST are the sole authority.
 * Never mutate movement/AP, select cells, infer gameplay or draw in the rails.
 */
import {cellRect,getTile} from './geometry.js';
import {WALK_COST} from '../movement/pathfinding.js';
export const ROUTE_COST_MATERIALS=Object.freeze(['stone','moss','water','glyph']);
export const ROUTE_TICKET_PALETTES=Object.freeze({
 stone:Object.freeze({sheet:'#d9cc9d',edge:'#6a6351',foil:'#789d86',shadow:'#172930'}),
 moss:Object.freeze({sheet:'#d5d4a3',edge:'#55775a',foil:'#99ccb1',shadow:'#203c35'}),
 water:Object.freeze({sheet:'#c3dcd0',edge:'#3b757d',foil:'#ddf6e6',shadow:'#1c3c4d'}),
 glyph:Object.freeze({sheet:'#f2d79e',edge:'#987e51',foil:'#fff0be',shadow:'#453c34'})
});
const point=p=>p&&Number.isInteger(p.column)&&Number.isInteger(p.row);
const same=(a,b)=>a.column===b.column&&a.row===b.row;
const inside=(board,p)=>point(p)&&p.column>=0&&p.row>=0&&p.column<board.columns&&p.row<board.rows;
const freezeStep=s=>Object.freeze(s);
/** Authoritative route plan only. No fake path for a bare tapped tile, and no
 * legibility ticket for diagonal movement, a missing destination, rubble or
 * a route whose movement-cost accounting disagrees with the engine.
 */
export function routeTicketPlan(board,overlay){
 if(!board||!Number.isInteger(board.columns)||!Number.isInteger(board.rows)||
  board.columns<1||board.rows<1||!Number.isFinite(board.tile)||board.tile<4||
  overlay?.mode!=='movement'||!Array.isArray(overlay?.evaluation?.path))return Object.freeze([]);
 const path=overlay.evaluation.path;
 if(path.length<2||path.length>board.columns*board.rows||
  !path.every(p=>inside(board,p))||
  !inside(board,overlay.target)||!same(path.at(-1),overlay.target)||
  (point(overlay.origin)&&!same(path[0],overlay.origin)))return Object.freeze([]);
 const results=[];
 let total=0;
 for(let index=1;index<path.length;index++){
  const from=path[index-1],to=path[index];
  if(Math.abs(from.column-to.column)+Math.abs(from.row-to.row)!==1)return Object.freeze([]);
  const material=getTile(to.row,to.column),cost=WALK_COST[material];
  if(!ROUTE_COST_MATERIALS.includes(material)||!Number.isFinite(cost))return Object.freeze([]);
  total+=cost;
  const rect=cellRect(board,to.column,to.row);
  results.push(freezeStep({
   index,column:to.column,row:to.row,
   material,kind:cost===2?'double':'single',
   cost,total,
   // Ink form differs for a real but over-budget route, never pretends legal.
   available:overlay.evaluation.valid===true,
   bearing:freezeStep({dx:to.column-from.column,dy:to.row-from.row}),
   rect
  }));
 }
 if(Number.isFinite(overlay.evaluation.cost)&&total!==overlay.evaluation.cost)return Object.freeze([]);
 return Object.freeze(results);
}
const trace=(ctx,pts)=>{ctx.beginPath();ctx.moveTo(...pts[0]);for(const p of pts.slice(1))ctx.lineTo(...p);};
const fill=(ctx,pts,color,edge=null,w=1)=>{
 trace(ctx,pts);ctx.closePath();ctx.fillStyle=color;ctx.fill();
 if(edge){ctx.strokeStyle=edge;ctx.lineWidth=w;ctx.lineJoin='round';ctx.stroke();}
};
const line=(ctx,pts,color,w)=>{
 trace(ctx,pts);ctx.strokeStyle=color;ctx.lineWidth=w;
 ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke();
};
/** Genuine two inlay hatches on water = actual cost 2; one on other terrain.
 * Stamps are small (<28% of native cell), lower-left, under all native
 * figures/HP bars, transient and never mistaken for a target corner/ring.
 */
export function paintRouteTickets(ctx,board,overlay){
 if(!ctx)return 0;
 const marks=routeTicketPlan(board,overlay);
 if(!marks.length)return 0;
 for(const mark of marks){
  const {rect,material,available,kind,bearing}=mark,s=rect.width,x=rect.x,y=rect.y;
  const ink=ROUTE_TICKET_PALETTES[material],p=(u,v)=>[x+s*u,y+s*v];
  const frame=available?ink.edge:'#8b4e4e',lip=available?ink.foil:'#ffbaa1';
  ctx.save();ctx.beginPath();ctx.rect(x+1,y+1,s-2,s-2);ctx.clip();
  // Deep physical-paper thickness and an asymmetric real folio/page curl.
  fill(ctx,[p(.13,.69),p(.385,.69),p(.428,.75),p(.418,.928),p(.168,.933),p(.12,.875)],
   ink.shadow,null,Math.max(.65,s*.017));
  fill(ctx,[p(.13,.665),p(.36,.665),p(.405,.73),p(.39,.88),p(.157,.895),p(.115,.84)],
   available?ink.sheet:'#c9a8a0',frame,Math.max(.8,s*.021));
  fill(ctx,[p(.36,.665),p(.405,.73),p(.346,.732)],
   available?'#f8eed3':'#78484c',frame,Math.max(.65,s*.015));
  // These are embossed type-glyphs, not text or UI. Width stays >1 CSS px.
  // A single scored bar means cost one; paired bars mean real water costs two.
  const hatchCount=kind==='double'?2:1;
  for(let i=0;i<hatchCount;i++){
   const y0=.76+i*.066;
   line(ctx,[p(.175,y0+.045),p(.223,y0),p(.327,y0)],
    frame,Math.max(1.05,s*.029));
   line(ctx,[p(.195,y0+.046),p(.245,y0+.01),p(.322,y0+.01)],
    lip,Math.max(.85,s*.019));
  }
  // A tiny chamfer/nib points in the genuine orthogonal direction, never
  // a fabricated route or a full-size clickable movement arrow.
  const dx=bearing.dx,dy=bearing.dy,base=p(.318,.868);
  const tip=p(.318+dx*.056,.868+dy*.045);
  line(ctx,[base,tip],lip,Math.max(.8,s*.019));
  if(!available){
   // Broken slit distinguishes over-budget from valid independent of color.
   line(ctx,[p(.178,.713),p(.29,.854)],'#6b363f',Math.max(1,s*.028));
  }
  ctx.restore();
 }
 return marks.length;
}
