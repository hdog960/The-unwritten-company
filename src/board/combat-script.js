/** Gate A 20 — original miniature-sized manuscript combat calligraphy.
 * The deterministic reducer is the sole authority: this file reads a REAL
 * skillId / hit / miss / critical mark. It does not roll damage, infer target
 * legality, animate on its own, create DOM controls or require any image.
 *
 * Four intentionally different cut-ink signatures, not particle recolors:
 * Strike: thrust and two opposing blade etchings.
 * Spark: jagged fork with enamel droplets.
 * Sigil: four-corner folio and delicate interior stitches.
 * Foe: snagging thorn-quill and broken witness mark.
 */
export const COMBAT_SCRIPT_STYLES=Object.freeze(['strike','spark','sigil','foe']);
const PALETTES=Object.freeze({
 strike:Object.freeze({ink:'#70423c',foil:'#ffdfa5',light:'#f1b48c'}),
 spark:Object.freeze({ink:'#24586a',foil:'#e8fff1',light:'#8dddd7'}),
 sigil:Object.freeze({ink:'#5a5366',foil:'#f7ddac',light:'#cdb7e6'}),
 foe:Object.freeze({ink:'#324539',foil:'#e9bd85',light:'#9db883'})
});
export function combatScriptStyle(mark){
 if(!mark||!['hit','miss','critical'].includes(mark.kind))return null;
 return ['strike','spark','sigil'].includes(mark.skillId)?mark.skillId:'foe';
}
const clamp=n=>Number.isFinite(n)?Math.max(0,Math.min(1,n)):0;
const v=(x,y)=>[x,y];
const line=(ctx,pts,color,width)=>{
 ctx.beginPath();ctx.moveTo(...pts[0]);
 for(let i=1;i<pts.length;i++)ctx.lineTo(...pts[i]);
 ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();
};
const shape=(ctx,pts,fill,stroke,width)=>{
 ctx.beginPath();ctx.moveTo(...pts[0]);for(let i=1;i<pts.length;i++)ctx.lineTo(...pts[i]);
 ctx.closePath();ctx.fillStyle=fill;ctx.fill();
 if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}
};
const dot=(ctx,x,y,r,color)=>{
 ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();
};
/** Immutable source-level geometry descriptions. Flight icons are smaller,
 * impact etchings make physical contact without covering a miniature's face.
 * No generated randomness; all points remain strictly inside ±38 units.
 */
export function combatScriptGeometry(mark,progress=.5,phase='flight'){
 const style=combatScriptStyle(mark);
 if(!style||!['flight','impact'].includes(phase))return null;
 const t=clamp(progress),scale=phase==='flight'?.76:.52;
 const q=pts=>Object.freeze(pts.map(([x,y])=>Object.freeze([x*scale,y*scale])));
 let strokes,shapes;
 if(style==='strike'){
  strokes=[
   [[-23,14],[-8,-9],[9,-20],[24,-19]],
   [[-17,22],[0,13],[13,0],[22,-16]],
   [[-11,-1],[-20,-6],[-13,-12]]];
  shapes=[[[8,-19],[15,-27],[21,-18],[13,-11]]];
 }else if(style==='spark'){
  strokes=[
   [[-25,-17],[-10,-5],[-1,-22],[11,-1],[25,-16]],
   [[-1,-22],[-5,7],[9,20]],
   [[-5,7],[-23,23]],
   [[11,-1],[26,15]]];
  shapes=[[[9,20],[14,24],[7,30],[2,24]]];
 }else if(style==='sigil'){
  strokes=[
   [[0,-28],[27,0],[0,28],[-27,0],[0,-28]],
   [[0,-17],[17,0],[0,17],[-17,0],[0,-17]],
   [[-23,-21],[-12,-21]],[[16,23],[27,23]]];
  shapes=[[[0,-10],[8,0],[0,10],[-8,0]]];
 }else{
  strokes=[
   [[-23,-20],[-10,-12],[-18,4],[-7,12],[1,22]],
   [[-10,-12],[8,-22],[14,-7],[28,-12]],
   [[-7,12],[10,6],[24,19]]];
  shapes=[[[1,22],[9,20],[4,31],[-3,29]]];
 }
 // Real misses use broken non-contact strokes, never a damage seal.
 if(mark.kind==='miss'){
  strokes=strokes.slice(0,2).map(points=>points.slice(0,2));
  shapes=[];
 }
 if(mark.kind==='critical'&&phase==='impact'){
  strokes.push([[-9,31],[0,25],[9,31]]);
  strokes.push([[-8,-31],[0,-25],[8,-31]]);
 }
 const drift=phase==='flight'?(t-.5)*3:0;
 const move=points=>q(points.map(([x,y])=>[x+drift,y]));
 return Object.freeze({style,kind:mark.kind,phase,
  strokes:Object.freeze(strokes.map(move)),
  shapes:Object.freeze(shapes.map(move))});
}
/** Canvas paint at a real projectile head or true target-center point. The
 * existing world-effect renderer clips the entire tactical board; this also
 * clips to the local tile-sized visual footprint. Nothing can spill into rails.
 */
export function paintCombatScript(ctx,focal,mark,progress,phase='flight'){
 const geometry=combatScriptGeometry(mark,progress,phase);
 if(!ctx||!focal||!geometry||!Number.isFinite(focal.s)||focal.s<=0||
  !Number.isFinite(focal.x)||!Number.isFinite(focal.y))return false;
 const {x,y,s}=focal,p=clamp(progress),colors=PALETTES[geometry.style];
 ctx.save();
 ctx.beginPath();ctx.rect(x-s*.4,y-s*.4,s*.8,s*.8);ctx.clip();
 // The impact witness remains in the LOWER-RIGHT margin of the tile rather
 // than drawing over the target miniature's head/face/eye expressions.
 ctx.translate(x+(phase==='impact'?s*.16:0),y+(phase==='impact'?s*.18:0));
 ctx.scale(s/100,s/100);
 ctx.globalAlpha=phase==='flight'?.92:.68*(1-.48*p);
 if(geometry.kind==='miss')ctx.globalAlpha*=.7;
 for(const stroke of geometry.strokes){
  // Two inks produce true raised letterpress structure and contrast against
  // any underlying stone/water/moss at 38px original phone scale.
  line(ctx,stroke,colors.ink,4.2);
  line(ctx,stroke,geometry.kind==='miss'?'#badbd5':colors.foil,2.2);
 }
 for(const fill of geometry.shapes)shape(ctx,fill,colors.light,colors.ink,2);
 if(geometry.kind==='critical'&&phase==='impact'){
  dot(ctx,-23,0,2.5,colors.foil);dot(ctx,23,0,2.5,colors.foil);
 }
 ctx.restore();return true;
}
