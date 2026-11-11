/** v0.09 Gate A: battlefield targeting illumination is computed from real
 * command legality. Visual-only; never grants range, AP or combat effects. */
import {abilityPreview,getCommand} from '../commands/engine.js';
import {livingTargetAt} from '../combat/engine.js';
import {cellRect} from './geometry.js';
export const TARGET_INKS=Object.freeze({enemy:'#f6cf8e',self:'#a8e8ce',study:'#d8c291'});
export function computeTargetIndicators(state,board){
  if(!state||!board||!state.abilityId||state.moveMode||!state.positions)return Object.freeze([]);
  const ability=getCommand(state.abilityId);
  if(!ability)return Object.freeze([]);
  const list=[];
  for(let row=0;row<board.rows;row++)for(let column=0;column<board.columns;column++){
    const point=Object.freeze({column,row});
    const preview=abilityPreview({...state,target:point},board);
    if(!preview?.valid)continue;
    const enemy=livingTargetAt(state.targets,point);
    const kind=ability.target==='self'?'self':enemy?'enemy':'study';
    list.push(Object.freeze({point,kind,abilityId:ability.id}));
  }
  return Object.freeze(list);
}
const ink=(ctx,points,color,width)=>{
  ctx.beginPath();ctx.moveTo(...points[0]);for(let i=1;i<points.length;i++)ctx.lineTo(...points[i]);
  ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.stroke();
};
export function paintTargetIndicators(ctx,board,indicators){
  if(!ctx||!board||!Array.isArray(indicators)||!indicators.length)return 0;
  let count=0;
  ctx.save();ctx.beginPath();ctx.rect(board.x,board.y,board.mapWidth,board.mapHeight);ctx.clip();
  for(const target of indicators){
    const rect=cellRect(board,target.point.column,target.point.row);
    if(!rect)continue;
    const s=rect.width,cx=rect.x+s*.5,cy=rect.y+s*.5;
    const color=TARGET_INKS[target.kind];
    if(!color)continue;
    ctx.save();ctx.globalAlpha=target.kind==='study'?.42:.96;
    if(target.kind==='enemy'){
      // Four small brass chevrons sit on the tile margins; the enemy stays legible.
      for(const [dx,dy,sx,sy] of [[-.34,-.34,1,1],[.34,-.34,-1,1],
        [-.34,.34,1,-1],[.34,.34,-1,-1]]){
        const x=cx+dx*s,y=cy+dy*s,arm=s*.105;
        ink(ctx,[[x+sx*arm,y],[x,y],[x,y+sy*arm]],color,Math.max(1.35,s*.034));
      }
      ctx.setLineDash([s*.075,s*.082]);
      ctx.beginPath();ctx.arc(cx,cy,s*.41,0,Math.PI*2);
      ctx.strokeStyle='#f9e3ad';ctx.lineWidth=Math.max(1,s*.018);ctx.stroke();
      ctx.setLineDash([]);
    }else if(target.kind==='self'){
      const r=s*.37;
      for(let i=0;i<6;i++){
        const a=i*Math.PI/3-Math.PI/2,b=(i+1)*Math.PI/3-Math.PI/2;
        ink(ctx,[[cx+Math.cos(a)*r,cy+Math.sin(a)*r],
                 [cx+Math.cos(b)*r,cy+Math.sin(b)*r]],color,Math.max(1,s*.028));
      }
      // Diamond Ward pip, never conceals the hero.
      ctx.beginPath();ctx.moveTo(cx,cy-s*.46);ctx.lineTo(cx+s*.05,cy-s*.39);
      ctx.lineTo(cx,cy-s*.32);ctx.lineTo(cx-s*.05,cy-s*.39);ctx.closePath();
      ctx.fillStyle='#d9fff0';ctx.fill();
    }else{
      // Empty-tile practice has only a faint ground-level enamel mark.
      ctx.beginPath();ctx.ellipse(cx,cy+s*.32,s*.14,s*.042,0,0,Math.PI*2);
      ctx.strokeStyle=color;ctx.lineWidth=Math.max(.8,s*.02);ctx.stroke();
    }
    ctx.restore();count++;
  }
  ctx.restore();return count;
}
