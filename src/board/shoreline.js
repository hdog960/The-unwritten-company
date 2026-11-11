/** The Illuminated Table v0.09 — cross-material painted transition washes.
 * Follows pre-existing terrain classifications. Never creates/removes cells.
 * Hand-drawn shoreline/ivy edges visually connect the diorama's square tiles.
 */
import {cellRect} from './geometry.js';
const hash=(r,c,k=0)=>{
  let n=Math.imul(r+23,374761393)^Math.imul(c+41,668265263)^Math.imul(k+17,2246822519);
  n=Math.imul(n^(n>>>13),1274126177);
  return ((n^(n>>>16))>>>0)/4294967296;
};
export function transitionPairs(board,tileAt){
  if(!board||typeof tileAt!=='function')return Object.freeze([]);
  const out=[];
  for(let row=0;row<board.rows;row++)for(let col=0;col<board.columns;col++){
    const kind=tileAt(row,col);
    for(const [dc,dr] of [[1,0],[0,1]]){
      if(col+dc>=board.columns||row+dr>=board.rows)continue;
      const other=tileAt(row+dr,col+dc);
      if(kind===other)continue;
      if(!['water','moss'].includes(kind)&&!['water','moss'].includes(other))continue;
      out.push(Object.freeze({row,col,vertical:dr===0,kind,other}));
    }
  }
  return Object.freeze(out);
}
const dab=(ctx,x,y,r,fill)=>{
  ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();
};
const line=(ctx,points,color,width)=>{
  ctx.beginPath();ctx.moveTo(...points[0]);
  for(const at of points.slice(1))ctx.lineTo(...at);
  ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.stroke();
};
export function paintMaterialTransitions(ctx,board,tileAt){
  if(!ctx||!board||typeof tileAt!=='function')return 0;
  const pairs=transitionPairs(board,tileAt);
  ctx.save();ctx.beginPath();ctx.rect(board.x,board.y,board.mapWidth,board.mapHeight);ctx.clip();
  for(const p of pairs){
    const r=cellRect(board,p.col,p.row);if(!r)continue;
    const s=r.width;
    const water=p.kind==='water'||p.other==='water';
    const color=water?'#a2d4c5':'#a5ba82';
    const deep=water?'#406c70':'#42674e';
    const borderX=p.vertical?r.x+s:r.x;
    const borderY=p.vertical?r.y:r.y+s;
    ctx.save();
    // The transition is a quiet translucent watercolor wash: the border
    // remains legible, with no repeating arrow- or HUD-like geometry.
    ctx.globalAlpha=.34;
    for(let i=0;i<2;i++){
      const t=.32+i*.38,grain=(hash(p.row,p.col,i)-.5)*s*.03;
      const x=p.vertical?borderX+grain:r.x+s*t;
      const y=p.vertical?r.y+s*t:borderY+grain;
      const tangX=p.vertical?0:1,tangY=p.vertical?1:0;
      const half=s*.072;
      line(ctx,[[x-tangX*half,y-tangY*half],[x+grain*.45,y+grain*.45],
        [x+tangX*half,y+tangY*half]],color,Math.max(.7,s*.019));
      dab(ctx,x,y,Math.max(.65,s*.012),deep);
      if(water){
        // A single pearl glint where the river meets the stone.
        dab(ctx,x+(p.vertical?s*.028:0),y+(p.vertical?0:s*.028),
          Math.max(.55,s*.008),'#e3eaca');
      }else{
        ctx.beginPath();
        ctx.ellipse(x+(p.vertical?s*.034:0),y+(p.vertical?0:s*.034),
          s*.033,s*.013,-Math.PI/5,0,Math.PI*2);
        ctx.fillStyle='#b6c7a1';ctx.fill();
      }
    }
    ctx.restore();
  }
  ctx.restore();return pairs.length;
}
