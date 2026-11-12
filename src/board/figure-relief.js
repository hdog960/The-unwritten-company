/** Gate A fifteen: raised hand-cut character sculptures. All six silhouettes
 * are original, individually authored contour pieces instead of generic halos.
 * The existing figure owns positioning, scale, movement and visibility.
 * Rear paint is under the body; finish is over cloth, under weapons/wounds.
 * No timer, RNG, DOM interaction, remote textures or game state mutation.
 */
export const FIGURE_RELIEFS=Object.freeze({
 captain:Object.freeze({contour:[[38,10],[61,9],[67,23],[68,37],[78,54],[71,77],[62,82],[32,82],[22,60],[30,39],[32,24]],
  shade:'#172d36',paper:'#d1c3a3',lit:'#a6cfc3',seam:'#e2c58e',
  facets:[[[35,36],[43,30],[47,35],[41,44]],[[56,35],[64,38],[61,55],[54,50]]],
  etch:[[[35,39],[40,35],[45,37]],[[59,39],[60,48],[57,53]]]}),
 brunna:Object.freeze({contour:[[23,9],[36,14],[42,9],[59,9],[70,15],[79,8],[74,28],[81,44],[83,80],[18,81],[17,46],[28,24]],
  shade:'#3c292f',paper:'#e0b891',lit:'#f3d4aa',seam:'#c98a63',
  facets:[[[26,37],[36,29],[44,39],[39,49]],[[62,31],[76,42],[71,53],[60,44]]],
  etch:[[[28,41],[36,34],[40,39]],[[64,34],[71,42],[67,48]]]}),
 kess:Object.freeze({contour:[[27,17],[40,12],[48,7],[59,10],[74,20],[65,34],[75,54],[71,82],[32,82],[27,55],[32,32]],
  shade:'#223d37',paper:'#b0c5a2',lit:'#bcd9b2',seam:'#d3c589',
  facets:[[[37,37],[44,32],[49,40],[41,47]],[[56,32],[65,42],[62,52],[55,44]]],
  etch:[[[39,39],[43,35],[46,40]],[[59,37],[62,42],[59,47]]]}),
 mirelle:Object.freeze({contour:[[45,7],[54,2],[62,15],[78,22],[70,32],[74,78],[66,83],[28,82],[23,70],[29,29],[24,22]],
  shade:'#302d4b',paper:'#c9b8d6',lit:'#e1d0e9',seam:'#b6bfc8',
  facets:[[[33,40],[43,31],[48,41],[41,53]],[[57,37],[67,39],[67,54],[58,51]]],
  etch:[[[36,43],[43,37],[45,44]],[[60,40],[64,46],[61,52]]]}),
 briar:Object.freeze({contour:[[27,15],[35,24],[43,23],[52,6],[62,25],[74,14],[75,33],[84,56],[76,82],[26,82],[17,55],[25,32]],
  shade:'#293a2a',paper:'#a9ad7b',lit:'#d4cc92',seam:'#c3a66c',
  facets:[[[29,42],[41,35],[46,42],[35,52]],[[61,36],[73,46],[69,57],[58,47]]],
  etch:[[[33,43],[40,39],[41,46]],[[63,41],[68,47],[64,52]]]}),
 shade:Object.freeze({contour:[[48,8],[65,15],[78,36],[81,61],[69,75],[54,90],[43,79],[27,72],[22,53],[31,29]],
  shade:'#1e2b49',paper:'#7294a9',lit:'#bbefe3',seam:'#8ebdc9',
  facets:[[[32,40],[43,26],[48,35],[39,54]],[[57,27],[68,42],[66,57],[58,48]]],
  etch:[[[35,42],[43,34],[45,41]],[[62,37],[67,45],[61,53]]]})
});
export const RELIEF_LAYERS=Object.freeze(['rear','finish']);
const f=(x)=>Math.max(2,Math.min(97,x));
const points=(xs,dx=0,dy=0)=>xs.map(([x,y])=>[f(x+dx),f(y+dy)]);
function shape(ctx,pts,fill,stroke,w){
 ctx.beginPath();ctx.moveTo(...pts[0]);
 for(const p of pts.slice(1))ctx.lineTo(...p);
 ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill();}
 if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=w;ctx.lineJoin='round';ctx.stroke();}
}
function line(ctx,pts,color,w){
 ctx.beginPath();ctx.moveTo(...pts[0]);for(const p of pts.slice(1))ctx.lineTo(...p);
 ctx.strokeStyle=color;ctx.lineWidth=w;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke();
}
export function reliefGeometry(id,layer='rear'){
 const design=FIGURE_RELIEFS[id];if(!design||!RELIEF_LAYERS.includes(layer))return null;
 const slices=layer==='rear'?
  [points(design.contour,2.1,2.8),points(design.contour,.7,1),points(design.contour)]:
  [...design.facets.map(p=>points(p)),...design.etch.map(p=>points(p))];
 return Object.freeze(slices.map(p=>Object.freeze(p.map(x=>Object.freeze(x)))));
}
export function paintFigureRelief(ctx,id,pose=null,layer='rear',fallen=false){
 const art=FIGURE_RELIEFS[id],geo=reliefGeometry(id,layer);
 if(!ctx||!art||!geo||fallen)return false;
 const active=pose?.kind==='attack'&&Number.isFinite(pose.progress)?
  Math.max(0,Math.sin(Math.PI*Math.max(0,Math.min(1,pose.progress)))):0;
 ctx.save();
 if(layer==='rear'){
  // Visible layered bookboard beneath the paper puppet, never over a face.
  ctx.globalAlpha=.9;
  shape(ctx,geo[0],art.shade,'#101c2b',2.7);
  shape(ctx,geo[1],art.paper,art.shade,2.4);
  shape(ctx,geo[2],art.shade,art.seam,1.5);
  line(ctx,geo[2].slice(0,5),art.lit,1.75);
  line(ctx,geo[2].slice(-4),art.paper,1.15);
 }else{
  // Character-specific armor/sleeve facets catch the left candlelight.
  ctx.globalAlpha=.62+active*.19;
  for(let i=0;i<2;i++){
   shape(ctx,geo[i],i===0?art.lit:art.paper,art.shade,1.35);
  }
  ctx.globalAlpha=.85;
  for(let i=2;i<4;i++)line(ctx,geo[i],i===2?art.seam:art.lit,1.35+active*.45);
  // Tiny hand-applied studs make these raised parts real, not glow rings.
  const [x,y]=geo[2][1];
  ctx.beginPath();ctx.arc(x,y,1.3+active*.55,0,Math.PI*2);
  ctx.fillStyle=art.paper;ctx.fill();
 }
 ctx.restore();return true;
}
