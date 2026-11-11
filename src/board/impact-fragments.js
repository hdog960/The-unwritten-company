/** Original hand-cut paper flecks for the instant after a REAL combat impact.
 * No gameplay RNG, new damage, movement, collision or hit-box changes.
 * Misses shed only pale drifting ink; criticals fracture into more angular marks.
 */
import {cellRect} from './geometry.js';
const COLORS=Object.freeze({
  hit:['#f8d3a1','#ad685f'],critical:['#fff1b4','#ecaa77'],miss:['#a7e5df','#6896a4']
});
const clamp=t=>Number.isFinite(t)?Math.max(0,Math.min(1,t)):0;
export function paintImpactFragments(ctx,board,mark,progress){
  if(!ctx||!board||!mark||!Object.hasOwn(COLORS,mark.kind))return 0;
  const rect=mark.to&&cellRect(board,mark.to.column,mark.to.row);
  if(!rect)return 0;
  const t=clamp(progress);if(t<=0||t>=1)return 0;
  const {x,y,width:s}=rect,cx=x+s*.5,cy=y+s*.5;
  const n=mark.kind==='critical'?9:mark.kind==='hit'?6:4;
  const [light,dark]=COLORS[mark.kind];
  // Direction comes from the actual attack origin, never a visual-only guess.
  const delta=mark.from?{
    x:mark.to.column-mark.from.column,y:mark.to.row-mark.from.row
  }:{x:1,y:0};
  const heading=Math.atan2(delta.y,delta.x);
  const direction=mark.kind==='miss'?-1:1;
  const travel=s*(.17+.16*t),length=s*(.045+.028*(1-t));
  ctx.save();ctx.beginPath();ctx.rect(x+1,y+1,s-2,s-2);ctx.clip();
  ctx.globalAlpha=.88*(1-.77*t);
  for(let i=0;i<n;i++){
    const angle=heading+direction*(i+.25)*Math.PI*2/n + .24*t;
    const dx=Math.cos(angle),dy=Math.sin(angle);
    const px=cx+dx*travel,py=cy+dy*travel;
    const tx=-dy,ty=dx;
    ctx.beginPath();
    if(mark.kind==='miss'){
      // Unbroken curved strokes: an evaded attack cannot look like a hit.
      ctx.moveTo(px-tx*length*.5,py-ty*length*.5);
      ctx.quadraticCurveTo(px+dx*length*.4,py+dy*length*.4,
        px+tx*length*.9,py+ty*length*.9);
      ctx.strokeStyle=i%2?dark:light;
      ctx.lineWidth=Math.max(.9,s*.022);ctx.stroke();
    }else{
      // Embossed angular parchment shards; criticals use a finer second cut.
      ctx.moveTo(px+dx*length,py+dy*length);
      ctx.lineTo(px-tx*length*.56,py-ty*length*.56);
      ctx.lineTo(px-dx*length*.67,py-dy*length*.67);
      ctx.closePath();
      ctx.fillStyle=i%3?light:dark;ctx.fill();
      if(mark.kind==='critical'&&i%2===0){
        ctx.beginPath();
        ctx.moveTo(px+dx*length*.8,py+dy*length*.8);
        ctx.lineTo(px+dx*length*.16+tx*length*.6,py+dy*length*.16+ty*length*.6);
        ctx.strokeStyle='#fff8d7';
        ctx.lineWidth=Math.max(.7,s*.013);ctx.stroke();
      }
    }
  }
  ctx.restore();return n;
}
