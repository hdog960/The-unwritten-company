/** v0.09 Gate A — six authored cut-paper garment and foliage silhouettes.
 * Animated only by the SAME real puppet pose as the physical body/weapon.
 * Never changes movement, collisions, damage, AP, MP or control surfaces.
 * No ambient timers: complete still images at rest save mobile battery.
 */
import {attackBeat} from './combat-beats.js';
const ink=Object.freeze({
 captain:Object.freeze({base:'#28505b',lining:'#7baea7',front:'#547d79',trim:'#edcf97',
  anchor:[49,32],flap:[[32,30],[43,26],[61,28],[71,54],[64,75],[50,73],[26,70]],
  fold:[[34,34],[29,62],[43,69],[49,71]],tab:[[41,50],[47,49],[50,73],[42,77]],
  stitch:[[43,56],[44,65],[46,69]],direction:1}),
 brunna:Object.freeze({base:'#743f47',lining:'#c88875',front:'#98595a',trim:'#f0c494',
  anchor:[48,30],flap:[[28,31],[39,26],[64,28],[77,65],[65,77],[44,75],[23,68]],
  fold:[[31,34],[26,60],[44,72],[52,72]],tab:[[42,48],[55,49],[56,68],[43,72]],
  stitch:[[47,53],[48,62],[51,69]],direction:-1}),
 kess:Object.freeze({base:'#2b5a4e',lining:'#9dbf9f',front:'#426e62',trim:'#d7d59d',
  anchor:[49,32],flap:[[38,28],[53,25],[66,35],[71,60],[58,72],[39,69],[30,59]],
  fold:[[37,35],[29,57],[43,67],[52,70]],tab:[[35,43],[41,40],[44,68],[35,73]],
  stitch:[[38,51],[39,59],[40,66]],direction:1.3}),
 mirelle:Object.freeze({base:'#4a416a',lining:'#c3a2c6',front:'#6b5d83',trim:'#d7c7ee',
  anchor:[50,34],flap:[[38,29],[60,29],[68,54],[73,76],[53,76],[43,78],[28,73]],
  fold:[[38,40],[30,68],[45,76],[56,75]],tab:[[41,58],[58,55],[65,76],[35,78]],
  stitch:[[42,68],[51,71],[59,69]],direction:-.8}),
 briar:Object.freeze({base:'#445a3d',lining:'#a8b381',front:'#5a7548',trim:'#dabd8e',
  anchor:[50,42],flap:[[28,45],[22,57],[32,69],[45,77],[51,69],[65,76],[80,59],[70,44]],
  fold:[[30,52],[37,60],[42,72],[49,67]],tab:[[29,50],[38,51],[37,76],[28,71]],
  stitch:[[32,57],[34,65],[33,72]],direction:-1.15}),
 shade:Object.freeze({base:'#3b4567',lining:'#78a6af',front:'#596b89',trim:'#b4dada',
  anchor:[50,40],flap:[[36,31],[48,26],[61,34],[72,54],[76,77],[60,69],[45,82],[30,66]],
  fold:[[32,47],[26,62],[42,70],[44,78]],tab:[[35,51],[58,57],[67,79],[46,73]],
  stitch:[[44,63],[50,69],[55,74]],direction:1.1})
});
export const CLOTH_IDENTITIES=Object.freeze(Object.keys(ink));
const clamp=v=>Number.isFinite(v)?Math.min(1,Math.max(0,v)):0;
const closed=v=>Math.max(4,Math.min(96,v));
export function clothPose(id,pose=null){
 const item=ink[id];if(!item)return null;
 const t=clamp(pose?.progress),raw=Math.sin(Math.PI*t);
 const pulse=Math.abs(raw)<1e-10?0:raw;
 let fold=0,drop=0;
 if(pose?.kind==='attack'){
  const swing=attackBeat(t).sweep;
  fold=.17*swing;drop=-.035*Math.abs(swing);
 }
 if(pose?.kind==='recoil'){fold=-.13*pulse;drop=.018*pulse;}
 if(pose?.kind==='stagger'){fold=-.23*pulse;drop=.04*pulse;}
 if(pose?.kind==='move'){fold=.085*pulse;drop=-.045*pulse;}
 if(pose?.kind==='ward'){fold=-.07*pulse;drop=-.032*pulse;}
 // Match the fully still frame exactly; negative zero is not a distinct pose.
 return Object.freeze({fold:fold===0?0:fold*item.direction,drop:drop===0?0:drop});
}
export function clothShape(id,pose=null,layer='back'){
 const item=ink[id];if(!item||!['back','front','seam'].includes(layer))return null;
 const points=layer==='back'?item.flap:layer==='front'?item.tab:item.fold;
 const {fold,drop}=clothPose(id,pose),[ax,ay]=item.anchor;
 const alpha=layer==='back'?.77:layer==='front'?.65:.65;
 return Object.freeze(points.map(([x,y],i)=>{
  const depth=Math.max(0,Math.min(1,(y-ay)/48));
  // Only free paper tips flex; the stitched shoulder/root remains attached.
  const bend=fold*depth*39*(.5+.5*i/(points.length-1));
  return Object.freeze([closed(x+bend),closed(y+drop*46*depth*alpha)]);
 }));
}
function outline(ctx,points,fill,stroke,weight){
 ctx.beginPath();ctx.moveTo(...points[0]);
 for(const p of points.slice(1))ctx.lineTo(...p);
 ctx.closePath();ctx.fillStyle=fill;ctx.fill();
 if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=weight;ctx.lineJoin='round';ctx.stroke();}
}
function seam(ctx,points,color,w){
 ctx.beginPath();ctx.moveTo(...points[0]);
 for(const p of points.slice(1))ctx.lineTo(...p);
 ctx.strokeStyle=color;ctx.lineWidth=w;ctx.lineCap='round';ctx.stroke();
}
/** Front and back are separate so cloth passes behind body but above boots.
 * All authoring is on the existing 100-unit canvas miniature, never a UI layer.
 */
