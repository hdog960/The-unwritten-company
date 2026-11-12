/** Gate A XVI — individually painted character visages, not shared dot eyes.
 * Faces sit on the EXISTING 100-unit paper miniature after head/hair artwork.
 * Expressions respond only to actual puppetPose and authoritative HP, never
 * synthetic damage, unseeded randomness, external artwork or independent timers.
 */
import {attackBeat} from './combat-beats.js';
export const VISAGE_IDENTITIES=Object.freeze(['captain','brunna','kess','mirelle','briar','shade']);
export const VISAGE_STYLES=Object.freeze({
 captain:Object.freeze({center:[50,27.4],gap:3.45,ink:'#24383d',light:'#fff1cb',skin:'#dbb895',accent:'#b4d9bf',signature:'visor'}),
 brunna:Object.freeze({center:[51,27.6],gap:4.4,ink:'#492f32',light:'#fce1ad',skin:'#e6b18a',accent:'#efc185',signature:'braid'}),
 kess:Object.freeze({center:[51,28.6],gap:3.3,ink:'#304944',light:'#fff6d5',skin:'#e6c7a8',accent:'#d7dac2',signature:'roguish'}),
 mirelle:Object.freeze({center:[51,29],gap:3.35,ink:'#34334f',light:'#d8fff1',skin:'#e7c3b3',accent:'#7dd9d3',signature:'lenses'}),
 briar:Object.freeze({center:[51,41],gap:5.2,ink:'#2b392e',light:'#ffc58a',skin:'#8c8560',accent:'#f2ad68',signature:'hollow-bark'}),
 shade:Object.freeze({center:[51,44.5],gap:5.9,ink:'#17304b',light:'#c8fff1',skin:'#5c8292',accent:'#9ef1e6',signature:'ghost-mask'})
});
const clamp=n=>Number.isFinite(n)?Math.min(1,Math.max(0,n)):0;
const clean=n=>Math.abs(n)<1e-10?0:n;
/** Returns exact, frozen *painting* intent. Existing reducer HP decides pain,
 * and only true battle effects decide wince/anticipation. */
