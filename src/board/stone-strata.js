/** Gate A 31 — hand-cut stone strata.
 * A quiet, physically layered replacement for repeated chevron-like floor
 * scratches. This is original paint on existing walkable STONE cells only:
 * no collision, costs, input, timing, RNG, actor state or save changes.
 */
export const STONE_STRATA_STYLES=Object.freeze([
 'limestone-fault','slate-inclusion','sandstone-erosion','ink-worn-slab'
]);
const PIGMENTS=Object.freeze([
 Object.freeze({cut:'#283a3b7d',under:'#111f2b65',edge:'#b8ac8b70',chip:'#d4c19a42'}),
 Object.freeze({cut:'#22353e88',under:'#172b365c',edge:'#c0b5a073',chip:'#91a7a34a'}),
 Object.freeze({cut:'#45403684',under:'#18282c65',edge:'#d2b68a73',chip:'#b49b785c'}),
 Object.freeze({cut:'#24343b79',under:'#16252d60',edge:'#cfc5a183',chip:'#a0aaa451'})
]);
const frac=(r,c,salt)=>{
 let z=Math.imul(r+17,374761393)^Math.imul(c+31,668265263)^Math.imul(salt+11,2246822519);
 z=Math.imul(z^(z>>>13),1274126177);
 return ((z^(z>>>16))>>>0)/4294967296;
};
const freezePath=p=>Object.freeze(p.map(v=>Object.freeze(v)));
/** Immutable native-cell plan, with all source ink inside the 10–90% margin.
 * Three independent strokes, two small chips, and coordinate-seeded grains.
 * In particular there is NO ring, arrow, crosshair, or move/target symbol.
 */
export function stoneStrataPlan(rect,row,column){
 if(!rect||!Number.isFinite(rect.x)||!Number.isFinite(rect.y)||
    !Number.isFinite(rect.width)||rect.width<20||
    !Number.isInteger(row)||!Number.isInteger(column)||row<0||column<0)return null;
 const style=(row*13+column*7)%STONE_STRATA_STYLES.length;
 const s=rect.width, j=(frac(row,column,4)-.5)*.052;
 const p=(a,b)=>[rect.x+s*a,rect.y+s*b];
 const seam=[
  [[.16,.69],[.245,.655],[.31,.595],[.42,.572],[.49,.49]],
  [[.61,.17],[.64,.28],[.69,.355],[.765,.395],[.82,.49]],
  [[.16,.36],[.255,.38],[.355,.365],[.44,.41],[.51,.385]],
  [[.51,.75],[.59,.71],[.68,.72],[.755,.655],[.83,.625]]
 ][style];
 const short=[
  [[.77,.20],[.69,.23],[.625,.29]],
  [[.22,.72],[.27,.65],[.33,.635]],
  [[.66,.79],[.615,.75],[.57,.68]],
  [[.22,.205],[.28,.265],[.365,.26]]
 ][style];
 const chip=[
  [[.165,.705],[.238,.672],[.265,.734],[.208,.77]],
  [[.785,.415],[.832,.458],[.795,.532],[.75,.492]],
  [[.37,.36],[.435,.328],[.462,.397],[.398,.431]],
  [[.67,.69],[.73,.66],[.77,.718],[.706,.77]]
 ][style];
 const notch=[
  [[.71,.205],[.755,.185],[.79,.218]],
  [[.22,.79],[.28,.76],[.31,.81]],
  [[.555,.77],[.58,.815],[.645,.82]],
  [[.23,.23],[.18,.27],[.215,.31]]
 ][style];
 const shifted=points=>freezePath(points.map(([x,y],i)=>p(
  Math.min(.88,Math.max(.12,x+(i%2?j:-j)*.55)),
  Math.min(.88,Math.max(.12,y+(i%2?-j:j)*.55))
 )));
 const grains=Object.freeze(Array.from({length:5},(_,i)=>{
   const a=.18+.61*frac(row,column,40+i),b=.19+.59*frac(row,column,60+i);
   return Object.freeze(p(a,b));
 }));
 return Object.freeze({style:STONE_STRATA_STYLES[style],material:PIGMENTS[style],
  seam:shifted(seam),short:shifted(short),chip:shifted(chip),
  notch:shifted(notch),grains});
}
function stroke(ctx,path,color,width){
 ctx.beginPath();ctx.moveTo(...path[0]);
 for(const point of path.slice(1))ctx.lineTo(...point);
 ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke();
}
function polygon(ctx,path,color){
 ctx.beginPath();ctx.moveTo(...path[0]);
 for(const point of path.slice(1))ctx.lineTo(...point);
 ctx.closePath();ctx.fillStyle=color;ctx.fill();
}
export function paintStoneStrata(ctx,rect,row,column){
 const plan=stoneStrataPlan(rect,row,column);
 if(!ctx||!plan)return false;
 const s=rect.width,m=plan.material;
 ctx.save();
 ctx.beginPath();ctx.rect(rect.x+s*.1,rect.y+s*.1,s*.8,s*.8);ctx.clip();
 // Two registered die-cut layers form a worn physical seam rather than
 // the former repeated arrow-shaped stamp.
 stroke(ctx,plan.seam,m.under,Math.max(.85,s*.044));
 const lit=plan.seam.map(([x,y])=>[x,y-s*.018]);
 stroke(ctx,lit,m.edge,Math.max(.65,s*.018));
 stroke(ctx,plan.seam,m.cut,Math.max(.75,s*.022));
 // Smaller unconnected abrasions; intentionally NOT closed targeting rings.
 stroke(ctx,plan.short,m.edge,Math.max(.7,s*.023));
 stroke(ctx,plan.notch,m.under,Math.max(.65,s*.016));
 polygon(ctx,plan.chip,m.under);
 polygon(ctx,plan.chip.map(([x,y])=>[x,y-s*.017]),m.chip);
 for(let i=0;i<plan.grains.length;i++){
  const [x,y]=plan.grains[i];
  ctx.fillStyle=i%2===0?'#e1d1aa35':'#1b293753';
  ctx.fillRect(x-s*.008,y-s*.006,s*.017,s*.012);
 }
 ctx.restore();return true;
}