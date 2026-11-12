/** v0.09 Gate A corrective art 29: three truly different printed artifacts
 * on the EXISTING glyph material (walkable, cost 1). Ancient floor history,
 * NOT targets, buttons, active spells, loot, pickups, or extra grid squares.
 * Replaces historic bright nested gold target-like rings with physically cut
 * irregular ink-and-parchment remnants. Static Canvas below real targeting.
 */
import {cellRect} from './geometry.js';
export const GLYPH_FOLIO_STYLES=Object.freeze(['broken-astral-register','binder-tally','root-cipher']);
export const GLYPH_FOLIO_PALETTES=Object.freeze({
 'broken-astral-register':Object.freeze({lip:'#26353a',paper:'#b6aa83',light:'#e5d1a7',ink:'#45565a',foil:'#9b906d'}),
 'binder-tally':Object.freeze({lip:'#30353b',paper:'#a7b29a',light:'#d9d8b5',ink:'#4f5958',foil:'#809b88'}),
 'root-cipher':Object.freeze({lip:'#303b35',paper:'#a7b58d',light:'#e4dab1',ink:'#395b49',foil:'#9caa79'})
});
export function glyphFolioPlan(board,tileAt){
 if(!board||!Number.isInteger(board.columns)||!Number.isInteger(board.rows)||
    board.columns<1||board.rows<1||!Number.isFinite(board.tile)||board.tile<4||
    typeof tileAt!=='function')return Object.freeze([]);
 const marks=[];
 for(let row=0;row<board.rows;row++)for(let column=0;column<board.columns;column++){
  if(tileAt(row,column)!=='glyph')continue;
  const rect=cellRect(board,column,row);
  if(!rect)continue;
  marks.push(Object.freeze({row,column,style:GLYPH_FOLIO_STYLES[marks.length%3],
    rect:Object.freeze({...rect}),material:'glyph',cost:1}));
 }
 return Object.freeze(marks);
}
const trace=(ctx,points)=>{
 ctx.beginPath();ctx.moveTo(...points[0]);
 for(const at of points.slice(1))ctx.lineTo(...at);
};
const face=(ctx,points,fill,stroke,w)=>{
 trace(ctx,points);ctx.closePath();ctx.fillStyle=fill;ctx.fill();
 if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=w;ctx.lineJoin='round';ctx.stroke();}
};
const stitch=(ctx,points,color,w)=>{
 trace(ctx,points);ctx.strokeStyle=color;ctx.lineWidth=w;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke();
};
/** One source-authored layered physical object per real glyph floor cell.
 * No permanent circles, rings, diamonds, radial glows or complete tile rims:
 * those would suggest valid attack/selection, which remains strictly owned
 * by actual TARGET logic. All vertices are within 12–87% of the tile.
 */