export function visageExpression(id,pose=null,{hp=null,maxHp=null,fallen=false}={}){
 if(!VISAGE_STYLES[id])return null;
 const dead=fallen||(Number.isFinite(hp)&&Number.isFinite(maxHp)&&maxHp>0&&hp<=0);
 if(dead)return Object.freeze({id,mood:'fallen',eyeHeight:0,look:0,mouth:0});
 let mood='steady',look=0,eyeHeight=2.6,mouth=0;
 if(pose?.kind==='attack'){
  const arc=attackBeat(clamp(pose.progress));
  mood=arc.phase==='anticipation'?'focused':arc.phase==='rest'?'steady':'fierce';
  look=pose?.bearing?.role==='attack'?pose.bearing.x*1.2:arc.sweep<0?-1.1:1.2;
  eyeHeight=arc.phase==='anticipation'?1.6:2.1;
  mouth=mood==='fierce'?-1:0;
 }else if(pose?.kind==='recoil'||pose?.kind==='stagger'){
  mood=pose.kind==='stagger'?'stunned':'wincing';
  eyeHeight=pose.kind==='stagger'?0:0.65;
  mouth=-2.3;
 }else if(pose?.kind==='ward'){
  mood='resolute';eyeHeight=2.2;mouth=1;
 }
 if(mood==='steady'&&Number.isFinite(hp)&&Number.isFinite(maxHp)&&maxHp>0&&hp/maxHp<.35){
  mood='weary';eyeHeight=1.4;mouth=-1;
 }
 return Object.freeze({id,mood,eyeHeight,look:clean(look),mouth});
}
function line(ctx,p,color,width=1.8){
 ctx.beginPath();ctx.moveTo(...p[0]);for(const xy of p.slice(1))ctx.lineTo(...xy);
 ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineJoin='round';ctx.lineCap='round';ctx.stroke();
}
function polygon(ctx,p,fill,outline,w=1.2){
 ctx.beginPath();ctx.moveTo(...p[0]);for(const xy of p.slice(1))ctx.lineTo(...xy);ctx.closePath();
 ctx.fillStyle=fill;ctx.fill();
 if(outline){ctx.strokeStyle=outline;ctx.lineWidth=w;ctx.stroke();}
}
function dot(ctx,x,y,r,c){
 ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=c;ctx.fill();
}
export function paintVisage(ctx,id,pose=null,condition={}){
 const config=VISAGE_STYLES[id],state=visageExpression(id,pose,condition);
 if(!ctx||!config||!state||state.mood==='fallen')return false;
 const [x,y]=config.center,g=config.gap,e=state.eyeHeight,wince=e<=.7;
 const eyes=[x-g,x+g];
 const gazeY=pose?.kind==='attack'&&pose?.bearing?.role==='attack'?
  pose.bearing.y*.85:0;
 ctx.save();ctx.lineCap='round';
 if(id==='captain'){
  // Under-visor paired eyebrows and a strong, asymmetrical officer's chin.
  line(ctx,[[x-g-2.5,y-4],[x-g+1.4,y-5.1],[x-g+3,y-4.4]],config.ink,1.75);
  line(ctx,[[x+g-2.6,y-4.3],[x+g+.8,y-5],[x+g+2.6,y-4]],config.ink,1.65);
  line(ctx,[[x-2,y+3.4],[x+1,y+4.4],[x+3,y+3.5]],'#785b4e',1.35);
 }else if(id==='brunna'){
  // Heavy oathkeeper brows, tiny bronze cheek/brass braid clasps.
  polygon(ctx,[[x-g-3,y-5],[x-g+1.5,y-5.3],[x-g+3.1,y-3.7],[x-g-2,y-3.4]],'#754437',config.ink,1);
  polygon(ctx,[[x+g-3.2,y-3.7],[x+g-1.2,y-5.3],[x+g+3,y-5],[x+g+2,y-3.4]],'#754437',config.ink,1);
  dot(ctx,x-6.7,y+14,1.65,config.light);dot(ctx,x+6.7,y+14,1.65,config.light);
  line(ctx,[[x-4,y+5],[x,y+6.5],[x+4,y+5]],'#e1a477',1.4);
 }else if(id==='kess'){
  // Sideways, unequal brows and an unrepentant half-smile.
  line(ctx,[[x-g-2.2,y-4.3],[x-g+.9,y-5.6],[x-g+3,y-4.6]],config.ink,1.4);
  line(ctx,[[x+g-2.2,y-4.6],[x+g+2.7,y-4.1]],config.ink,1.55);
  line(ctx,[[x-2.2,y+4],[x+.7,y+4.6],[x+3.8,y+2.8]],'#975f58',1.45);
  // Metal earring reinforces the pale-haired portrait identity.
  dot(ctx,x+10.2,y+.8,1.35,'#f5d69a');
  line(ctx,[[x+9.8,y+1.4],[x+9.4,y+4]],'#d8b88d',1.05);
 }else if(id==='mirelle'){
  // Split scholar spectacles, copper bridge and a calm arcane gaze.
  for(const xx of eyes){
   ctx.beginPath();ctx.ellipse(xx,y+.1,3.25,2.65,0,0,Math.PI*2);
   ctx.strokeStyle='#d7c391';ctx.lineWidth=1.35;ctx.stroke();
  }
  line(ctx,[[eyes[0]+3.1,y-.2],[eyes[1]-3.1,y-.2]],'#e2cda0',1.15);
  dot(ctx,eyes[0]-.7,y-.65,.8,'#b1fff0');
  line(ctx,[[x-2.7,y+5],[x+2.3,y+5.7]],'#a67180',1.2);
 }else if(id==='briar'){
  // Hollow knotholes with amber living sap and etched bark nose.
  for(const xx of eyes){
   polygon(ctx,[[xx-3,y-2],[xx+1,y-4.1],[xx+3,y],[xx+1,y+2.5],[xx-3,y+1]],
    config.ink,'#7b956c',1.1);
   if(!wince)dot(ctx,xx+state.look*.36,y+.15,Math.max(1.2,e*.8),config.accent);
  }
  line(ctx,[[x-1,y+3],[x+1.5,y+6.2],[x-.5,y+8]],'#c2b086',1.45);
 }else{
  // Shade has a hollow bell-face rather than generic human eyes.
  polygon(ctx,[[x-13,y-10],[x+4,y-14],[x+13,y-4],[x+11,y+9],
   [x+1,y+13],[x-10,y+6]],'#142d43','#93c9cb',1.45);
  for(const xx of eyes){
   line(ctx,[[xx-2,y-1.8],[xx+1+state.look*.35,y+e*.65+gazeY],
     [xx+2.6,y+2.4]],config.light,1.85);
  }
  line(ctx,[[x-4,y+8],[x+2,y+9],[x+6,y+6]],'#7bdbd2',1.3);
 }
 if(id!=='briar'&&id!=='shade')for(const xx of eyes){
  if(wince){
   line(ctx,[[xx-2.6,y],[xx+.2,y-1.2],[xx+2.7,y+.7]],config.ink,2.1);
  }else{
   line(ctx,[[xx-2.7,y-.8],[xx,y+e*.45],[xx+2.8,y-.8]],config.ink,2.0);
   dot(ctx,xx+state.look*.3,y+.5+gazeY,Math.max(.65,e*.45),config.ink);
   dot(ctx,xx-1,y-.65,.65,config.light);
  }
 }
 if(id!=='briar'&&id!=='shade'&&state.mouth<0){
  line(ctx,[[x-2,y+5],[x,y+4],[x+3,y+5]],'#724e4f',1.55);
 }
 ctx.restore();
 return true;
}
