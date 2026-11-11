/** v0.09 Gate A: original setting-specific still-life floor art.
 * Hand-drawn inlays, not collision props, placed only on unoccupied legal cells.
 * The central arena remains unobstructed by controls or text. */
import {cellRect,getTile} from './geometry.js';
const etched=(ctx,points,color,width=1)=>{
  ctx.beginPath();ctx.moveTo(...points[0]);for(let i=1;i<points.length;i++)ctx.lineTo(...points[i]);
  ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.stroke();
};
const dot=(ctx,x,y,r,color)=>{
  ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();
};
const diamond=(ctx,x,y,s,ink)=>{
  etched(ctx,[[x,y-s],[x+s,y],[x,y+s],[x-s,y],[x,y-s]],ink,Math.max(.8,s*.18));
};
export const SCENERY_DESIGNS=Object.freeze(['inkfall-seal','map-fragment','candlemark','vine-crest']);
export function scenicAnchors(board){
  if(!board)return Object.freeze([]);
  const candidates=[
    {column:Math.min(3,board.columns-1),row:0,type:'inkfall-seal'},
    {column:0,row:Math.min(3,board.rows-1),type:'map-fragment'},
    {column:board.columns-1,row:board.rows-1,type:'candlemark'},
    {column:Math.floor(board.columns/2),row:board.rows-1,type:'vine-crest'}
  ];
  const seen=new Set(),anchors=[];
  for(const at of candidates){
    const key=at.column+','+at.row;
    if(seen.has(key)||getTile(at.row,at.column)==='rubble')continue;
    anchors.push(Object.freeze(at));seen.add(key);
  }
  return Object.freeze(anchors);
}
export function paintFloorVignettes(ctx,board,occupants={}){
  if(!ctx||!board)return 0;
  const occupied=new Set(Object.values(occupants||{}).filter(Boolean).map(p=>p.column+','+p.row));
  let drawn=0;
  ctx.save();ctx.beginPath();ctx.rect(board.x,board.y,board.mapWidth,board.mapHeight);ctx.clip();
  for(const anchor of scenicAnchors(board)){
    if(occupied.has(anchor.column+','+anchor.row))continue;
    const rect=cellRect(board,anchor.column,anchor.row);if(!rect)continue;
    const s=rect.width,cx=rect.x+s*.5,cy=rect.y+s*.54;
    ctx.save();ctx.globalAlpha=.63;
    if(anchor.type==='inkfall-seal'){
      // Eight tiny etched printer's marks around the old witness-book seal.
      ctx.beginPath();ctx.arc(cx,cy,s*.27,0,Math.PI*2);
      ctx.strokeStyle='#e9cc8d';ctx.lineWidth=Math.max(1,s*.025);ctx.stroke();
      diamond(ctx,cx,cy,s*.13,'#eddbb3');
      for(let k=0;k<8;k++){
        const a=k*Math.PI/4,rr=s*.34;
        dot(ctx,cx+Math.cos(a)*rr,cy+Math.sin(a)*rr,s*.016,'#e7d3a2');
      }
      etched(ctx,[[cx-s*.13,cy+s*.09],[cx,cy-s*.05],[cx+s*.13,cy+s*.09]],'#543f3e',Math.max(.8,s*.017));
    }else if(anchor.type==='map-fragment'){
      // Curled cartographic lines and old coastline, flat beneath the feet.
      etched(ctx,[[cx-s*.28,cy+s*.17],[cx-s*.17,cy-s*.2],[cx+s*.15,cy-s*.22],[cx+s*.31,cy+s*.08],
        [cx+s*.18,cy+s*.26],[cx-s*.17,cy+s*.22]],'#e9d2a0',Math.max(1,s*.028));
      etched(ctx,[[cx-s*.14,cy+s*.1],[cx-s*.01,cy-s*.09],[cx+s*.11,cy+s*.06],
        [cx+s*.24,cy-s*.01]],'#554e41',Math.max(.8,s*.021));
      for(let j=0;j<3;j++)dot(ctx,cx-s*.1+j*s*.12,cy+s*.12,s*.014,'#f0d9ac');
    }else if(anchor.type==='candlemark'){
      // Wax spill and cut-brass star rather than a tall decorative obstacle.
      ctx.beginPath();ctx.ellipse(cx,cy+s*.08,s*.29,s*.16,-.3,0,Math.PI*2);
      ctx.fillStyle='#c9ad8073';ctx.fill();
      diamond(ctx,cx,cy-s*.06,s*.2,'#f8e0b1');
      dot(ctx,cx,cy-s*.06,s*.05,'#ebac69');
      etched(ctx,[[cx-s*.09,cy+s*.13],[cx+s*.12,cy+s*.13]],'#714d41',Math.max(1,s*.027));
    }else{
      // Pressed leaf silhouette stamped into the stone of a company campsite.
      etched(ctx,[[cx-s*.23,cy+s*.25],[cx+s*.21,cy-s*.23]],'#c9bb8a',Math.max(1,s*.037));
      for(let j=0;j<4;j++){
        const y=cy+s*(.1-j*.115),x=cx+s*(-.06+j*.095);
        etched(ctx,[[x,y],[x-s*.15,y-s*.13],[x-s*.2,y-s*.23],[x,y-s*.15]],'#9cb084',Math.max(1,s*.023));
        etched(ctx,[[x,y],[x+s*.14,y-s*.06],[x+s*.16,y-s*.15]],'#c5c89a',Math.max(.8,s*.023));
      }
    }
    ctx.restore();drawn++;
  }
  ctx.restore();return drawn;
}