export function paintGlyphFolio(ctx,mark){
 if(!ctx||!mark?.rect||!GLYPH_FOLIO_PALETTES[mark.style])return false;
 const {x,y,width:s}=mark.rect,ink=GLYPH_FOLIO_PALETTES[mark.style];
 const at=(u,v)=>[x+s*u,y+s*v],w=Math.max(.8,s*.022);
 ctx.save();ctx.beginPath();ctx.rect(x+1,y+1,s-2,s-2);ctx.clip();
 ctx.globalAlpha=.88;
 if(mark.style==='broken-astral-register'){
  // A star registrar's cracked tri-leaf page. Non-circular, no radial target.
  face(ctx,[at(.13,.31),at(.40,.20),at(.69,.27),at(.86,.47),
    at(.69,.77),at(.42,.81),at(.17,.68)],ink.lip,'#242f35',w*1.25);
  face(ctx,[at(.16,.26),at(.42,.16),at(.68,.25),at(.82,.44),
    at(.66,.70),at(.44,.74),at(.20,.63)],ink.paper,ink.light,w);
  face(ctx,[at(.42,.16),at(.68,.25),at(.53,.41)],ink.light,ink.ink,w*.75);
  // Individually misregistered hand-printed bearings; no target crosshair.
  stitch(ctx,[at(.24,.43),at(.37,.36),at(.50,.43),at(.63,.36),at(.76,.44)],
    ink.ink,w*1.6);
  stitch(ctx,[at(.31,.57),at(.38,.50),at(.50,.54)],ink.foil,w*1.3);
  stitch(ctx,[at(.53,.61),at(.61,.55),at(.71,.57)],ink.ink,w);
  for(const [u,v] of [[.27,.29],[.46,.29],[.68,.59]]){
   face(ctx,[at(u,v),at(u+.035,v+.024),at(u+.008,v+.052)],
     ink.light,ink.ink,w*.6);
  }
  stitch(ctx,[at(.22,.63),at(.38,.70),at(.55,.68)],ink.light,w);
 }else if(mark.style==='binder-tally'){
  // The brass hinge survived, but its ledger strips separated and bent.
  face(ctx,[at(.15,.35),at(.40,.21),at(.76,.31),at(.86,.60),
    at(.66,.83),at(.33,.75)],ink.lip,ink.ink,w*1.2);
  face(ctx,[at(.18,.29),at(.43,.18),at(.73,.29),at(.81,.55),
    at(.65,.76),at(.35,.70)],ink.paper,ink.light,w);
  face(ctx,[at(.25,.36),at(.38,.25),at(.41,.65),at(.29,.67)],ink.ink,ink.light,w*.9);
  face(ctx,[at(.49,.27),at(.62,.28),at(.58,.65),at(.46,.62)],ink.foil,ink.ink,w*.85);
  face(ctx,[at(.65,.31),at(.74,.39),at(.70,.63),at(.62,.67)],ink.ink,ink.light,w*.85);
  for(const [u,v] of [[.30,.38],[.30,.48],[.51,.38],[.51,.49],[.65,.44]]){
   stitch(ctx,[at(u,v),at(u+.06,v-.022)],ink.light,w*.85);
  }
  stitch(ctx,[at(.38,.73),at(.54,.75),at(.70,.70)],ink.light,w*1.05);
 }else{
  // Pressed sprig and editorial stitch—a cipher vine under folding vellum.
  face(ctx,[at(.19,.28),at(.43,.18),at(.64,.22),at(.83,.43),
    at(.74,.71),at(.45,.83),at(.17,.67)],ink.lip,ink.ink,w*1.2);
  face(ctx,[at(.22,.24),at(.45,.16),at(.64,.21),at(.80,.42),
    at(.71,.67),at(.46,.76),at(.20,.62)],ink.paper,ink.light,w);
  stitch(ctx,[at(.29,.64),at(.43,.53),at(.55,.39),at(.63,.26)],ink.ink,w*1.7);
  for(const [a,b,c] of [
   [[.41,.56],[.26,.45],[.44,.39]],
   [[.53,.41],[.43,.29],[.57,.31]],
   [[.49,.48],[.66,.49],[.62,.61]],
   [[.34,.61],[.38,.72],[.50,.63]]
  ]){
   face(ctx,[at(...a),at(...b),at(...c)],ink.foil,ink.ink,w*.65);
   stitch(ctx,[at(...a),at((b[0]+c[0])/2,(b[1]+c[1])/2)],ink.light,w*.65);
  }
  stitch(ctx,[at(.25,.29),at(.35,.25),at(.49,.27)],ink.light,w);
 }
 ctx.restore();return true;
}
export function paintGlyphFolios(ctx,board,tileAt){
 const marks=glyphFolioPlan(board,tileAt);
 if(!ctx||!marks.length)return 0;
 ctx.save();ctx.beginPath();ctx.rect(board.x,board.y,board.mapWidth,board.mapHeight);ctx.clip();
 for(const mark of marks)paintGlyphFolio(ctx,mark);
 ctx.restore();
 return marks.length;
}
