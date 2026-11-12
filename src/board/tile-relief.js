/** Gate A fifteen: physical letterpress bevels per tile, not a new map.
 * Every path is bounded inside an existing tactical cell. Terrain occupancy,
 * collision and hit testing remain owned by geometry/battle engines.
 */
export const TILE_RELIEF_MATERIALS=Object.freeze(['stone','moss','water','rubble','glyph']);
const pigments=Object.freeze({
 stone:{top:'#d6c8a36c',shade:'#182b31b0',fleck:'#e6d4ad75'},
 moss:{top:'#c2c49b70',shade:'#1d3c329d',fleck:'#b9cf8a8f'},
 water:{top:'#abd8d08a',shade:'#142f46ab',fleck:'#ccf0d6a0'},
 rubble:{top:'#e4cc9f85',shade:'#1b2732bb',fleck:'#f0d4a9a1'},
 glyph:{top:'#f6de9b9e',shade:'#39333aa8',fleck:'#ffeab3a1'}
});
const clamp=(x,s)=>Math.max(1,Math.min(s-1,x));
const local=(rect,a,b)=>[rect.x+clamp(a*rect.width,rect.width),rect.y+clamp(b*rect.width,rect.width)];
function stroke(ctx,p,color,width){
 ctx.beginPath();ctx.moveTo(...p[0]);for(const at of p.slice(1))ctx.lineTo(...at);
 ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();
}
function fill(ctx,p,color){
 ctx.beginPath();ctx.moveTo(...p[0]);for(const at of p.slice(1))ctx.lineTo(...at);
 ctx.closePath();ctx.fillStyle=color;ctx.fill();
}
/** Deterministic pen-strokes; all marks are inside the tile border so a
 * raised edge cannot be mistaken for an adjacent legal movement square. */
export function tileReliefPlan(rect,kind,row=0,column=0){
 if(!rect||!pigments[kind]||rect.width<4)return null;
 const p=(x,y)=>local(rect,x,y);
 const shift=(((row*7+column*11)%5)+5)%5*.012;
 const base=[
  [p(.075,.76),p(.075,.11),p(.14,.075),p(.82,.075)],
  [p(.92,.23),p(.925,.85),p(.85,.93),p(.18,.925)]
 ];
 let inset;
 if(kind==='water')inset=[
  [p(.19,.28),p(.32+shift,.25),p(.49,.29),p(.63,.26)],
  [p(.25,.66),p(.39,.635),p(.57,.675),p(.73,.63)]
 ];else if(kind==='moss')inset=[
  [p(.2,.19),p(.30,.23),p(.38,.16)],
  [p(.68,.76),p(.77,.67),p(.82,.78)]
 ];else if(kind==='rubble')inset=[
  [p(.15,.32),p(.23,.18),p(.34,.24)],
  [p(.66,.77),p(.77,.84),p(.85,.74)]
 ];else if(kind==='glyph')inset=[
  [p(.15,.2),p(.25,.15),p(.35,.2)],
  [p(.65,.8),p(.75,.85),p(.85,.8)]
 ];else inset=[
  [p(.14,.19),p(.24,.14),p(.33,.16)],
  [p(.69,.84),p(.78,.78),p(.86,.8)]
 ];
 return Object.freeze({kind,base:Object.freeze(base.map(x=>Object.freeze(x.map(z=>Object.freeze(z))))),
  inset:Object.freeze(inset.map(x=>Object.freeze(x.map(z=>Object.freeze(z))))),
  notch:Object.freeze([p(.13,.12),p(.19,.15),p(.14,.2)].map(x=>Object.freeze(x)))});
}
export function paintTileRelief(ctx,rect,kind,row,column){
 const plan=tileReliefPlan(rect,kind,row,column);if(!ctx||!plan)return false;
 const s=rect.width,ink=pigments[kind];
 ctx.save();
 stroke(ctx,plan.base[0],ink.top,Math.max(.8,s*.026));
 stroke(ctx,plan.base[1],ink.shade,Math.max(.9,s*.037));
 stroke(ctx,plan.inset[0],ink.fleck,Math.max(.65,s*.014));
 stroke(ctx,plan.inset[1],ink.shade,Math.max(.65,s*.015));
 if(kind==='stone'||kind==='rubble')fill(ctx,plan.notch,'#f3e1b02d');
 if(kind==='water')stroke(ctx,[plan.inset[0][0],plan.inset[1][0]],'#143e4a77',Math.max(.7,s*.018));
 if(kind==='glyph')stroke(ctx,plan.notch,ink.fleck,Math.max(.75,s*.018));
 ctx.restore();return true;
}
