/** The Unwritten Company — Gate A: manuscript-table continuity.
 * Decorative rendering only. Never changes terrain, movement costs, combat
 * results, player input coordinates, or logical board geometry.
 */
import {cellRect} from './geometry.js';
const PALETTE=Object.freeze({captain:'#c5e8d6',brunna:'#f7c39a',kess:'#bedca1',mirelle:'#d4b9f1'});
const seed=(r,c,k=0)=>{
  let z=Math.imul(r+17,741103597)^Math.imul(c+41,1597334677)^Math.imul(k+31,3812015801);
  z=Math.imul(z^(z>>>15),2246822507);
  return ((z^(z>>>13))>>>0)/4294967295;
};
function line(ctx,pts,color,width){
  ctx.beginPath();ctx.moveTo(...pts[0]);
  for(const p of pts.slice(1))ctx.lineTo(...p);
  ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.stroke();
}
function bead(ctx,x,y,r,color){
  ctx.beginPath();ctx.arc(x,y,Math.max(.45,r),0,Math.PI*2);ctx.fillStyle=color;ctx.fill();
}
function poly(ctx,pts,fill,stroke=null,w=1){
  ctx.beginPath();ctx.moveTo(...pts[0]);
  for(const p of pts.slice(1))ctx.lineTo(...p);
  ctx.closePath();ctx.fillStyle=fill;ctx.fill();
  if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=w;ctx.stroke();}
}
function waterJoin(ctx,a,b,row,col){
  const s=a.width,xa=a.x+s*.5,xb=b.x+s*.5,mid=(xa+xb)/2;
  const y=a.y+s*(.47+.05*seed(row,col,2));
  ctx.beginPath();ctx.moveTo(xa-s*.16,y);
  ctx.bezierCurveTo(mid-s*.12,y-s*.13,mid+s*.13,y+s*.14,xb+s*.2,y-.01*s);
  ctx.lineWidth=Math.max(.8,s*.025);
  ctx.strokeStyle='#d0e9d0a3';ctx.stroke();
  ctx.beginPath();ctx.moveTo(xa-s*.12,y+s*.08);
  ctx.bezierCurveTo(mid,y+s*.01,mid,y+s*.19,xb+s*.14,y+s*.09);
  ctx.strokeStyle='#82c3bdaa';ctx.lineWidth=Math.max(.8,s*.016);ctx.stroke();
  // Soft horizontal current makes two water cells read as one stream.
  const sparkleX=mid+s*(.08*seed(row,col,6));
  bead(ctx,sparkleX,y-s*.046,s*.021,'#e2f4d5');
}
function vegetationJoin(ctx,a,b,row,col){
  const s=a.width,cx=a.x+s,cy=a.y+s*(.28+.42*seed(row,col,4));
  const endX=b.x+s*.27,endY=cy+s*(seed(row,col,5)-.5)*.26;
  line(ctx,[[cx-s*.32,cy+s*.15],[cx-s*.05,cy-s*.05],[endX,endY]],'#557d54c9',Math.max(.9,s*.037));
  for(let i=0;i<4;i++){
    const x=cx+s*(i-2)*.12,y=cy+s*.06*Math.sin(i*2+row);
    ctx.beginPath();
    ctx.ellipse(x,y,s*.085,s*.032,-.45,0,Math.PI*2);
    ctx.fillStyle=i%2?'#a3b777c8':'#699462db';ctx.fill();
    line(ctx,[[x-s*.025,y],[x+s*.028,y]],'#d5d1a37a',Math.max(.7,s*.012));
  }
}
function stoneStrap(ctx,a,b,row,col){
  const s=a.width,vertical=seed(row,col,5)>.58;
  if(vertical)return;
  const x=a.x+s*.85,y=a.y+s*(.2+.55*seed(row,col,2));
  line(ctx,[[x-s*.07,y+s*.05],[x+s*.1,y],[x+s*.25,y+s*.02]],'#dbc69d6c',Math.max(.7,s*.013));
  line(ctx,[[x-s*.025,y+s*.09],[x+s*.16,y+s*.06]],'#263c3fb3',Math.max(.7,s*.015));
}
export function paintJoinedTerrain(ctx,board,tileAt){
  if(!ctx||!board||typeof tileAt!=='function')return 0;
  let drawn=0;
  ctx.save();ctx.beginPath();ctx.rect(board.x,board.y,board.mapWidth,board.mapHeight);ctx.clip();
  for(let row=0;row<board.rows;row++)for(let col=0;col<board.columns-1;col++){
    const a=cellRect(board,col,row),b=cellRect(board,col+1,row);
    if(!a||!b)continue;
    const kind=tileAt(row,col),neighbor=tileAt(row,col+1);
    if(kind==='water'&&neighbor==='water'){waterJoin(ctx,a,b,row,col);drawn++;}
    else if(kind==='moss'&&neighbor==='moss'){vegetationJoin(ctx,a,b,row,col);drawn++;}
    else if(kind==='stone'&&neighbor==='stone'&&seed(row,col,8)>.61){
      stoneStrap(ctx,a,b,row,col);drawn++;
    }
  }
  // Vertical seam: water ripple and weeds continue down the same stream.
  for(let row=0;row<board.rows-1;row++)for(let col=0;col<board.columns;col++){
    const kind=tileAt(row,col),neighbor=tileAt(row+1,col);
    if(kind!==neighbor||!['water','moss'].includes(kind))continue;
    const a=cellRect(board,col,row),s=a.width,x=a.x+s*(.33+.31*seed(row,col,12)),y=a.y+s;
    if(kind==='water'){
      line(ctx,[[x,y-s*.2],[x+s*.038,y],[x+s*.13,y+s*.21]],'#b1e1c2ad',Math.max(.8,s*.021));
    }else{
      line(ctx,[[x-s*.11,y-s*.18],[x,y],[x+s*.16,y+s*.21]],'#67916dbb',Math.max(1,s*.027));
      bead(ctx,x+s*.16,y+s*.16,s*.034,'#afd18ca6');
    }
    drawn++;
  }
  ctx.restore();return drawn;
}
function corner(ctx,x,y,dx,dy,s){
  // Original ornamental book-plate knot worked directly into the battlefield rim.
  const a=7*s,b=3.5*s;
  line(ctx,[[x+dx*a,y],[x+dx*b,y+dy*b],[x,y+dy*a]],'#ead7a05a',1.3*s);
  line(ctx,[[x+dx*(a+2*s),y+dy*2*s],[x+dx*(b+2*s),y+dy*(b+2*s)],[x+dx*2*s,y+dy*(a+2*s)]],
    '#8d695eaa',1.15*s);
  bead(ctx,x+dx*2.3*s,y+dy*2.3*s,1.4*s,'#ebc88b');
}
export function paintGutterFiligree(ctx,board){
  if(!ctx||!board)return false;
  const space=Math.min(board.x,board.y,(board.width-board.x-board.mapWidth),(board.height-board.y-board.mapHeight));
  if(space<7)return false;
  const scale=Math.min(1.4,space/11);
  ctx.save();
  const l=board.x-5,t=board.y-5,r=board.x+board.mapWidth+5,b=board.y+board.mapHeight+5;
  corner(ctx,l,t,1,1,scale);corner(ctx,r,t,-1,1,scale);
  corner(ctx,l,b,1,-1,scale);corner(ctx,r,b,-1,-1,scale);
  // Sparse inkblot freckles in the world-frame gutter, not on tappable tiles.
  for(let i=0;i<12;i++){
    const top=i%2===0;
    const x=board.x+(i+.5)/12*board.mapWidth;
    const y=top?board.y-5:board.y+board.mapHeight+5;
    bead(ctx,x,y,Math.max(.6,board.tile*.012),'#f0d9aa69');
  }
  ctx.restore();return true;
}
export function paintUnitEmblem(ctx,rect,id,selected=false){
  if(!ctx||!rect||!Object.hasOwn(PALETTE,id))return false;
  const s=rect.width,cx=rect.x+s*.19,cy=rect.y+s*.84,r=Math.max(2.5,s*.078);
  ctx.save();
  bead(ctx,cx,cy,r+1.8,'#101d28e8');
  bead(ctx,cx,cy,r,'#334951');
  ctx.strokeStyle=PALETTE[id];ctx.lineWidth=Math.max(.9,s*.023);ctx.beginPath();
  if(id==='captain'){
    ctx.moveTo(cx,cy-r*.73);ctx.lineTo(cx+r*.7,cy);ctx.lineTo(cx,cy+r*.73);ctx.lineTo(cx-r*.7,cy);ctx.closePath();
  }else if(id==='brunna'){
    ctx.moveTo(cx-r*.58,cy-r*.55);ctx.lineTo(cx+r*.58,cy-r*.55);ctx.lineTo(cx+r*.58,cy+r*.55);ctx.lineTo(cx-r*.58,cy+r*.55);ctx.closePath();
  }else if(id==='kess'){
    ctx.moveTo(cx-r*.65,cy+r*.5);ctx.quadraticCurveTo(cx-r*.4,cy-r*.9,cx+r*.67,cy-r*.6);
    ctx.quadraticCurveTo(cx+r*.52,cy+r*.62,cx-r*.65,cy+r*.5);
  }else{
    for(let i=0;i<8;i++){
      const theta=i*Math.PI/4-Math.PI/2,rr=i%2===0?r*.75:r*.29;
      const x=cx+Math.cos(theta)*rr,y=cy+Math.sin(theta)*rr;
      if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);
    }
    ctx.closePath();
  }
  ctx.stroke();
  if(selected){
    ctx.beginPath();ctx.arc(cx,cy,r+3,0,Math.PI*2);
    ctx.strokeStyle='#ffe8a8';ctx.lineWidth=1.15;ctx.stroke();
  }
  ctx.restore();return true;
}
export function paintThreatSymbol(ctx,rect,attack){
  if(!ctx||!rect)return false;
  const s=rect.width,cx=rect.x+s*.81,cy=rect.y+s*.18,r=s*.11;
  ctx.save();
  bead(ctx,cx,cy,r+1,'#15232acc');
  ctx.strokeStyle=attack?'#ffa68c':'#dce6b6';
  ctx.fillStyle=attack?'#a95d55':'#697b59';
  ctx.lineWidth=Math.max(1.2,s*.03);
  ctx.beginPath();
  if(attack){
    ctx.moveTo(cx,cy-r*.76);ctx.lineTo(cx+r*.78,cy+r*.68);ctx.lineTo(cx-r*.78,cy+r*.68);
  }else{
    ctx.moveTo(cx-r*.74,cy-r*.35);ctx.lineTo(cx,cy+r*.65);ctx.lineTo(cx+r*.74,cy-r*.35);
  }
  ctx.closePath();ctx.fill();ctx.stroke();
  if(attack){line(ctx,[[cx,cy-r*.33],[cx,cy+r*.12]],'#fff5d0',Math.max(.8,s*.027));bead(ctx,cx,cy+r*.39,Math.max(.6,s*.014),'#fff5d0');}
  ctx.restore();return true;
}
