/** v0.09 Gate A nineteenth original "hand-torn bookboard" miniature ink.
 * Six bespoke, non-circular edge profiles with tiny inlaid material facets.
 * These paint ON the existing cut-paper miniature, below actual injury and
 * real articulated weapons. They are not hitboxes, targeting UI, or glows.
 */
export const FIGURE_INK_EDGES=Object.freeze({
 captain:Object.freeze({
  paper:'#d4caaa',lit:'#eed6aa',shade:'#1c3b45',enamel:'#a5d8cb',
  left:[[36,31],[30,40],[28,51],[34,63],[36,74]],
  right:[[63,30],[73,39],[73,51],[68,66],[66,73]],
  creases:[[[38,46],[40,52],[38,61]],[[60,43],[62,49],[59,60]]],
  rivets:[[32,47],[67,48],[49,58]]}),
 brunna:Object.freeze({
  paper:'#e8c49e',lit:'#f0d39f',shade:'#543b3e',enamel:'#e4a479',
  left:[[25,33],[18,44],[17,61],[24,74],[32,77]],
  right:[[73,31],[83,45],[81,63],[73,76],[67,77]],
  creases:[[[30,43],[32,54],[39,57]],[[67,41],[66,53],[60,57]]],
  rivets:[[27,48],[73,48],[50,61]]}),
 kess:Object.freeze({
  paper:'#dce5ca',lit:'#f2e8c5',shade:'#314f43',enamel:'#9dc7a5',
  left:[[37,22],[30,32],[33,48],[34,63],[38,74]],
  right:[[63,22],[68,35],[67,49],[64,63],[61,75]],
  creases:[[[40,40],[43,48],[42,56]],[[60,38],[58,48],[59,58]]],
  rivets:[[40,36],[61,40],[50,63]]}),
 mirelle:Object.freeze({
  paper:'#c4c2dc',lit:'#dfd1e5',shade:'#302d4e',enamel:'#8bcfc5',
  left:[[34,19],[28,38],[27,53],[31,71],[35,77]],
  right:[[65,18],[73,35],[75,53],[70,72],[67,77]],
  creases:[[[37,43],[39,54],[34,65]],[[65,42],[62,51],[68,65]]],
  rivets:[[34,49],[70,48],[50,57]]}),
 briar:Object.freeze({
  paper:'#c2bf8a',lit:'#e3d3a3',shade:'#304c3d',enamel:'#a2b989',
  left:[[32,21],[21,40],[24,51],[26,66],[34,76]],
  right:[[67,21],[77,38],[79,53],[73,70],[66,78]],
  creases:[[[32,40],[35,49],[33,60]],[[67,39],[64,49],[66,60]]],
  rivets:[[30,48],[70,48],[50,66]]}),
 shade:Object.freeze({
  paper:'#8ac1c7',lit:'#d2f5e8',shade:'#1c3250',enamel:'#9cd5d0',
  left:[[40,16],[28,35],[24,51],[31,68],[42,78]],
  right:[[61,19],[75,38],[78,51],[70,67],[61,76]],
  creases:[[[37,40],[34,48],[41,61]],[[67,40],[69,50],[62,62]]],
  rivets:[[34,47],[70,48],[50,68]]})
});
const safePoint=([x,y])=>[Math.max(3,Math.min(96,x)),Math.max(3,Math.min(96,y))];
function stroke(ctx,points,color,w){
 const p=points.map(safePoint);ctx.beginPath();ctx.moveTo(...p[0]);
 for(const pt of p.slice(1))ctx.lineTo(...pt);
 ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle=color;ctx.lineWidth=w;ctx.stroke();
}
function bead(ctx,x,y,fill){
 ctx.beginPath();ctx.arc(x,y,1.9,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();
 ctx.beginPath();ctx.arc(x-.4,y-.4,.65,0,Math.PI*2);ctx.fillStyle='#fff2d4';ctx.fill();
}
/** Materials read at 38–70px source tiles. Real guards do not artificially
 * recolor wounds; the HP-specific injury painter is still above these cuts.
 * An actual attack can briefly brighten the material seams using ONLY the
 * already-authentic puppet beat, not a standalone animation/timer.
 */
export function paintFigureEdgeInk(ctx,id,pose=null,{fallen=false}={}){
 const model=FIGURE_INK_EDGES[id];
 if(!ctx||!model||fallen)return false;
 const p=Number.isFinite(pose?.progress)?Math.max(0,Math.min(1,pose.progress)):0;
 const flash=pose?.kind==='attack'?Math.sin(Math.PI*p):0;
 ctx.save();
 // Actual material thickness: dark backing, pale torn-fiber line, tiny
 // asymmetric enamel glint. This must read as an illustration, not a ring.
 for(const side of [model.left,model.right]){
  stroke(ctx,side,model.shade,5.2);
  stroke(ctx,side,model.paper,2.9);
  stroke(ctx,side.slice(0,3),model.lit,1.65+flash*.6);
 }
 for(const crease of model.creases){
  stroke(ctx,crease,model.shade,3.5);
  stroke(ctx,crease,model.enamel,1.45);
 }
 for(const [x,y] of model.rivets)bead(ctx,x,y,model.paper);
 ctx.restore();
 return true;
}
