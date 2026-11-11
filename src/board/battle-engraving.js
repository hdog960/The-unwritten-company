/** Gate A v0.09 — engraved battlefield intent and route markings.
 * World-floor ink only. Rendering consumes authoritative previews and intents;
 * it never resolves combat, alters AP/MP, moves actors or adds tap targets.
 */
import {cellRect} from './geometry.js';

const COLORS=Object.freeze({
  attack:'#f5af96', approach:'#d8c898', travel:'#9be0cb', blocked:'#ee967d'
});
const tileCenter=(board,point)=>{
  const tile=point&&cellRect(board,point.column,point.row);
  return tile?Object.freeze({x:tile.x+tile.width*.5,y:tile.y+tile.height*.5,s:tile.width}):null;
};
function stroke(ctx,points,color,width){
  if(!points.length)return;
  ctx.beginPath();ctx.moveTo(...points[0]);
  for(const p of points.slice(1))ctx.lineTo(...p);
  ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.stroke();
}
function clipBoard(ctx,board){
  ctx.beginPath();ctx.rect(board.x,board.y,board.mapWidth,board.mapHeight);ctx.clip();
}

/** Pure layout data permits deterministic and narrow-phone regression checks. */
export function threatEngravings(board,intents,positions={}){
  if(!board||!Array.isArray(intents))return Object.freeze([]);
  const entries=[];
  for(const intent of intents){
    if(!intent||!intent.victimId||!intent.from)continue;
    const source=tileCenter(board,intent.from);
    const victim=tileCenter(board,positions?.[intent.victimId]);
    if(!source||!victim)continue;
    const dx=victim.x-source.x,dy=victim.y-source.y,dist=Math.hypot(dx,dy);
    if(dist<.1)continue;
    const ux=dx/dist,uy=dy/dist;
    entries.push(Object.freeze({
      foeId:intent.foeId,victimId:intent.victimId,
      attack:intent.attack===true,
      source,victim,
      start:Object.freeze({x:source.x+ux*source.s*.31,y:source.y+uy*source.s*.31}),
      end:Object.freeze({x:victim.x-ux*victim.s*.31,y:victim.y-uy*victim.s*.31})
    }));
  }
  return Object.freeze(entries);
}

/** Sewn-under-footpaths and rim carvings: heroes remain drawn above all strokes. */
export function paintThreatEngravings(ctx,board,intents,positions){
  if(!ctx||!board)return 0;
  const marks=threatEngravings(board,intents,positions);
  if(!marks.length)return 0;
  const totals=new Map();
  for(const mark of marks)totals.set(mark.victimId,(totals.get(mark.victimId)||0)+1);
  const seen=new Set();
  ctx.save();clipBoard(ctx,board);
  for(const mark of marks){
    const {source,victim,start,end,attack,victimId}=mark;
    const color=attack?COLORS.attack:COLORS.approach,s=source.s;
    const dx=end.x-start.x,dy=end.y-start.y,dist=Math.hypot(dx,dy)||1;
    const nx=-dy/dist,ny=dx/dist;
    // Small serpentine stitch engraved on the table, ending short of each pawn.
    const bend=Math.min(s*.14,dist*.09)*(source.x<=victim.x?1:-1);
    ctx.save();ctx.globalAlpha=attack?.76:.57;
    ctx.setLineDash(attack?[s*.12,s*.07]:[s*.035,s*.15]);
    ctx.beginPath();ctx.moveTo(start.x,start.y);
    ctx.bezierCurveTo(start.x+dx*.35+nx*bend,start.y+dy*.35+ny*bend,
      start.x+dx*.65+nx*bend,start.y+dy*.65+ny*bend,end.x,end.y);
    ctx.strokeStyle=color;ctx.lineWidth=Math.max(1,s*.025);ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
    // Source chisel mark; different direction and geometry for closing/attacking.
    const tipX=start.x+dx/dist*s*.075,tipY=start.y+dy/dist*s*.075;
    if(attack){
      stroke(ctx,[[start.x-nx*s*.06,start.y-ny*s*.06],[tipX,tipY],
        [start.x+nx*s*.06,start.y+ny*s*.06]],'#f5d29d',Math.max(.95,s*.024));
    }else{
      stroke(ctx,[[start.x-nx*s*.045,start.y-ny*s*.045],[tipX,tipY]],
        '#c9d6a6',Math.max(.9,s*.02));
    }
    // One outlined rim per threatened tile, even when two enemies target it.
    if(seen.has(victimId))continue;
    seen.add(victimId);
    const x=victim.x,y=victim.y,r=victim.s*.395;
    ctx.save();ctx.globalAlpha=attack?.85:.58;
    ctx.strokeStyle=color;ctx.lineWidth=Math.max(1.4,s*.037);
    ctx.setLineDash(attack?[s*.12,s*.065]:[s*.22,s*.115]);
    ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
    // Notched wax corner at the tile edge signals actual danger without a HUD.
    for(let i=0;i<Math.min(3,totals.get(victimId));i++){
      const px=x-r+i*s*.083,py=y+r*.91;
      stroke(ctx,[[px,py],[px+s*.042,py-s*.068]],color,Math.max(1,s*.024));
    }
    ctx.restore();
  }
  ctx.restore();return marks.length;
}

