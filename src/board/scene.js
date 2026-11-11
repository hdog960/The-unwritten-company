import {cellRect,getTile,hitTestBoard,logicalPointFromClient,measureBoard} from './geometry.js';

const COLOR={ink:'#151f2a',sand:'#ac9579',light:'#e5cfaa',moss:'#476b50',water:'#305d70',gold:'#dfbb76',coral:'#d97e68'};
const FRACTAL=(x,y,salt=0)=>{let z=Math.imul(x+23,92837111)^Math.imul(y+41,689287499)^Math.imul(salt+77,283923481);z^=z>>>13;return((Math.imul(z,1274126177)>>>0)%100000)/100000;};
function poly(ctx,points,fill,stroke,width=1) {
  ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);
  for(let i=1;i<points.length;i++)ctx.lineTo(points[i][0],points[i][1]);
  ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.lineWidth=width;ctx.strokeStyle=stroke;ctx.stroke();}
}
function line(ctx,points,stroke,width=1){
  ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);
  for(let i=1;i<points.length;i++)ctx.lineTo(points[i][0],points[i][1]);
  ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();
}
function ellipse(ctx,x,y,rx,ry,fill){
  ctx.beginPath();ctx.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),0,0,Math.PI*2);
  ctx.fillStyle=fill;ctx.fill();
}
function disk(ctx,x,y,r,fill,stroke=null,width=1){
  ctx.beginPath();ctx.arc(x,y,Math.max(.1,r),0,Math.PI*2);
  ctx.fillStyle=fill;ctx.fill();
  if(stroke){ctx.lineWidth=width;ctx.strokeStyle=stroke;ctx.stroke();}
}
function paintBackdrop(ctx,board){
  const sky=ctx.createRadialGradient(board.width*.5,board.height*.36,12,board.width*.5,board.height*.4,board.width*.88);
  sky.addColorStop(0,'#5c4f42');sky.addColorStop(.65,'#322c31');sky.addColorStop(1,'#141d2a');
  ctx.fillStyle=sky;ctx.fillRect(0,0,board.width,board.height);
  // Parchment-glazed chips around the world-edge: stage-only art, no UI.
  for(let n=0;n<34;n++){
    const a=(n/34)*Math.PI*2,r=.5+FRACTAL(n,8)*.22;
    const px=board.width*(.5+r*Math.cos(a)),py=board.height*(.5+r*Math.sin(a));
    ellipse(ctx,px,py,2+FRACTAL(n,2)*4,1.4,'#c79f6430');
  }
  ctx.fillStyle='#110f16aa';ctx.fillRect(board.x-4,board.y+4,board.mapWidth+8,board.mapHeight+7);
  ctx.fillStyle='#c19b65';ctx.fillRect(board.x-5,board.y-5,board.mapWidth+10,board.mapHeight+10);
  ctx.fillStyle='#3a3430';ctx.fillRect(board.x-3,board.y-3,board.mapWidth+6,board.mapHeight+6);
}
function drawStone(ctx,x,y,s,r,c){
  const variation=FRACTAL(r,c,7);
  const base=variation>.6?'#77766d':variation>.27?'#656e69':'#58645e';
  const p=s*.045;
  poly(ctx,[[x+p,y+p],[x+s-p,y+p],[x+s-p*1.2,y+s-p],[x+p*1.6,y+s-p]],base,'#202c32',Math.max(1,s*.035));
  line(ctx,[[x+s*.1,y+s*.13],[x+s*.77,y+s*.1],[x+s*.89,y+s*.22]],'#b4aa9077',Math.max(.7,s*.02));
  line(ctx,[[x+s*.16,y+s*.82],[x+s*.81,y+s*.87]],'#293b3dbb',Math.max(.65,s*.014));
  // Hand drawn irregular fracture and grit, seeded by coordinates (stable on resize).
  const k=FRACTAL(r,c,28);
  line(ctx,[[x+s*(.23+k*.21),y+s*.22],[x+s*(.36+k*.21),y+s*.37],[x+s*(.29+k*.21),y+s*.46]],'#283f3f99',Math.max(.7,s*.018));
  for(let n=0;n<7;n++){
    const xx=x+s*(.16+.7*FRACTAL(r,c,n+150));
    const yy=y+s*(.16+.7*FRACTAL(r,c,n+210));
    ellipse(ctx,xx,yy,s*.016,s*.011,'#ddd0a036');
  }
}
function drawMoss(ctx,x,y,s,r,c){
  for(let n=0;n<7;n++){
    const px=x+s*(.14+.7*FRACTAL(r,c,n+17));
    const py=y+s*(.2+.6*FRACTAL(r,c,n+23));
    const radius=s*(.08+.05*FRACTAL(r,c,n+49));
    ellipse(ctx,px,py,radius,radius*.55,n%3===0?'#2f5d4b':'#476c4a');
    line(ctx,[[px-radius*.7,py],[px,py-radius*.5],[px+radius*.8,py-radius*.9]],'#8b9d6877',Math.max(.7,s*.014));
  }
}
function drawWater(ctx,x,y,s,r,c){
  poly(ctx,[[x+s*.03,y+s*.07],[x+s*.95,y+s*.06],[x+s*.96,y+s*.96],[x+s*.06,y+s*.96]],'#305e6c');
  for(let n=0;n<5;n++){
    const yWave=y+s*(.18+n*.15);
    const xWave=x+s*(.13+(n%2)*.12);
    line(ctx,[[xWave,yWave],[xWave+s*.13,yWave-s*.035],[xWave+s*.28,yWave]],n%2?'#98d1c088':'#739cad88',Math.max(.75,s*.025));
  }
  disk(ctx,x+s*.65,y+s*.5,s*.09,'#587d6a');
  line(ctx,[[x+s*.65,y+s*.5],[x+s*.69,y+s*.45]],'#b5c999',Math.max(.8,s*.025));
}
function drawRubble(ctx,x,y,s){
  poly(ctx,[[x+s*.09,y+s*.71],[x+s*.37,y+s*.43],[x+s*.63,y+s*.61],[x+s*.55,y+s*.89]],'#343b3a','#2a3139',1);
  poly(ctx,[[x+s*.37,y+s*.25],[x+s*.67,y+s*.19],[x+s*.86,y+s*.46],[x+s*.6,y+s*.6]],'#aaa38a','#596762',1);
  poly(ctx,[[x+s*.23,y+s*.19],[x+s*.49,y+s*.1],[x+s*.56,y+s*.28],[x+s*.31,y+s*.41]],'#777b6b','#364446',1);
  line(ctx,[[x+s*.4,y+s*.3],[x+s*.65,y+s*.25]],'#d0bd9899',Math.max(.7,s*.02));
}
function drawGlyph(ctx,x,y,s){
  const cx=x+s/2,cy=y+s/2;
  disk(ctx,cx,cy,s*.34,'#53665b','#e5c67d',Math.max(1,s*.027));
  ctx.save();ctx.strokeStyle='#f5d69dbb';ctx.lineWidth=Math.max(.8,s*.028);
  ctx.beginPath();ctx.arc(cx,cy,s*.25,Math.PI*.11,Math.PI*1.91);ctx.stroke();
  line(ctx,[[cx,cy-s*.2],[cx+s*.17,cy],[cx,cy+s*.22],[cx-s*.17,cy],[cx,cy-s*.2]],'#f3d392',Math.max(.8,s*.03));
  disk(ctx,cx,cy,s*.052,'#f6da9f');
  ctx.restore();
}
function drawTile(ctx,rect,kind,row,column){
  const {x,y,width:s}=rect;
  drawStone(ctx,x,y,s,row,column);
  if(kind==='moss')drawMoss(ctx,x,y,s,row,column);
  else if(kind==='water')drawWater(ctx,x,y,s,row,column);
  else if(kind==='rubble')drawRubble(ctx,x,y,s);
  else if(kind==='glyph')drawGlyph(ctx,x,y,s);
  // Native-to-world seams, no HUD or outside-the-board controls.
  ctx.strokeStyle='#1b292d99';ctx.lineWidth=Math.max(.75,s*.012);
  ctx.strokeRect(x+.75,y+.75,s-1.5,s-1.5);
}
function drawSelection(ctx,rect){
  const {x,y,width:s}=rect;
  const arm=Math.min(10,s*.29);
  ctx.fillStyle='#ecc77721';ctx.fillRect(x+1,y+1,s-2,s-2);
  ctx.strokeStyle='#ffe2a5';ctx.lineWidth=Math.max(2,s*.048);ctx.lineCap='round';
  for(const [px,py,hx,hy,vx,vy] of [
    [x+2,y+2,1,0,0,1],[x+s-2,y+2,-1,0,0,1],
    [x+2,y+s-2,1,0,0,-1],[x+s-2,y+s-2,-1,0,0,-1]
  ]){
    line(ctx,[[px+arm*hx,py+arm*hy],[px,py],[px+arm*vx,py+arm*vy]],'#ffe2a5',Math.max(1.5,s*.04));
  }
}
function drawMiniature(ctx,rect,kind){
  const s=rect.width,cx=rect.x+s*.5,cy=rect.y+s*.51;
  // Only sample painted miniatures for renderer verification, not recruited party units.
  ellipse(ctx,cx,cy+s*.26,s*.27,s*.095,'#0c1a2499');
  ellipse(ctx,cx,cy+s*.22,s*.19,s*.079,kind==='ward'?'#a86155':'#bd9d65');
  const body=kind==='ward'?'#774b51':kind==='scribe'?'#326c6b':'#605d85';
  poly(ctx,[[cx-s*.12,cy+s*.12],[cx-s*.17,cy-s*.07],[cx,cy-s*.18],[cx+s*.18,cy-s*.03],[cx+s*.14,cy+s*.16]],body,'#162530',Math.max(.8,s*.025));
  // Cloaks, shoulders and simplified faces retain silhouette at 40–60px tiles.
  poly(ctx,[[cx-s*.12,cy-s*.12],[cx-s*.06,cy-s*.3],[cx+s*.08,cy-s*.28],[cx+s*.17,cy-s*.11]],kind==='ward'?'#d19c76':'#a8b79a');
  disk(ctx,cx,cy-s*.25,s*.075,kind==='ward'?'#c7ac82':'#edc98e','#263641',Math.max(.7,s*.018));
  if(kind==='ward'){
    poly(ctx,[[cx-s*.13,cy-s*.27],[cx,cy-s*.42],[cx+s*.14,cy-s*.27]],'#492c34');
    disk(ctx,cx+s*.09,cy-s*.09,s*.062,'#eb967a','#bd554e',1);
  }else if(kind==='scribe'){
    line(ctx,[[cx+s*.13,cy-s*.13],[cx+s*.24,cy-s*.33]],'#d8b97d',Math.max(1.8,s*.045));
    disk(ctx,cx+s*.24,cy-s*.34,s*.04,'#95d1ba');
  }else if(kind==='rogue'){
    poly(ctx,[[cx-s*.2,cy-s*.2],[cx,cy-s*.41],[cx+s*.19,cy-s*.18]],'#4c6455');
    line(ctx,[[cx+s*.15,cy+s*.05],[cx+s*.29,cy-s*.24]],'#c7d5cc',Math.max(1.5,s*.035));
  }else{
    poly(ctx,[[cx-s*.18,cy-s*.28],[cx,cy-s*.39],[cx+s*.13,cy-s*.28]],'#d7b983');
    line(ctx,[[cx+s*.14,cy+s*.02],[cx+s*.26,cy-s*.22]],'#d9d8bc',Math.max(1.5,s*.035));
  }
}
export function renderBoard(ctx,board,selection=null,overlay=null){
  paintBackdrop(ctx,board);
  for(let row=0;row<board.rows;row++)for(let col=0;col<board.columns;col++){
    const rect=cellRect(board,col,row);
    drawTile(ctx,rect,getTile(row,col),row,col);
  }
  if(overlay?.command){
    const origin=overlay.origin;
    for(let row=0;row<board.rows;row++)for(let col=0;col<board.columns;col++){
      const target={column:col,row};
      const distance=Math.abs(origin.column-col)+Math.abs(origin.row-row);
      const possible=overlay.command.target==='self'?distance===0:
        distance>0&&distance<=overlay.command.range &&
        !(overlay.command.id==='sigil'&&getTile(row,col)==='rubble');
      if(!possible)continue;
      const cell=cellRect(board,col,row);
      const cx=cell.x+cell.width/2,cy=cell.y+cell.height/2;
      ctx.fillStyle='#f9df9954';
      ctx.beginPath();ctx.arc(cx,cy,Math.max(3,cell.width*.18),0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='#f8e2a4aa';ctx.lineWidth=Math.max(1,cell.width*.018);
      ctx.stroke();
    }
  }
  const miniatures=overlay?.positions?
    Object.entries(overlay.positions).map(([id,at])=>({col:at.column,row:at.row,kind:id==='brunna'?'ward':id==='mirelle'?'scribe':id==='kess'?'rogue':'knight',id})):
    [{col:1,row:board.rows-2,kind:'knight'},{col:2,row:board.rows-1,kind:'ward'},{col:board.columns-2,row:1,kind:'rogue'},{col:board.columns-2,row:board.rows-2,kind:'scribe'}];
  for(const miniature of miniatures){
    const rect=cellRect(board,miniature.col,miniature.row);
    if(rect)drawMiniature(ctx,rect,miniature.kind);
  }
  for(const foe of Object.values(overlay?.targets??{})){
    const rect=cellRect(board,foe.position.column,foe.position.row);
    if(rect)drawTrainingFoe(ctx,rect,foe,overlay?.lastCombat);
  }

function drawTrainingFoe(ctx,rect,target,lastCombat){
  const {x,y,width:s}=rect;
  const cx=x+s*.5,cy=y+s*.51,alive=target.hp>0;
  if(!alive){
    ellipse(ctx,cx,cy+s*.26,s*.3,s*.095,'#1a2531bb');
    disk(ctx,cx,cy+s*.1,s*.15,'#5e5666','#ad946d',Math.max(1,s*.018));
    line(ctx,[[cx-s*.12,cy+s*.1],[cx+s*.12,cy+s*.1]],'#ddc397',Math.max(1,s*.026));
    return;
  }
  ellipse(ctx,cx,cy+s*.28,s*.29,s*.09,'#0d1826c9');
  if(target.id==='briar'){
    // Spined carved guardian with original willow-wood helmet and iron chest.
    poly(ctx,[[cx-s*.22,cy+s*.24],[cx-s*.18,cy-s*.13],[cx-s*.03,cy-s*.22],[cx+s*.17,cy-s*.13],[cx+s*.2,cy+s*.2]],'#574b39','#232b2d',Math.max(1,s*.028));
    poly(ctx,[[cx-s*.2,cy-s*.13],[cx-s*.28,cy-s*.29],[cx-s*.07,cy-s*.23],[cx,cy-s*.43],[cx+s*.1,cy-s*.24],[cx+s*.27,cy-s*.31],[cx+s*.17,cy-s*.13]],'#526e4c','#273b36',Math.max(1,s*.022));
    disk(ctx,cx,cy-s*.08,s*.13,'#80654d','#d0b57e',Math.max(1,s*.02));
    disk(ctx,cx-s*.045,cy-s*.085,s*.018,'#f8c987');
    disk(ctx,cx+s*.045,cy-s*.085,s*.018,'#f8c987');
    line(ctx,[[cx-s*.08,cy+s*.04],[cx+s*.08,cy+s*.04]],'#d2ad6a',Math.max(1,s*.022));
  }else{
    // Hollow bell-like shadow with distinctive turquoise spectral core.
    poly(ctx,[[cx-s*.24,cy+s*.23],[cx-s*.17,cy-s*.16],[cx,cy-s*.4],[cx+s*.17,cy-s*.16],[cx+s*.25,cy+s*.23]],'#3b435b','#111c32',Math.max(1.5,s*.04));
    poly(ctx,[[cx-s*.15,cy-s*.16],[cx,cy-s*.33],[cx+s*.16,cy-s*.16],[cx+s*.1,cy+s*.12],[cx-s*.1,cy+s*.12]],'#172b40','#7ca8aa',Math.max(1,s*.025));
    line(ctx,[[cx-s*.075,cy-s*.13],[cx-s*.02,cy-s*.11],[cx+s*.035,cy-s*.16]],'#a6f0d9',Math.max(1.4,s*.04));
    disk(ctx,cx,cy+s*.06,s*.058,'#6db2b4','#b9f2da',Math.max(.8,s*.018));
  }
  const barX=x+s*.18,barY=y+s*.78,barW=s*.64,barH=Math.max(3.4,s*.065);
  ctx.fillStyle='#111e29';ctx.fillRect(barX-1,barY-1,barW+2,barH+2);
  ctx.fillStyle='#6c363c';ctx.fillRect(barX,barY,barW,barH);
  ctx.fillStyle='#ed9b75';ctx.fillRect(barX,barY,barW*(target.hp/target.maxHp),barH);
  if(lastCombat?.id===target.id){
    const hit=lastCombat.hit;
    ctx.beginPath();ctx.arc(cx,cy-s*.08,s*.35,0,Math.PI*2);
    ctx.strokeStyle=hit?'#ffe1a2':'#91d8e2';ctx.lineWidth=Math.max(1.5,s*.048);
    ctx.stroke();
  }
}
  // Hatched, world-surface enemy telegraphs; all labels remain in the right rail.
  for(const intent of overlay?.intents??[]){
    const rect=cellRect(board,overlay.positions[intent.victimId]?.column,overlay.positions[intent.victimId]?.row);
    const source=cellRect(board,intent.from?.column,intent.from?.row);
    if(!rect)continue;
    const x=rect.x+rect.width/2,y=rect.y+rect.height/2,s=rect.width;
    ctx.save();ctx.beginPath();ctx.arc(x,y,s*.36,0,Math.PI*2);
    ctx.strokeStyle=intent.attack?'#f5a18f':'#d8c68a';
    ctx.lineWidth=Math.max(2,s*.043);
    ctx.setLineDash(intent.attack?[s*.09,s*.07]:[s*.18,s*.12]);ctx.stroke();ctx.setLineDash([]);
    if(source){
      const sx=source.x+source.width/2,sy=source.y+source.height/2;
      ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(x,y);
      ctx.strokeStyle=intent.attack?'#f6a18d7f':'#cdbd8e6b';
      ctx.lineWidth=Math.max(.9,s*.017);ctx.setLineDash([s*.14,s*.14]);ctx.stroke();
    }
    ctx.restore();
  }
  // World-native movement path: dotted route and tiles, never a floating HUD.
  if(overlay?.mode==='movement' && overlay?.evaluation?.path?.length>1){
    const route=overlay.evaluation.path;
    const valid=overlay.evaluation.valid;
    const color=valid?'#92ead1':'#eb9b79';
    ctx.save();ctx.strokeStyle=color;ctx.lineWidth=Math.max(2,board.tile*.055);
    ctx.lineJoin='round';ctx.lineCap='round';
    ctx.setLineDash([board.tile*.13,board.tile*.11]);
    ctx.beginPath();
    for(let i=0;i<route.length;i++){
      const rect=cellRect(board,route[i].column,route[i].row);
      const x=rect.x+rect.width/2,y=rect.y+rect.height/2;
      if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
    }
    ctx.stroke();ctx.setLineDash([]);
    for(let i=1;i<route.length;i++){
      const rect=cellRect(board,route[i].column,route[i].row);
      const x=rect.x+rect.width/2,y=rect.y+rect.height/2;
      disk(ctx,x,y,Math.max(2,board.tile*.07),color,'#163537',Math.max(.7,board.tile*.02));
    }
    ctx.restore();
  }
  if(overlay?.mode==='movement' && overlay?.target){
    const rect=cellRect(board,overlay.target.column,overlay.target.row);
    if(rect){
      ctx.fillStyle=overlay.evaluation?.valid?'#73e4b929':'#ea806529';
      ctx.fillRect(rect.x+2,rect.y+2,rect.width-4,rect.height-4);
      ctx.strokeStyle=overlay.evaluation?.valid?'#91f6d4':'#ff9c7e';
      ctx.lineWidth=Math.max(2,board.tile*.05);
      ctx.strokeRect(rect.x+3,rect.y+3,rect.width-6,rect.height-6);
    }
  }
  if(overlay?.origin && overlay?.positions){
    const marker=cellRect(board,overlay.origin.column,overlay.origin.row);
    if(marker){ctx.beginPath();ctx.arc(marker.x+marker.width/2,marker.y+marker.height/2,marker.width*.32,0,Math.PI*2);ctx.strokeStyle='#d9eeb9';ctx.lineWidth=Math.max(1.5,board.tile*.034);ctx.stroke();}
  }
  if(overlay?.command){
    const originRect=cellRect(board,overlay.origin.column,overlay.origin.row);
    if(originRect){
      const s=originRect.width;
      ctx.beginPath();ctx.arc(originRect.x+s*.5,originRect.y+s*.5,s*.31,0,Math.PI*2);
      ctx.lineWidth=Math.max(2,s*.038);ctx.strokeStyle='#86e6d3';ctx.stroke();
    }
    if(overlay.target){
      const rect=cellRect(board,overlay.target.column,overlay.target.row);
      if(rect){
        ctx.fillStyle=overlay.evaluation?.valid?'#8cf2d93b':'#f27b7845';
        ctx.fillRect(rect.x+1,rect.y+1,rect.width-2,rect.height-2);
        ctx.strokeStyle=overlay.evaluation?.valid?'#8dfbe1':'#ff8c80';
        ctx.lineWidth=Math.max(2,rect.width*.045);
        ctx.strokeRect(rect.x+3,rect.y+3,rect.width-6,rect.height-6);
      }
    }
  }
  if(selection){
    const rect=cellRect(board,selection.column,selection.row);
    if(rect)drawSelection(ctx,rect);
  }
}
export function createBoardPreview({stage,story,container,canvas,toggle,status,onModeChange=()=>{},onCellSelect=()=>{},onBoardReady=()=>{}}){
  let board=null,visible=false,selection=null,commandOverlay=null;
  const context=canvas.getContext('2d',{alpha:false});
  if(!context){status.textContent='Canvas preview unavailable on this device.';toggle.disabled=true;return;}
  const redraw=()=>{
    if(!visible)return;
    const bounds=canvas.getBoundingClientRect();
    if(bounds.width<=0||bounds.height<=0)return;
    const ratio=Math.min(3,Math.max(1,window.devicePixelRatio||1));
    canvas.width=Math.round(bounds.width*ratio);
    canvas.height=Math.round(bounds.height*ratio);
    context.setTransform(canvas.width/bounds.width,0,0,canvas.height/bounds.height,0,0);
    board=measureBoard(bounds.width,bounds.height);
    if(selection&&(selection.column>=board.columns||selection.row>=board.rows))selection=null;
    renderBoard(context,board,selection,commandOverlay);
    onBoardReady(board);
    for(const [key,value] of Object.entries({columns:board.columns,rows:board.rows,tile:board.tile,offsetX:board.x,offsetY:board.y}))canvas.dataset[key]=String(value);
    canvas.dataset.rendered='true';
    updateStatus();
  };
  const updateStatus=()=>{
    if(!board)return;
    const base='Table study: '+board.columns+' columns × '+board.rows+' rows. ';
    if(!selection){
      status.textContent=base+'Select a tile to inspect its terrain. The figures are decorative previews; there is no combat yet.';
      canvas.dataset.selectedColumn='';
      canvas.dataset.selectedRow='';
      return;
    }
    canvas.dataset.selectedColumn=String(selection.column);
    canvas.dataset.selectedRow=String(selection.row);
    status.textContent=base+'Selected column '+(selection.column+1)+', row '+(selection.row+1)+': '+getTile(selection.row,selection.column)+'. Movement is previewed in the right rail; no combat yet.';
  };
  const select=(point)=>{
    if(!board)return;
    const candidate=hitTestBoard(board,point.x,point.y);
    if(!candidate)return;
    selection=candidate;
    renderBoard(context,board,selection,commandOverlay);
    onCellSelect(candidate,board);
    updateStatus();
  };
  const onPointer=event=>{
    if(!visible)return;
    const bounds=canvas.getBoundingClientRect();
    select(logicalPointFromClient(bounds,event.clientX,event.clientY));
  };
  canvas.addEventListener('pointerdown',onPointer);
  canvas.addEventListener('keydown',event=>{
    if(!visible||!board)return;
    if(event.key==='Escape'){event.preventDefault();selection=null;renderBoard(context,board,null,commandOverlay);updateStatus();return;}
    const moves={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};
    if(!moves[event.key]&&event.key!=='Enter'&&event.key!==' ')return;
    event.preventDefault();
    const [dx,dy]=moves[event.key]||[0,0];
    const current=selection||{column:Math.floor(board.columns/2),row:Math.floor(board.rows/2)};
    selection={column:Math.max(0,Math.min(board.columns-1,current.column+dx)),row:Math.max(0,Math.min(board.rows-1,current.row+dy))};
    renderBoard(context,board,selection,commandOverlay);onCellSelect(selection,board);updateStatus();
  });
  toggle.addEventListener('click',()=>{
    visible=!visible;
    stage.classList.toggle('board-mode',visible);
    story.hidden=visible;
    container.hidden=!visible;
    toggle.textContent=visible?'Return to Inkfall House':'Inspect tactical table';
    toggle.setAttribute('aria-pressed',String(visible));
    onModeChange(visible);
    if(visible)requestAnimationFrame(redraw);
    else status.textContent='An original miniature-styled tactical terrain preview; no combat yet.';
  });
  const observer=typeof ResizeObserver==='function'?new ResizeObserver(redraw):null;
  observer?.observe(stage);
  window.addEventListener('resize',redraw,{passive:true});
  return Object.freeze({
    getBoard:()=>board,
    setCommandOverlay(next){
      commandOverlay=next;
      if(visible&&board)renderBoard(context,board,selection,commandOverlay);
    }
  });
}