export function paintArticulatedCloth(ctx,id,pose=null,layer='back'){
 const item=ink[id];if(!ctx||!item||!['back','front'].includes(layer))return false;
 ctx.save();
 const border=id==='shade'?'#192b47':'#223039';
 const back=clothShape(id,pose,'back');
 if(layer==='back'){
  outline(ctx,back,item.base,border,2.7);
  seam(ctx,clothShape(id,pose,'seam'),item.lining,2);
  // Small gilded paper edging catches light at ordinary 38px phone tiles.
  seam(ctx,[back.at(-3),back.at(-2),back.at(-1)],item.trim,1.35);
  if(id==='briar'){
   seam(ctx,[[33,60],[41,65],[45,74]],'#a1b477',1.75);
   seam(ctx,[[68,61],[61,72]],'#b3b07a',1.7);
  }
  if(id==='shade'){
   const tail=back.at(-1);
   seam(ctx,[[30,65],[39,73],tail],item.lining,1.7);
  }
 }else{
  const front=clothShape(id,pose,'front');
  outline(ctx,front,item.front,border,1.9);
  seam(ctx,front.slice(0,3),item.trim,1.35);
  const stitch=item.stitch;
  const {fold,drop}=clothPose(id,pose);
  seam(ctx,stitch.map(([x,y],i)=>[closed(x+fold*i*4),closed(y+drop*i*4)]),item.lining,1.15);
  if(id==='brunna'){
   // Oathkeeper's tiny hammered metal lock is a separate moving cloth rivet.
   ctx.beginPath();ctx.arc(48+fold*3,57,2.35,0,Math.PI*2);
   ctx.fillStyle='#eacb91';ctx.fill();
  }else if(id==='mirelle'){
   // Two star-script stitches distinguish a scholar's living hem.
   seam(ctx,[[45+fold*2,67],[48,71],[51+fold*2,68]],'#f2e3ce',1.1);
  }else if(id==='kess'){
   seam(ctx,[[36,65],[39+fold*4,71],[42,65]],'#c2d2a3',1.3);
  }
 }
 ctx.restore();return true;
}
