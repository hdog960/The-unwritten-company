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
      if(!['water','moss','rubble','glyph'].includes(kind)&&
         !['water','moss','rubble','glyph'].includes(other))continue;
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
    const moss=!water&&(p.kind==='moss'||p.other==='moss');
    const glyph=!water&&!moss&&(p.kind==='glyph'||p.other==='glyph');
    const c=water?'#88c9c2':moss?'#8baa73':glyph?'#d7be7e':'#c8ac8d';
    const dark=water?'#234d58':moss?'#3a694e':glyph?'#9e804d':'#4b4a45';
    const px=p.vertical?r.x+s:r.x,py=p.vertical?r.y:r.y+s;
    ctx.save();
    ctx.globalAlpha=.6;
    for(let i=0;i<3;i++){
      const t=(i+.6)/3.7,wiggle=(hash(p.row,p.col,i)-.5)*s*.042;
      // The thin watercolor bleed crosses the old square seam but never
      // approaches a unit's central hitbox or obstructs target glyphs.
      const x=p.vertical?px+wiggle:r.x+s*t;
      const y=p.vertical?r.y+s*t:py+wiggle;
      const u=s*(.055+.03*hash(p.row,p.col,31+i));
      const dx=p.vertical?0:1,dy=p.vertical?1:0;
      line(ctx,[[x-dy*u,y-dx*u],[x-dy*u*.2+dx*s*.13,y-dx*u*.2+dy*s*.13],
        [x+dy*u,y+dx*u]],c,Math.max(1.05,s*.035));
      dab(ctx,x-dy*s*.025,y-dx*s*.025,s*(water?.017:.024),dark);
      if(moss){
        ctx.beginPath();
        ctx.ellipse(x+dy*s*.065,y+dx*s*.065,s*.063,s*.021,-Math.PI/4,0,Math.PI*2);
        ctx.fillStyle='#a7bc85';ctx.fill();
      }else if(glyph&&i===1){
        dab(ctx,x,y,s*.024,'#f8e1a1');
      }else if(water){
        line(ctx,[[x+dy*u*.5,y+dx*u*.5],[x+dy*u*1.1+dx*s*.048,y+dx*u*1.1+dy*s*.048]],
          '#e6f1d29c',Math.max(.75,s*.013));
      }
    }
    ctx.restore();
  }
  ctx.restore();return pairs.length;
}