/** Bookbinder's travel stitches and destination corners, below all figures. */
export function paintTravelEngraving(ctx,board,overlay){
  if(!ctx||!board||overlay?.mode!=='movement')return false;
  const destination=tileCenter(board,overlay.target);
  const route=Array.isArray(overlay.evaluation?.path)?
    overlay.evaluation.path.map(p=>tileCenter(board,p)).filter(Boolean):[];
  if(!destination&&!route.length)return false;
  const valid=overlay.evaluation?.valid===true,color=valid?COLORS.travel:COLORS.blocked;
  const s=board.tile;
  ctx.save();clipBoard(ctx,board);
  if(route.length>1){
    ctx.save();ctx.globalAlpha=valid?.83:.55;
    ctx.strokeStyle=color;ctx.lineWidth=Math.max(1.5,s*.035);ctx.lineJoin='round';
    ctx.lineCap='round';ctx.setLineDash(valid?[s*.085,s*.11]:[s*.04,s*.15]);
    ctx.beginPath();ctx.moveTo(route[0].x,route[0].y);
    for(const p of route.slice(1))if(p)ctx.lineTo(p.x,p.y);
    ctx.stroke();ctx.setLineDash([]);ctx.restore();
    for(let i=1;i<route.length;i++){
      const p=route[i];if(!p)continue;
      // Paired stamped footsteps remain below the miniature bases.
      const j=(i%2?1:-1)*s*.065;
      stroke(ctx,[[p.x-s*.10,p.y+s*.28+j],[p.x-s*.035,p.y+s*.20+j]],
        color,Math.max(.85,s*.025));
      stroke(ctx,[[p.x+s*.008,p.y+s*.30+j],[p.x+s*.07,p.y+s*.22+j]],
        color,Math.max(.85,s*.025));
    }
  }
  if(destination){
    const {x,y}=destination,r=s*.365,a=s*.105;
    // Open brass bookplate corners, not an opaque target square over the hero.
    ctx.save();ctx.globalAlpha=valid?.96:.83;
    for(const [sx,sy] of [[-1,-1],[1,-1],[-1,1],[1,1]])
      stroke(ctx,[[x+sx*(r-a),y+sy*r],[x+sx*r,y+sy*r],
        [x+sx*r,y+sy*(r-a)]],color,Math.max(1.4,s*.034));
    if(!valid){
      // Crosscut shape makes invalidity legible without relying on red alone.
      stroke(ctx,[[x-s*.11,y+s*.28],[x+s*.11,y+s*.43]],color,Math.max(1.5,s*.03));
      stroke(ctx,[[x+s*.11,y+s*.28],[x-s*.11,y+s*.43]],color,Math.max(1.5,s*.03));
    }else{
      stroke(ctx,[[x-s*.08,y+s*.35],[x,y+s*.40],[x+s*.12,y+s*.29]],
        color,Math.max(1,s*.026));
    }
    ctx.restore();
  }
  ctx.restore();return true;
}
