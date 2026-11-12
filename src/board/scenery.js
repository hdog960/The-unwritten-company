/** Gate A refinement 28 — four original, non-interactive Inkfall relic
 * impressions in the BATTLE FLOOR. Each is small, asymmetric cut paper;
 * no shiny selectable ring, loot glow, target arrow, elevated obstacle,
 * gameplay mutation, extra click area, clock, network or save.
 */
import {cellRect,getTile} from './geometry.js';
export const SCENERY_DESIGNS=Object.freeze(['inkfall-seal','map-fragment','candlemark','vine-crest']);
export const SCENERY_MATERIALS=Object.freeze({
 'inkfall-seal':Object.freeze({kind:'compositors-chase',dark:'#202c30',ink:'#514640',paper:'#bba783',light:'#eddaa8',accent:'#806d55'}),
 'map-fragment':Object.freeze({kind:'creased-survey',dark:'#24383a',ink:'#605847',paper:'#ccc4a0',light:'#eedab0',accent:'#739a88'}),
 'candlemark':Object.freeze({kind:'broken-wax',dark:'#343139',ink:'#79554b',paper:'#cdb08d',light:'#f2d8ac',accent:'#ac8362'}),
 'vine-crest':Object.freeze({kind:'specimen-press',dark:'#263b38',ink:'#345440',paper:'#a6b48e',light:'#e0d5ae',accent:'#90af85'})
});
const valid=(b,p)=>Number.isInteger(p?.row)&&Number.isInteger(p?.column)&&
 p.column>=0&&p.row>=0&&p.column<b.columns&&p.row<b.rows;
export function scenicAnchors(board){
 if(!board||!Number.isInteger(board.columns)||!Number.isInteger(board.rows)||
 board.columns<1||board.rows<1)return Object.freeze([]);
 const proposed=[
  {column:Math.min(3,board.columns-1),row:0,type:'inkfall-seal'},
  {column:0,row:Math.min(3,board.rows-1),type:'map-fragment'},
  {column:board.columns-1,row:board.rows-1,type:'candlemark'},
  {column:Math.floor(board.columns/2),row:board.rows-1,type:'vine-crest'}
 ];
 const used=new Set(),result=[];
 for(const pos of proposed){
  const k=pos.column+':'+pos.row;
  if(used.has(k)||getTile(pos.row,pos.column)==='rubble')continue;
  used.add(k);result.push(Object.freeze(pos));
 }
 return Object.freeze(result);
}
/** Accept both legacy frozen actor object and the ACTUAL physical footprint
 * array returned by physicalHabitatCells (which follows a moving pawn).
 */
export function scenicArtifactPlan(board,occupied={}){
 if(!board||!Number.isFinite(board.tile)||board.tile<4||
 !Number.isFinite(board.x)||!Number.isFinite(board.y))return Object.freeze([]);
 const cells=Array.isArray(occupied)?occupied:Object.values(occupied??{}),busy=new Set();
 for(const p of cells)if(valid(board,p))busy.add(p.column+':'+p.row);
 const result=[];
 for(const a of scenicAnchors(board)){
  if(busy.has(a.column+':'+a.row))continue;
  const rect=cellRect(board,a.column,a.row);if(!rect)continue;
  result.push(Object.freeze({...a,kind:SCENERY_MATERIALS[a.type].kind,rect:Object.freeze({...rect})}));
 }
 return Object.freeze(result);
}
function path(ctx,pts){ctx.beginPath();ctx.moveTo(...pts[0]);for(const p of pts.slice(1))ctx.lineTo(...p);}
function face(ctx,pts,fill,stroke,w){
 path(ctx,pts);ctx.closePath();ctx.fillStyle=fill;ctx.fill();
 if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=w;ctx.lineJoin='round';ctx.stroke();}
}
function ink(ctx,pts,color,w){path(ctx,pts);ctx.strokeStyle=color;ctx.lineWidth=w;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke();}
function pin(ctx,x,y,r,c){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=c;ctx.fill();}
/** All sites are genuinely different authored 2.5D paper relief, not a
 * circular target/loot indicator. Small (<80% of the already walkable tile),
 * world-native and deliberately muted under the true legal-target layer.
 */
