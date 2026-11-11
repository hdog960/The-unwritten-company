/** Six bespoke paper-sculpted wound patterns, derived ONLY from real HP and
 * Guard. Original 100-unit ink illustration; no timers, fake hits, network art
 * or additional controls. Worn enemies expose parchment, not numeric popups.
 */
export const CONDITION_INKS=Object.freeze({
 captain:Object.freeze({shell:'#273c47',paper:'#e3d5a8',thread:'#f5e0ad',foil:'#9dc2b1',
  cut:[[39,47],[46,50],[51,47],[57,54],[62,51]],
  tear:[[42,58],[48,53],[56,59],[59,66],[49,63],[44,69],[39,66]],
  seam:[[40,56],[44,61],[50,60],[54,65]]}),
 brunna:Object.freeze({shell:'#53383b',paper:'#f1c38e',thread:'#ffdda7',foil:'#ddad81',
  cut:[[38,46],[43,51],[49,49],[55,55],[63,54]],
  tear:[[40,56],[45,52],[53,56],[59,62],[55,68],[43,68],[36,61]],
  seam:[[40,57],[47,60],[50,65],[57,64]]}),
 kess:Object.freeze({shell:'#243d3b',paper:'#b8d9ae',thread:'#e6e6b8',foil:'#8db7a2',
  cut:[[44,45],[50,49],[48,54],[57,57],[59,62]],
  tear:[[42,58],[49,54],[53,60],[60,62],[58,71],[47,69],[40,65]],
  seam:[[44,53],[45,60],[50,63],[49,70]]}),
 mirelle:Object.freeze({shell:'#302947',paper:'#d2bde7',thread:'#f3dfc2',foil:'#aaa5cf',
  cut:[[43,51],[48,54],[50,49],[56,57],[63,60]],
  tear:[[37,62],[44,55],[50,61],[57,58],[64,68],[58,75],[44,72]],
  seam:[[42,61],[48,65],[53,62],[58,70]]}),
 briar:Object.freeze({shell:'#28362d',paper:'#d6bc83',thread:'#e0d1a0',foil:'#8b9e6e',
  cut:[[37,48],[45,55],[43,60],[53,61],[59,66]],
  tear:[[37,57],[45,55],[51,62],[60,58],[65,69],[52,74],[41,71]],
  seam:[[39,60],[45,65],[52,64],[57,71]]}),
 shade:Object.freeze({shell:'#19253d',paper:'#b4e6e0',thread:'#e2f3e9',foil:'#709fc4',
  cut:[[41,43],[49,47],[47,53],[55,55],[60,60]],
  tear:[[40,52],[46,47],[53,55],[60,51],[65,62],[58,70],[47,65]],
  seam:[[42,54],[49,60],[54,58],[61,65]]})
});
export const FIGURE_CONDITION_LEVELS=Object.freeze(['intact','scuffed','torn']);
const heroIds=new Set(['captain','brunna','kess','mirelle']);
const clamp=n=>Number.isFinite(n)?Math.max(0,Math.min(1,n)):0;
const clean=n=>Math.abs(n)<1e-10?0:n;
export function figureCondition(id,{hp=null,maxHp=null,guard=0,fallen=false,pose=null}={}){
 if(!Object.hasOwn(CONDITION_INKS,id))return null;
 const known=Number.isFinite(hp)&&Number.isFinite(maxHp)&&maxHp>0;
 const ratio=known?clamp(hp/maxHp):1;
 const dead=fallen||(known&&hp<=0);
 const level=dead?'intact':ratio<=.38?'torn':ratio<.85?'scuffed':'intact';
 const ward=!dead&&heroIds.has(id)&&Number.isFinite(guard)&&guard>0;
 const impulse=pose?.kind==='stagger'?1:pose?.kind==='recoil'?.65:0;
 return Object.freeze({id,level,ward,fallen:dead,ratio:clean(ratio),
  pulse:clean(impulse*Math.sin(Math.PI*clamp(pose?.progress)))});
}
const line=(ctx,pts,color,width)=>{
 ctx.beginPath();ctx.moveTo(...pts[0]);for(const p of pts.slice(1))ctx.lineTo(...p);
 ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineJoin='round';ctx.lineCap='round';ctx.stroke();
};
const face=(ctx,pts,color,ink,w)=>{
 ctx.beginPath();ctx.moveTo(...pts[0]);for(const p of pts.slice(1))ctx.lineTo(...p);
 ctx.closePath();ctx.fillStyle=color;ctx.fill();ctx.strokeStyle=ink;ctx.lineWidth=w;ctx.stroke();
};
const bead=(ctx,x,y,r,color)=>{ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();};
function scuff(ctx,ink,state){
 const cut=ink.cut.map(([x,y],i)=>[x+(i%2?-.25:.4)*state.pulse,y+.8*state.pulse]);
 line(ctx,cut,ink.shell,4.3+state.pulse);
 line(ctx,cut,ink.paper,2.3+.5*state.pulse);
 line(ctx,cut.slice(1,4),ink.thread,1.45);
 for(const i of [1,3])bead(ctx,...cut[i],1.25,ink.foil);
}
function tear(ctx,ink,state){
 const points=ink.tear.map(([x,y],i)=>[x+(i%3-1)*state.pulse*.8,y+(i%2?1:-1)*state.pulse*.8]);
 face(ctx,points,ink.shell,ink.paper,2.2);
 face(ctx,[points[1],points[2],points[3],points[4],points[5]],
  ink.paper,ink.shell,1.2);
 line(ctx,ink.seam,ink.foil,3);
 line(ctx,ink.seam,ink.thread,1.25);
 for(let i=0;i<ink.seam.length-1;i++){
  const [x,y]=ink.seam[i],[u,v]=ink.seam[i+1],mx=(x+u)/2,my=(y+v)/2;
  line(ctx,[[mx-2,my+2],[mx+2,my-2]],ink.shell,1.5);
 }
}
function guardStitch(ctx,ink,id){
 const path=ink.seam.slice(0,3);
 line(ctx,path,ink.foil,3.3);line(ctx,path,ink.thread,1.35);
 const [x,y]=path[1];
 face(ctx,[[x,y-4],[x+4,y],[x,y+4],[x-4,y]],ink.paper,ink.shell,1.35);
 if(id==='brunna'){bead(ctx,x-6,y,1.5,ink.thread);bead(ctx,x+6,y,1.5,ink.thread);}
 if(id==='mirelle')line(ctx,[[x-4,y],[x+4,y]],'#ecfff0',1.2);
 if(id==='kess')line(ctx,[[x-5,y-2],[x-8,y-5]],ink.thread,1.2);
}
export function paintFigureCondition(ctx,id,data={}){
 const s=figureCondition(id,data),ink=CONDITION_INKS[id];
 if(!ctx||!s||s.fallen||s.level==='intact'&&!s.ward)return false;
 ctx.save();ctx.beginPath();ctx.rect(2,2,96,96);ctx.clip();
 if(s.level!=='intact')scuff(ctx,ink,s);
 if(s.level==='torn')tear(ctx,ink,s);
 if(s.ward)guardStitch(ctx,ink,id);
 ctx.restore();return true;
}
