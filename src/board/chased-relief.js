/** v0.09 Gate A 23: six hand-chased front faces for the true paper miniatures.
 * These are physical enamel/silk/bark cutouts, not UI signs, indicators,
 * damage numbers, interactions, remote sprites, or new gameplay state.
 * Every pen stroke is on the torso/below the face, in the figure's original
 * 100-point local sculptural coordinates. Shared motion owns transforms.
 */
export const CHASED_IDS=Object.freeze(['captain','brunna','kess','mirelle','briar','shade']);
export const CHASED_STYLES=Object.freeze({
 captain:Object.freeze({material:'guild-mail',outer:'#253e49',ground:'#547d80',light:'#d9d4b0',foil:'#eed099',cut:'#18333e',
  outline:[[41,50],[47,46],[58,47],[62,53],[59,67],[44,69],[39,62]],
  facet:[[44,51],[51,48],[56,51],[54,61],[46,64]],
  stitch:[[41,55],[46,57],[51,55],[57,58],[60,56]],rivet:[[44,65],[58,64]],shoulder:[[36,49],[42,45],[46,47]]}),
 brunna:Object.freeze({material:'oath-plate',outer:'#4f353c',ground:'#9d6d58',light:'#f6c894',foil:'#ffdc9d',cut:'#673c3d',
  outline:[[34,54],[44,52],[56,53],[66,51],[69,65],[59,72],[39,71],[32,64]],
  facet:[[39,58],[48,55],[59,58],[62,67],[48,68],[38,64]],
  stitch:[[35,61],[43,58],[51,62],[61,58],[67,61]],rivet:[[37,67],[63,68]],shoulder:[[30,50],[35,45],[40,52]]}),
 kess:Object.freeze({material:'leaf-leather',outer:'#29433d',ground:'#4c7b62',light:'#d3e4af',foil:'#e7ddac',cut:'#294e43',
  outline:[[42,48],[49,45],[57,47],[60,56],[56,70],[44,70],[39,60]],
  facet:[[45,51],[52,47],[58,52],[54,62],[45,64]],
  stitch:[[43,60],[49,57],[54,58],[57,55]],rivet:[[45,66],[55,66]],shoulder:[[37,49],[43,46],[47,49]]}),
 mirelle:Object.freeze({material:'scholar-folio',outer:'#38364f',ground:'#756e9b',light:'#d6c5e8',foil:'#b4eee0',cut:'#383c58',
  outline:[[41,53],[49,50],[57,53],[62,59],[66,73],[34,73],[39,60]],
  facet:[[42,56],[50,53],[59,57],[56,68],[43,69]],
  stitch:[[38,66],[44,62],[50,67],[57,62],[62,66]],rivet:[[41,70],[59,70]],shoulder:[[38,53],[43,49],[47,53]]}),
 briar:Object.freeze({material:'thorn-bark',outer:'#293e32',ground:'#65865d',light:'#cfce92',foil:'#f0ca8e',cut:'#365240',
  outline:[[35,56],[46,53],[56,55],[64,54],[69,66],[58,74],[40,72],[33,66]],
  facet:[[39,59],[48,56],[57,62],[56,69],[43,68]],
  stitch:[[35,64],[43,60],[48,66],[57,61],[66,67]],rivet:[[40,69],[62,69]],shoulder:[[31,54],[37,48],[42,56]]}),
 shade:Object.freeze({material:'bell-ectoplasm',outer:'#1c314d',ground:'#4a718e',light:'#a2d6d6',foil:'#dcf4e0',cut:'#283e5a',
  outline:[[39,55],[49,51],[59,56],[65,65],[60,75],[49,72],[36,75],[34,65]],
  facet:[[44,57],[52,55],[61,63],[55,69],[44,68]],
  stitch:[[39,65],[45,61],[50,66],[56,61],[62,66]],rivet:[[44,70],[57,70]],shoulder:[[32,56],[39,50],[43,55]]})
});
const valid=(p)=>Array.isArray(p)&&p.length>=3&&p.every(v=>Array.isArray(v)&&v.length===2&&v.every(n=>Number.isFinite(n)&&n>=24&&n<=76));
const clamp=n=>Number.isFinite(n)?Math.max(0,Math.min(1,n)):0;
const freezePath=p=>Object.freeze(p.map(x=>Object.freeze([...x])));
/** A documented immutable physical illustration, no time or network inputs.
 * The impact/attack glow is allowed ONLY when there is a native puppet pose.
 * Face region remains untouched by ALL inlay artwork.
 */