export function paintScenicArtifact(ctx,item){
 if(!ctx||!item?.rect||!SCENERY_MATERIALS[item.type])return false;
 const {x,y,width:s}=item.rect,c=SCENERY_MATERIALS[item.type],p=(u,v)=>[x+u*s,y+v*s],w=Math.max(.8,s*.021);
 ctx.save();ctx.beginPath();ctx.rect(x+1,y+1,s-2,s-2);ctx.clip();ctx.globalAlpha=.76;
 if(item.type==='inkfall-seal'){
  // A collapsed bookprinter's rectangular movable-type chase, never a ring.
  face(ctx,[p(.15,.37),p(.47,.23),p(.82,.35),p(.75,.74),p(.34,.82),p(.13,.62)],c.dark,c.ink,w*1.2);
  face(ctx,[p(.18,.32),p(.49,.2),p(.78,.34),p(.70,.69),p(.36,.76),p(.18,.58)],c.paper,c.light,w);
  face(ctx,[p(.25,.37),p(.49,.27),p(.67,.38),p(.61,.61),p(.38,.69),p(.24,.55)],c.ink,c.accent,w*.8);
  for(const [u,v] of [[.32,.41],[.47,.36],[.40,.54],[.54,.49]]){
   face(ctx,[p(u,v),p(u+.09,v-.017),p(u+.09,v+.073),p(u+.01,v+.09)],c.paper,c.dark,w*.63);
   ink(ctx,[p(u+.025,v+.033),p(u+.07,v+.03)],c.dark,w*.65);
  }
  ink(ctx,[p(.22,.64),p(.37,.72),p(.67,.66)],c.light,w*.85);
  pin(ctx,...p(.73,.50),s*.015,c.light);
 }else if(item.type==='map-fragment'){
  // Water-stained folded survey with coastal contour, perforated landmarks.
  face(ctx,[p(.13,.29),p(.42,.19),p(.63,.25),p(.84,.37),p(.75,.71),p(.49,.83),p(.16,.69)],c.dark,c.ink,w);
  face(ctx,[p(.15,.25),p(.44,.16),p(.63,.22),p(.8,.36),p(.71,.67),p(.48,.77),p(.19,.65)],c.paper,c.light,w);
  face(ctx,[p(.43,.18),p(.62,.23),p(.56,.36)],c.light,c.accent,w*.7);
  ink(ctx,[p(.32,.24),p(.34,.44),p(.30,.67)],c.ink,w*.9);
  ink(ctx,[p(.24,.53),p(.38,.47),p(.46,.55),p(.59,.42),p(.73,.46)],c.accent,w*1.55);
  ink(ctx,[p(.27,.56),p(.39,.51),p(.47,.59),p(.64,.47)],c.light,w*.65);
  for(const [u,v] of [[.26,.34],[.57,.64],[.69,.35]])pin(ctx,...p(u,v),s*.017,c.ink);
 }else if(item.type==='candlemark'){
  // Asymmetrical pressed/wax residue and torn paper fibers, not a shield pip.
  face(ctx,[p(.16,.61),p(.23,.43),p(.39,.35),p(.55,.43),p(.69,.35),p(.84,.53),p(.76,.72),p(.54,.8),p(.28,.76)],c.dark,c.ink,w);
  face(ctx,[p(.2,.55),p(.27,.41),p(.41,.37),p(.55,.48),p(.70,.39),p(.78,.52),p(.71,.66),p(.54,.74),p(.29,.70)],c.paper,c.light,w*.85);
  face(ctx,[p(.32,.51),p(.48,.43),p(.64,.51),p(.56,.62),p(.37,.62)],c.accent,c.ink,w*.65);
  ink(ctx,[p(.29,.66),p(.38,.72),p(.53,.70),p(.67,.65)],c.light,w);
  ink(ctx,[p(.43,.47),p(.48,.54),p(.54,.49)],c.ink,w*.95);
  for(const [u,v,r] of [[.19,.73,.028],[.76,.69,.027],[.65,.79,.019]])pin(ctx,...p(u,v),s*r,c.accent);
 }else{
  // Fern specimen pressed under uneven vellum, with four separately veined
  // plant lobes (not a bright circular wreath or highlighted target tile).
  face(ctx,[p(.18,.65),p(.22,.42),p(.35,.23),p(.48,.29),p(.56,.18),p(.76,.38),p(.82,.61),p(.61,.79),p(.36,.82)],c.dark,c.ink,w);
  face(ctx,[p(.21,.60),p(.27,.41),p(.36,.27),p(.50,.33),p(.57,.23),p(.72,.42),p(.76,.59),p(.59,.73),p(.38,.76)],c.paper,c.light,w*.85);
  ink(ctx,[p(.3,.72),p(.44,.55),p(.58,.39),p(.67,.3)],c.ink,w*1.25);
  for(const [a,b,c1] of [
   [[.37,.63],[.25,.50],[.36,.42]],
   [[.48,.51],[.36,.32],[.51,.34]],
   [[.57,.43],[.71,.45],[.69,.61]],
   [[.42,.59],[.44,.74],[.55,.67]]
  ]){
   face(ctx,[p(...a),p(...b),p(...c1)],c.accent,c.ink,w*.7);
   ink(ctx,[p(...a),p((b[0]+c1[0])/2,(b[1]+c1[1])/2)],c.light,w*.7);
  }
  for(const [u,v] of [[.22,.67],[.71,.67],[.51,.29]])pin(ctx,...p(u,v),s*.014,c.light);
 }
 ctx.restore();return true;
}
export function paintFloorVignettes(ctx,board,occupied={}){
 const marks=scenicArtifactPlan(board,occupied);
 if(!ctx||!marks.length)return 0;
 ctx.save();ctx.beginPath();ctx.rect(board.x,board.y,board.mapWidth,board.mapHeight);ctx.clip();
 for(const m of marks)paintScenicArtifact(ctx,m);
 ctx.restore();return marks.length;
}
