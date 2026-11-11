/** The Illuminated Table / v0.09 Gate A revision.
 * An original seeded, scalable illuminated-manuscript tile-art pass.
 * Rendering only: no new collision, terrain cost, combat or save state.
 */
const PALETTE=Object.freeze({
  parchment:'#e9d8ad',brass:'#d5ae70',ink:'#253339',moss:'#829b6a',
  salt:'#a2c2b6',coral:'#f2a18a',teal:'#9cddd1',violet:'#b8afd7'
});
export const ATELIER_TERRAINS=Object.freeze(['stone','moss','water','rubble','glyph']);
export const TEAM_INKS=Object.freeze({captain:'#b9e2d0',brunna:'#edbd94',kess:'#c8d9a1',mirelle:'#c7b6f1'});
function hash(r,c,k=0){let n=Math.imul(r+47,374761393)^Math.imul(c+29,668265263)^Math.imul(k+13,2246822519);n=Math.imul(n^(n>>>13),1274126177);return((n^(n>>>16))>>>0)/4294967296;}
function outline(ctx,points,color,width=1.1){
  ctx.beginPath();ctx.moveTo(...points[0]);
  for(let i=1;i<points.length;i++)ctx.lineTo(...points[i]);
  ctx.lineWidth=width;ctx.strokeStyle=color;ctx.stroke();
}
function polygon(ctx,points,fill,stroke='#1b2933',thickness=1){
  ctx.beginPath();ctx.moveTo(...points[0]);for(let i=1;i<points.length;i++)ctx.lineTo(...points[i]);ctx.closePath();
  ctx.fillStyle=fill;ctx.fill();
  if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=thickness;ctx.stroke();}
}
function ellipse(ctx,x,y,rx,ry,fill){
  ctx.beginPath();ctx.ellipse(x,y,Math.max(.5,rx),Math.max(.5,ry),0,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();
}
function circle(ctx,x,y,r,fill){ctx.beginPath();ctx.arc(x,y,Math.max(.4,r),0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();}
function stone(ctx,x,y,s,r,c){
  const grain=hash(r,c,3),grain2=hash(r,c,6);
  const g=ctx.createLinearGradient(x,y,x+s,y+s);
  g.addColorStop(0,grain>.5?'#e8d6aa28':'#dee2c422');
  g.addColorStop(.53,'#7d978000');g.addColorStop(1,'#0c192b4d');
  polygon(ctx,[[x+s*.065,y+s*.09],[x+s*.81,y+s*.06],[x+s*.93,y+s*.15],[x+s*.94,y+s*.88],[x+s*.86,y+s*.94],[x+s*.1,y+s*.91]],g,null);
  outline(ctx,[[x+s*.13,y+s*.15],[x+s*.37,y+s*.13],[x+s*.44,y+s*.19]],'#e9d5ab48',Math.max(.6,s*.018));
  outline(ctx,[[x+s*.73,y+s*.73],[x+s*.82,y+s*.79],[x+s*.85,y+s*.89]],'#1b30366d',Math.max(.6,s*.014));
  for(let i=0;i<9;i++){
    const gx=x+s*(.12+.75*hash(r,c,30+i)),gy=y+s*(.13+.74*hash(r,c,80+i));
    ellipse(ctx,gx,gy,s*(.006+.008*hash(r,c,100+i)),s*.007,i%4===0?'#e0c99970':'#091c2e4a');
  }
  if(grain2>.67){
    outline(ctx,[[x+s*.13,y+s*.74],[x+s*.24,y+s*.68],[x+s*.28,y+s*.73]],'#d2ca9a61',Math.max(.7,s*.015));
    circle(ctx,x+s*.32,y+s*.77,s*.014,'#dcc29d8a');
  }
}
function moss(ctx,x,y,s,r,c){
  const ox=x+s*(.2+.4*hash(r,c,10)),oy=y+s*(.4+.28*hash(r,c,11));
  outline(ctx,[[x+s*.09,y+s*.92],[ox,oy],[x+s*.83,y+s*.12]],'#1d594a9c',Math.max(1,s*.042));
  for(let i=0;i<8;i++){
    const q=i/8,px=x+s*(.15+.7*q),py=y+s*(.85-.6*q);
    const dx=i%2?s*.064:-s*.064,dy=i%2?s*.013:-s*.013;
    ellipse(ctx,px+dx,py+dy,s*.062,s*.031,i%3?'#70965a':'#91ad6c');
    outline(ctx,[[px+dx-s*.03,py+dy],[px+dx+s*.03,py+dy]],'#c0bd8a8b',Math.max(.6,s*.009));
  }
  for(let i=0;i<3;i++){
    const px=x+s*(.18+.55*hash(r,c,300+i)),py=y+s*(.16+.6*hash(r,c,330+i));
    circle(ctx,px,py,s*.023,'#d8c484');circle(ctx,px+s*.003,py-s*.003,s*.01,'#fff0bb');
  }
}
function water(ctx,x,y,s,r,c){
  const g=ctx.createLinearGradient(x,y,x,y+s);
  g.addColorStop(0,'#6cb7b04f');g.addColorStop(.5,'#18466050');g.addColorStop(1,'#081e3280');
  ctx.fillStyle=g;ctx.fillRect(x+s*.07,y+s*.06,s*.86,s*.87);
  for(let i=0;i<6;i++){
    const yy=y+s*(.16+i*.13+hash(r,c,i)*.04);
    const shift=(hash(r,c,i+50)-.5)*s*.1;
    outline(ctx,[[x+s*.19+shift,yy],[x+s*.34+shift,yy-s*.025],[x+s*.55+shift,yy+s*.017],[x+s*.76+shift,yy-s*.015]],
      i%2?'#9ccdc2a4':'#deeed190',Math.max(.7,s*.016));
  }
  // Submerged mosaic fragments shimmer through the dark pool.
  polygon(ctx,[[x+s*.14,y+s*.69],[x+s*.24,y+s*.59],[x+s*.27,y+s*.77]],'#a3b3a54f',null);
  ellipse(ctx,x+s*.76,y+s*.62,s*.11,s*.055,'#749775');
  outline(ctx,[[x+s*.76,y+s*.6],[x+s*.83,y+s*.56]],'#d4d7a4',Math.max(.8,s*.021));
}
function rubble(ctx,x,y,s,r,c){
  for(let i=0;i<7;i++){
    const px=x+s*(.11+.72*hash(r,c,i+17)),py=y+s*(.25+.66*hash(r,c,i+24));
    polygon(ctx,[[px-s*.065,py],[px+s*.035,py-s*.055],[px+s*.08,py+s*.035],[px,py+s*.065]],
      i%3===0?'#b3a68d':i%3===1?'#505e58':'#868677','#24333b',Math.max(.6,s*.013));
  }
  outline(ctx,[[x+s*.15,y+s*.83],[x+s*.33,y+s*.79],[x+s*.48,y+s*.87]],'#e0c6a77d',Math.max(.8,s*.021));
  outline(ctx,[[x+s*.65,y+s*.26],[x+s*.76,y+s*.31]],'#dfc6a57c',Math.max(.8,s*.016));
}
function glyph(ctx,x,y,s,r,c){
  const cx=x+s*.5,cy=y+s*.5;
  ctx.beginPath();ctx.arc(cx,cy,s*.3,0,Math.PI*2);ctx.strokeStyle='#f7d68d9e';ctx.lineWidth=Math.max(1,s*.035);ctx.stroke();
  for(let i=0;i<8;i++){
    const a=(Math.PI*i/4),dx=Math.cos(a),dy=Math.sin(a);
    outline(ctx,[[cx+dx*s*.32,cy+dy*s*.32],[cx+dx*s*.37,cy+dy*s*.37]],'#ffe6a8',Math.max(.8,s*.023));
  }
  const dots=[[.18,.19],[.81,.18],[.18,.8],[.81,.8]];
  for(const [dx,dy]of dots){circle(ctx,x+s*dx,y+s*dy,s*.022,'#dfcb97');}
  outline(ctx,[[cx-s*.13,cy-s*.14],[cx+s*.13,cy+s*.14]],'#0f293870',Math.max(.8,s*.019));
}
export function paintAtelierTile(ctx,rect,kind,row,column){
  if(!ctx||!rect||!ATELIER_TERRAINS.includes(kind))return false;
  const {x,y,width:s}=rect;
  ctx.save();ctx.beginPath();ctx.rect(x+1,y+1,s-2,s-2);ctx.clip();
  if(kind==='stone')stone(ctx,x,y,s,row,column);
  if(kind==='moss'){stone(ctx,x,y,s,row,column);moss(ctx,x,y,s,row,column);}
  if(kind==='water')water(ctx,x,y,s,row,column);
  if(kind==='rubble')rubble(ctx,x,y,s,row,column);
  if(kind==='glyph')glyph(ctx,x,y,s,row,column);
  ctx.restore();return true;
}
export function paintBoardLighting(ctx,board){
  if(!ctx||!board)return false;
  ctx.save();ctx.beginPath();ctx.rect(board.x,board.y,board.mapWidth,board.mapHeight);ctx.clip();
  const warmth=ctx.createRadialGradient(board.x+board.mapWidth*.14,board.y+board.mapHeight*.1,board.tile*.18,board.x+board.mapWidth*.14,board.y+board.mapHeight*.1,board.mapWidth*.87);
  warmth.addColorStop(0,'#f5c67a33');warmth.addColorStop(.47,'#edb16b0c');warmth.addColorStop(1,'#181a2a00');
  ctx.fillStyle=warmth;ctx.fillRect(board.x,board.y,board.mapWidth,board.mapHeight);
  const dusk=ctx.createLinearGradient(0,board.y,0,board.y+board.mapHeight);
  dusk.addColorStop(0,'#040e1b00');dusk.addColorStop(.6,'#07131b04');dusk.addColorStop(1,'#08101c3d');
  ctx.fillStyle=dusk;ctx.fillRect(board.x,board.y,board.mapWidth,board.mapHeight);
  ctx.restore();return true;
}
const health=(hp,max)=>max>0?Math.max(0,Math.min(1,hp/max)):0;
export function paintUnitStand(ctx,rect,id,{active=false,hp=null,maxHp=null,ward=false}={}){
  if(!ctx||!rect)return false;
  const s=rect.width,cx=rect.x+s*.5,cy=rect.y+s*.78,col=TEAM_INKS[id]??PALETTE.parchment;
  ctx.save();
  if(active){
    const glow=ctx.createRadialGradient(cx,cy,2,cx,cy,s*.42);
    glow.addColorStop(0,'#ffecb24b');glow.addColorStop(.68,'#dfc68922');glow.addColorStop(1,'#dfc68900');
    ctx.fillStyle=glow;ctx.fillRect(rect.x,rect.y,s,s);
    ctx.beginPath();ctx.ellipse(cx,cy,s*.34,s*.105,0,0,Math.PI*2);
    ctx.strokeStyle='#ffe1a2';ctx.lineWidth=Math.max(1.5,s*.045);ctx.stroke();
    // Directional crown tick tells the player which miniature is selected.
    polygon(ctx,[[cx,rect.y+s*.055],[cx+s*.075,rect.y+s*.15],[cx,rect.y+s*.2],[cx-s*.075,rect.y+s*.15]],
      '#ffe2a2','#564534',Math.max(.8,s*.014));
  }else{
    ctx.beginPath();ctx.ellipse(cx,cy,s*.29,s*.08,0,0,Math.PI*2);
    ctx.strokeStyle=col+'a6';ctx.lineWidth=Math.max(1,s*.024);ctx.stroke();
  }
  if(hp!==null&&maxHp>0){
    const fraction=health(hp,maxHp);
    ctx.beginPath();ctx.ellipse(cx,cy+s*.11,s*.27,s*.045,0,Math.PI,Math.PI*2);
    ctx.lineWidth=Math.max(1,s*.027);ctx.strokeStyle='#502e39';ctx.stroke();
    ctx.beginPath();ctx.ellipse(cx,cy+s*.11,s*.27,s*.045,0,Math.PI,Math.PI+Math.PI*fraction);
    ctx.lineWidth=Math.max(1.3,s*.038);ctx.strokeStyle=fraction<.32?'#ff9278':col;ctx.stroke();
  }
  if(ward){
    ctx.beginPath();ctx.arc(cx,rect.y+s*.46,s*.39,-.9,Math.PI*.4);
    ctx.setLineDash([s*.09,s*.07]);ctx.strokeStyle='#c5b8f1';ctx.lineWidth=Math.max(1.5,s*.037);ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.restore();return true;
}
