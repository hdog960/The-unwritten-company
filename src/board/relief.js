/** The Illuminated Table — original layered-paper relief pass (Gate A v0.09).
 * A dry brush bevel for the world tiles. Pure rendering, no simulation state,
 * cell geometry changes, background images or blocking interface elements.
 */
import {cellRect} from './geometry.js';
export const RELIEF_MATERIALS=Object.freeze(['stone','moss','water','rubble','glyph']);
const PAINT=Object.freeze({
  stone:{light:'#f9d7a03b',shade:'#0e1c2f57',edge:'#ead0a33a'},
  moss:{light:'#d2dc9870',shade:'#173d335e',edge:'#d4dfa74c'},
  water:{light:'#9fe3d572',shade:'#092c4657',edge:'#b4eddf70'},
  rubble:{light:'#e6cfad6c',shade:'#12232ac4',edge:'#eed5ad50'},
  glyph:{light:'#ffe7ac7c',shade:'#23343192',edge:'#ffe8a09e'}
});
function stroke(ctx,points,color,width){
  ctx.beginPath();ctx.moveTo(...points[0]);
  for(const p of points.slice(1))ctx.lineTo(...p);
  ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.stroke();
}
function inset(ctx,rect,kind){
  const {x,y,width:s}=rect,paint=PAINT[kind];
  if(!paint)return false;
  const edge=Math.max(.8,s*.034),depth=Math.max(1.25,s*.075);
  ctx.save();
  ctx.beginPath();ctx.rect(x+1,y+1,s-2,s-2);ctx.clip();
  // Engraved upper lip and stepped lower lip: subtle relief, not a new grid.
  stroke(ctx,[[x+s*.09,y+depth],[x+s*.20,y+edge],[x+s*.82,y+edge]],
    paint.light,Math.max(.8,s*.024));
  stroke(ctx,[[x+s-edge,y+s*.18],[x+s-edge,y+s*.82],[x+s*.82,y+s-edge]],
    paint.shade,Math.max(1,s*.034));
  // Only heavier terrain receives a faceted torn paper shadow; never a
  // tall prop that appears to block an actually walkable tile.
  if(kind==='rubble'){
    ctx.beginPath();ctx.moveTo(x+s*.08,y+s*.84);
    ctx.lineTo(x+s*.20,y+s*.77);ctx.lineTo(x+s*.42,y+s*.91);
    ctx.lineTo(x+s*.67,y+s*.82);ctx.lineTo(x+s*.91,y+s*.95);
    ctx.lineTo(x+s*.09,y+s*.95);ctx.closePath();
    ctx.fillStyle='#15232985';ctx.fill();
  }
  if(kind==='water'){
    ctx.beginPath();ctx.ellipse(x+s*.50,y+s*.23,s*.34,s*.055,-.03,0,Math.PI*2);
    ctx.fillStyle='#b4ecdd32';ctx.fill();
  }
  if(kind==='moss'){
    stroke(ctx,[[x+s*.17,y+s*.88],[x+s*.33,y+s*.84],[x+s*.42,y+s*.88]],
      '#bacc9290',Math.max(.8,s*.019));
  }
  if(kind==='glyph'){
    ctx.beginPath();ctx.arc(x+s*.5,y+s*.5,s*.38,-.9,.65);
    ctx.strokeStyle=paint.edge;ctx.lineWidth=Math.max(1,s*.03);ctx.stroke();
  }
  ctx.restore();return true;
}
export function paintReliefTile(ctx,rect,kind){
  return !!ctx&&!!rect&&inset(ctx,rect,kind);
}
export function paintWorldRelief(ctx,board,materialAt){
  if(!ctx||!board||typeof materialAt!=='function')return 0;
  let total=0;
  ctx.save();ctx.beginPath();ctx.rect(board.x,board.y,board.mapWidth,board.mapHeight);ctx.clip();
  for(let row=0;row<board.rows;row++)for(let column=0;column<board.columns;column++){
    const rect=cellRect(board,column,row);
    if(rect&&paintReliefTile(ctx,rect,materialAt(row,column)))total++;
  }
  ctx.restore();return total;
}

/** Tiny physical cut-ins to the paper/enamel figure base.
 * Pure appearance: wounded, guarded and finished states are supplied by
 * the real command engine. No extra on-board buttons, labels or hitboxes.
 */
export function paintHeroEnamelStatus(ctx,rect,{hp=null,maxHp=null,ward=false,ended=false,fallen=false}={}){
  if(!ctx||!rect)return false;
  const s=rect.width,x=rect.x,y=rect.y;
  const ratio=Number.isFinite(hp)&&Number.isFinite(maxHp)&&maxHp>0?
    Math.max(0,Math.min(1,hp/maxHp)):1;
  ctx.save();
  ctx.beginPath();ctx.rect(x+1,y+1,s-2,s-2);ctx.clip();
  if(fallen||ratio===0){
    // Broken wax stamp: the dead pawn's base stays recognizably inert.
    stroke(ctx,[[x+s*.66,y+s*.84],[x+s*.76,y+s*.75],
      [x+s*.82,y+s*.87]],'#c4a998',Math.max(1,s*.031));
  }else{
    if(ratio<.5){
      const count=ratio<.26?3:2;
      // Slash cuts (rather than another difficult-to-read red HP meter).
      for(let i=0;i<count;i++){
        const px=x+s*(.62+i*.069),py=y+s*.87;
        stroke(ctx,[[px,py],[px+s*.037,py-s*.065]],
          '#ffbe94',Math.max(.9,s*.027));
      }
    }
    if(ward){
      // Carved Oathkeeper-style ward on the *left* of the standing base.
      const cx=x+s*.16,cy=y+s*.72,r=s*.082;
      ctx.beginPath();ctx.moveTo(cx,cy-r);ctx.lineTo(cx+r*.82,cy-r*.36);
      ctx.lineTo(cx+r*.7,cy+r*.56);ctx.lineTo(cx,cy+r);
      ctx.lineTo(cx-r*.7,cy+r*.56);ctx.lineTo(cx-r*.82,cy-r*.36);ctx.closePath();
      ctx.fillStyle='#243a4adc';ctx.fill();ctx.strokeStyle='#d4c4f4';
      ctx.lineWidth=Math.max(.9,s*.027);ctx.stroke();
      stroke(ctx,[[cx-r*.26,cy],[cx,cy+r*.2],[cx+r*.33,cy-r*.27]],
        '#ecf3d9',Math.max(.9,s*.024));
    }
    if(ended){
      // Diagonal etched hatch in the bottom right; subdued because this
      // character cannot take another action this round.
      for(let i=0;i<3;i++){
        const px=x+s*(.72+i*.066),py=y+s*.72;
        stroke(ctx,[[px,py],[px+s*.049,py+s*.065]],
          '#d0be997d',Math.max(1,s*.023));
      }
    }
  }
  ctx.restore();return true;
}