export function chasedReliefPlan(id,pose=null,{fallen=false}={}){
 const design=CHASED_STYLES[id];if(!design||fallen)return null;
 const paths=[design.outline,design.facet,design.stitch,design.shoulder];
 if(!paths.every(valid)||!design.rivet.every(([x,y])=>x>=24&&x<=76&&y>=50&&y<=76))return null;
 const t=clamp(pose?.progress);
 const energy=pose?.kind==='attack'||pose?.kind==='ward'?
  Math.sin(Math.PI*t):0;
 return Object.freeze({
  id,material:design.material,colors:Object.freeze({
   outer:design.outer,ground:design.ground,light:design.light,foil:design.foil,cut:design.cut
  }),
  outline:freezePath(design.outline),facet:freezePath(design.facet),
  stitch:freezePath(design.stitch),shoulder:freezePath(design.shoulder),
  rivet:freezePath(design.rivet),energy
 });
}
const poly=(ctx,points,fill,stroke,w)=>{
 ctx.beginPath();ctx.moveTo(...points[0]);for(const at of points.slice(1))ctx.lineTo(...at);
 ctx.closePath();ctx.fillStyle=fill;ctx.fill();
 if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=w;ctx.lineJoin='round';ctx.stroke();}
};
const pen=(ctx,points,color,w)=>{
 ctx.beginPath();ctx.moveTo(...points[0]);for(const at of points.slice(1))ctx.lineTo(...at);
 ctx.strokeStyle=color;ctx.lineWidth=w;ctx.lineJoin='round';ctx.lineCap='round';ctx.stroke();
};
const stud=(ctx,x,y,ink,edge,size=1.7)=>{
 ctx.beginPath();ctx.arc(x,y,size,0,Math.PI*2);ctx.fillStyle=ink;ctx.fill();
 ctx.strokeStyle=edge;ctx.lineWidth=1;ctx.stroke();
};
/** Draw *inside* existing animated figure transforms. Strong light-dark
 * cut edges support visibility on dark moss and white glyphs, while distinct
 * physical body designs remain under active weapons, actual HP wear and faces.
 */
export function paintChasedRelief(ctx,id,pose=null,options={}){
 const plan=chasedReliefPlan(id,pose,options);if(!ctx||!plan)return false;
 const c=plan.colors,fire=plan.energy;
 ctx.save();
 // Structural dark die-cut lip and offset colored undersheet, not a screen
 // halo or glow ring. Larger silhouette facets remain inside the torso.
 ctx.globalAlpha=.94;
 poly(ctx,plan.outline,c.outer,c.cut,3.7);
 poly(ctx,plan.facet,c.ground,c.light,2.25);
 ctx.globalAlpha=.8+fire*.18;
 pen(ctx,plan.shoulder,c.light,2.4+fire*.45);
 pen(ctx,plan.stitch,c.foil,2.5+fire*.58);
 pen(ctx,plan.stitch.slice(1,4),c.cut,1);
 for(const [x,y] of plan.rivet)stud(ctx,x,y,c.foil,c.cut,1.8+fire*.35);
 if(id==='captain'){
  // An original illuminated guild press-mark and unbalanced mail scores.
  poly(ctx,[[47,56],[51,51],[55,56],[51,63]],c.foil,c.cut,1.3);
  pen(ctx,[[46,60],[51,65],[56,60]],c.light,1.6);
 }else if(id==='brunna'){
  // Two wide riveted bands and a broken oath-latch.
  pen(ctx,[[39,62],[47,64],[55,64],[63,61]],c.light,2.2);
  poly(ctx,[[48,58],[53,58],[55,64],[49,66],[45,63]],c.foil,c.cut,1.5);
 }else if(id==='kess'){
  // A hooked, asymmetrical leaf clasp, not an identical mini-emblem.
  poly(ctx,[[44,58],[47,53],[54,54],[56,61],[50,65]],c.light,c.cut,1.4);
  pen(ctx,[[46,61],[53,57],[58,53]],c.foil,1.4);
 }else if(id==='mirelle'){
  // Open overlapping manuscript leaves on the lower robe and plumb line.
  poly(ctx,[[42,59],[49,56],[51,66],[44,70]],c.light,c.cut,1.4);
  poly(ctx,[[51,56],[59,60],[58,69],[51,66]],c.ground,c.foil,1.4);
  pen(ctx,[[50,58],[50,69]],c.foil,1.6);
 }else if(id==='briar'){
  // Jagged living-bark crest and original thorn joints.
  poly(ctx,[[44,62],[49,56],[54,63],[58,59],[59,67],[49,71]],c.light,c.cut,1.6);
  pen(ctx,[[47,69],[50,64],[54,66]],c.foil,1.7);
 }else{
  // Three fractured bell echoes: inked scallops, not a ward/target ring.
  pen(ctx,[[42,60],[47,65],[51,61],[56,66],[60,62]],c.foil,2.2);
  pen(ctx,[[43,69],[50,71],[58,69]],c.light,1.8);
  poly(ctx,[[49,63],[53,65],[50,69],[46,65]],c.ground,c.foil,1.2);
 }
 ctx.restore();return true;
}
