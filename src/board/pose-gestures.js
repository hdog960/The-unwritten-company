/** A second paper hinge at each elbow/wrist anchors the six actual weapons
 * to the inked bodies. Drawn only inside the existing 100-point miniature. */
import {figureBeat} from './combat-beats.js';
const ARMS=Object.freeze({
 captain:Object.freeze({left:[[33,43],[28,49],[22,55]],right:[[64,43],[71,49],[74,55]],body:'#79978c',edge:'#e5d3aa',cuff:'#d4b17f'}),
 brunna:Object.freeze({left:[[30,42],[24,51],[18,60]],right:[[69,42],[74,49],[79,56]],body:'#a87a6a',edge:'#edc18e',cuff:'#ce9a72'}),
 kess:Object.freeze({left:[[40,43],[31,49],[26,57]],right:[[60,43],[70,50],[76,60]],body:'#638e78',edge:'#cbd9a5',cuff:'#acb18a'}),
 mirelle:Object.freeze({left:[[40,43],[31,49],[26,58]],right:[[61,42],[73,51],[79,61]],body:'#9485b4',edge:'#d9c9df',cuff:'#b1b8bd'}),
 briar:Object.freeze({left:[[34,48],[25,52],[18,59]],right:[[67,49],[76,53],[84,59]],body:'#698158',edge:'#abb881',cuff:'#7a945d'}),
 shade:Object.freeze({left:[[35,48],[25,53],[18,59]],right:[[65,47],[77,50],[82,59]],body:'#627b9c',edge:'#a2e0d6',cuff:'#709bad'})
});
const clamp=n=>Math.max(4,Math.min(96,n));
const round=n=>Math.round(n*10000)/10000;
export function gestureJoints(id,pose=null){
 const cfg=ARMS[id],move=figureBeat(id,pose);if(!cfg||!move)return null;
 return Object.freeze(['left','right'].map((side,k)=>{
  const sign=k===0?-1:1;
  const points=cfg[side].map(([x,y],i)=>{
   const lever=i===0?0:i===1?.52:1;
   return Object.freeze([round(clamp(x+sign*(move.sweep*6.3+move.turn*.9)*lever)),
    round(clamp(y-(Math.abs(move.sweep)*3.1+move.turn*.65)*lever))]);
  });
  return Object.freeze({side,points:Object.freeze(points)});
 }));
}
const line=(ctx,pts,color,width)=>{
 ctx.beginPath();ctx.moveTo(...pts[0]);for(const p of pts.slice(1))ctx.lineTo(...p);
 ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke();
};
function enamel(ctx,x,y,rx,ry,fill){
 ctx.beginPath();ctx.moveTo(x-rx,y);ctx.lineTo(x,y-ry);ctx.lineTo(x+rx,y);
 ctx.lineTo(x,y+ry);ctx.closePath();ctx.fillStyle=fill;ctx.fill();
 ctx.strokeStyle='#283b43';ctx.lineWidth=1.3;ctx.stroke();
}
export function paintGestureJoints(ctx,id,pose=null){
 const joints=gestureJoints(id,pose),colors=ARMS[id];
 if(!ctx||!joints||!colors)return false;
 ctx.save();
 for(const {side,points} of joints){
  const [shoulder,elbow,hand]=points;
  line(ctx,[shoulder,elbow,hand],'#21303a',6.2);
  line(ctx,[shoulder,elbow,hand],colors.body,4.0);
  line(ctx,[elbow,hand],colors.edge,1.3);
  enamel(ctx,...elbow,2.6,3.0,colors.cuff);
  enamel(ctx,...hand,side==='right'&&id==='brunna'?3.5:2.7,2.8,colors.cuff);
  line(ctx,[[hand[0]-1.5,hand[1]],[hand[0]+1.5,hand[1]]],colors.edge,1.1);
 }
 // Fine enamel witness strokes only while an actual attack is in motion.
 const beat=figureBeat(id,pose);
 if(['anticipation','release','follow-through'].includes(beat.phase)&&Math.abs(beat.sweep)>.06){
  const wrist=joints[id==='kess'?0:1].points.at(-1),m=Math.abs(beat.sweep);
  line(ctx,[[wrist[0]+5,wrist[1]-5],[wrist[0]+5+3*m,wrist[1]-7-3*m]],colors.edge,1.3);
 }
 ctx.restore();return true;
}
