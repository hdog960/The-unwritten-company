/** Gate A 20 — discreet lacquer-paper contrast pockets underneath REAL
 * six miniature silhouettes, not selectable halos. Readability over water,
 * gold glyphs, and detailed ivy without washing out enemy target corners.
 * Draw AFTER terrain and legal floor marks but BEFORE native figure art.
 */
export const MATTE_IDS=Object.freeze(['captain','brunna','kess','mirelle','briar','shade']);
export const MATTE_MATERIALS=Object.freeze(['stone','moss','water','rubble','glyph']);
const settings=Object.freeze({
 captain:Object.freeze({edge:'#c7d5bf',ink:'#213c41',crease:'#9fc3ac',angle:3}),
 brunna:Object.freeze({edge:'#e2bd97',ink:'#4c3337',crease:'#d89c78',angle:-4}),
 kess:Object.freeze({edge:'#cfdbc0',ink:'#2e4d43',crease:'#b4d49e',angle:6}),
 mirelle:Object.freeze({edge:'#c6bad7',ink:'#31364f',crease:'#ada5d2',angle:-6}),
 briar:Object.freeze({edge:'#aeb88b',ink:'#2d4737',crease:'#bbc68b',angle:5}),
 shade:Object.freeze({edge:'#a5d4ce',ink:'#203c53',crease:'#a8dbd4',angle:-3})
});
/** Small rear cutout occupies the middle 68% of the cell; no opaque tile fill
 * and no expansion into adjacent squares, HUD, target corners or buttons. */
export function miniatureMattePlan(id,terrain='stone',{fallen=false}={}){
 if(!MATTE_IDS.includes(id)||!MATTE_MATERIALS.includes(terrain)||fallen)return null;
 const k=settings[id],quiet=terrain==='water'||terrain==='glyph';
 const contours=Object.freeze([
  Object.freeze([[25,70],[19,53],[25,38],[36,30],[53,28],[67,34],[78,49],[72,68],[61,77],[38,78]]),
  Object.freeze([[28,70],[24,54],[29,42],[40,35],[57,34],[71,45],[72,62],[63,72],[39,73]])]);
 return Object.freeze({id,terrain,quiet,color:k,contours});
}
function path(ctx,pts){
 ctx.beginPath();ctx.moveTo(...pts[0]);
 for(const point of pts.slice(1))ctx.lineTo(...point);ctx.closePath();
}
/** Source miniature accepts existing rect; no layout mutation. */
export function paintMiniatureMatte(ctx,rect,id,terrain='stone',options={}){
 const plan=miniatureMattePlan(id,terrain,options);
 if(!ctx||!rect||!plan||!Number.isFinite(rect.width)||rect.width<=0)return false;
 const s=rect.width;
 ctx.save();ctx.beginPath();ctx.rect(rect.x+1,rect.y+1,s-2,s-2);ctx.clip();
 ctx.translate(rect.x,rect.y);ctx.scale(s/100,s/100);
 // Keep the painted center subtle: all real marks and creature silhouettes
 // remain above this, while dark edge aids distinguishing pale hair/armor.
 ctx.globalAlpha=plan.quiet?.46:.58;
 path(ctx,plan.contours[0]);
 ctx.fillStyle=plan.color.ink;ctx.fill();
 ctx.strokeStyle=plan.color.edge;ctx.lineWidth=3.3;ctx.stroke();
 ctx.globalAlpha=plan.quiet?.28:.42;
 path(ctx,plan.contours[1]);ctx.fillStyle='#c2b39a';ctx.fill();
 // Exposed folded paper edges and half-lit debossed score.
 ctx.beginPath();ctx.moveTo(25,70);ctx.lineTo(38,78);ctx.lineTo(61,77);
 ctx.strokeStyle=plan.color.crease;ctx.lineWidth=2.2;ctx.stroke();
 // Three small pinpricks are ornamental fibers, not damage/target markers.
 for(const [x,y] of [[29,59],[67,58],[51,35]]){
  ctx.beginPath();ctx.arc(x,y,1.1,0,Math.PI*2);
  ctx.fillStyle=plan.color.edge;ctx.fill();
 }
 ctx.restore();return true;
}
