import {cellRect,getTile,hitTestBoard,logicalPointFromClient,measureBoard} from './geometry.js';
import {drawHero,drawFoe} from './miniatures.js';
import {paintAtelierTile,paintBoardLighting,paintUnitStand} from './atelier.js';
import {paintJoinedTerrain,paintGutterFiligree,paintUnitEmblem,paintThreatSymbol} from './diorama.js';
import {PARTY_SLOTS} from '../party/model.js';
import {drawWorldEffect,isValidEffect,EFFECT_DURATION_MS} from './effects.js';
import {paintTargetIndicators} from './targeting.js';
import {paintFloorVignettes} from './scenery.js';
import {animatedHeroRect} from './motion.js';
import {puppetPose} from './choreography.js';
import {bearingPose} from './bearings.js';
import {paintMaterialTransitions} from './shoreline.js';
import {paintLanternPools,paintMiniatureBackdrop,paintMiniatureFootlights} from './illumination.js';
import {paintWorldRelief,paintHeroEnamelStatus} from './relief.js';
import {paintQuillPreview} from './quill.js';
import {paintThreatEngravings,paintTravelEngraving,threatGlyphs} from './battle-engraving.js';
import {paintPressRelics} from './press-ruins.js';
import {paintPuppetShadow} from './paper-puppets.js';
import {paintActionSeal} from './action-seals.js';
import {paintTileRelief} from './tile-relief.js';
import {paintPaperHabitat} from './paper-habitat.js';
import {paintMiniatureMatte} from './miniature-matte.js';

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
  // Antique frame: shadow, enamel lip, gilded screws and ornamental inlaid corners.
  ctx.strokeStyle='#d6b476';ctx.lineWidth=1.6;
  ctx.strokeRect(board.x-4,board.y-4,board.mapWidth+8,board.mapHeight+8);
  ctx.strokeStyle='#211d25';ctx.lineWidth=1;
  ctx.strokeRect(board.x-7,board.y-7,board.mapWidth+14,board.mapHeight+14);
  for(const [sideX,sideY,signX,signY] of [
    [board.x-4,board.y-4,1,1],[board.x+board.mapWidth+4,board.y-4,-1,1],
    [board.x-4,board.y+board.mapHeight+4,1,-1],[board.x+board.mapWidth+4,board.y+board.mapHeight+4,-1,-1]
  ]){
    disk(ctx,sideX,sideY,3.1,'#b9955a','#332c2e',1.2);
    line(ctx,[[sideX+signX*6,sideY],[sideX+signX*17,sideY+signY*4],[sideX+signX*22,sideY+signY*14]],'#a78350',1.5);
    line(ctx,[[sideX,sideY+signY*6],[sideX+signX*4,sideY+signY*17]],'#a78350',1.3);
  }
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
  // Faint illuminated manuscript stippling keeps stone from reading as flat web grid.
  for(let n=0;n<4;n++){
    const px=x+s*(.16+.68*FRACTAL(row,column,n+411));
    const py=y+s*(.18+.63*FRACTAL(row,column,n+535));
    disk(ctx,px,py,Math.max(.5,s*.009),n%2?'#ebd6a333':'#171f2c55');
  }
  if(kind==='glyph'){
    ctx.strokeStyle='#f3d58a44';ctx.lineWidth=Math.max(1,s*.017);
    ctx.strokeRect(x+s*.13,y+s*.13,s*.74,s*.74);
  }
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
/** Backward-compatible renderer API: timing is owned by one visual-only helper. */
export function miniaturePose(frame,position,isEnemy=false){
  return bearingPose(frame,position,puppetPose(frame,position));
}
export function renderBoard(ctx,board,selection=null,overlay=null,frame=null){
  paintBackdrop(ctx,board);
  paintGutterFiligree(ctx,board);
  for(let row=0;row<board.rows;row++)for(let col=0;col<board.columns;col++){
    const rect=cellRect(board,col,row);
    const terrain=getTile(row,col);
    drawTile(ctx,rect,terrain,row,col);
    paintAtelierTile(ctx,rect,terrain,row,col);
    // Raised cut-card bevels remain within real terrain cells, beneath units.
    paintTileRelief(ctx,rect,terrain,row,col);
  }
  paintWorldRelief(ctx,board,getTile);
  // Broken bookbinder equipment is authored ONLY on existing blocked rubble.
  paintPressRelics(ctx,board,getTile);
  paintJoinedTerrain(ctx,board,getTile);
  paintMaterialTransitions(ctx,board,getTile);
  // Connected, original die-cut riverbanks and etched ivy. Suppress dense
  // foliage underneath real party/enemy miniatures; never fake a target.
  const occupiedHabitat=[
    ...Object.values(overlay?.positions??{}),
    ...Object.values(overlay?.targets??{}).filter(foe=>foe.hp>0).map(foe=>foe.position)
  ];
  paintPaperHabitat(ctx,board,getTile,occupiedHabitat);
  paintBoardLighting(ctx,board);
  paintLanternPools(ctx,board,getTile);
  // Four old guild-site floor inlays sit beneath the battle's unit layer.
  const vignetteOccupants={...(overlay?.positions??{})};
  for(const [id,foe] of Object.entries(overlay?.targets??{}))if(foe.hp>0)vignetteOccupants['foe:'+id]=foe.position;
  paintFloorVignettes(ctx,board,vignetteOccupants);
  // Hand-cut paper pockets isolate tiny miniature silhouettes from busy water
  // and ivy. They stay under ALL true target/intent marks and native figures.
  for(const [id,point] of Object.entries(overlay?.positions??{})){
    const rect=cellRect(board,point.column,point.row);
    if(rect)paintMiniatureMatte(ctx,rect,id,getTile(point.row,point.column),
      {fallen:(overlay?.partyHp?.[id]??1)<=0});
  }
  for(const foe of Object.values(overlay?.targets??{})){
    const point=foe.position,rect=cellRect(board,point.column,point.row);
    if(rect)paintMiniatureMatte(ctx,rect,foe.id,getTile(point.row,point.column),
      {fallen:foe.hp<=0});
  }
  // Only the command engine's *actual legal* cells glow, above floor artwork
  // but beneath the miniatures. Invalid / empty live-battle tiles stay dark.
  paintTargetIndicators(ctx,board,overlay?.targetIndicators);
  paintQuillPreview(ctx,board,overlay);
  // Floor engraving is drawn before figures; enemy vectors can never cross faces.
  paintThreatEngravings(ctx,board,overlay?.intents,overlay?.positions);
  paintTravelEngraving(ctx,board,overlay);
  const miniatures=overlay?.positions?
    Object.entries(overlay.positions).map(([id,at])=>({col:at.column,row:at.row,kind:id==='brunna'?'ward':id==='mirelle'?'scribe':id==='kess'?'rogue':'knight',id})):
    [{col:1,row:board.rows-2,kind:'knight'},{col:2,row:board.rows-1,kind:'ward'},{col:board.columns-2,row:1,kind:'rogue'},{col:board.columns-2,row:board.rows-2,kind:'scribe'}];
  for(const miniature of miniatures){
    const id=miniature.id??({knight:'captain',ward:'brunna',rogue:'kess',scribe:'mirelle'}[miniature.kind]);
    const rect=animatedHeroRect(board,{column:miniature.col,row:miniature.row},id,frame);
    if(!rect)continue;
    const member=PARTY_SLOTS.find(item=>item.id===id);
    const pose=miniaturePose(frame,{column:miniature.col,row:miniature.row});
    paintMiniatureBackdrop(ctx,rect,id,{active:overlay?.actorId===id,fallen:(overlay?.partyHp?.[id]??1)<=0,hp:overlay?.partyHp?.[id]??null,maxHp:member?.maxHp});
    paintActionSeal(ctx,rect,id,pose,{fallen:overlay?.partyHp?.[id]===0});
    paintPuppetShadow(ctx,rect,id,{pose,fallen:overlay?.partyHp?.[id]===0});
    paintUnitStand(ctx,rect,id,{active:overlay?.actorId===id,hp:overlay?.partyHp?.[id]??null,
      maxHp:member?.maxHp??null,ward:(overlay?.guards?.[id]??0)>0});
    drawHero(ctx,rect,id,overlay?.partyHp?.[id]===0,pose,{
      hp:overlay?.partyHp?.[id]??null,maxHp:member?.maxHp??null,
      guard:overlay?.guards?.[id]??0
    });
    paintMiniatureFootlights(ctx,rect,id,{active:overlay?.actorId===id,fallen:(overlay?.partyHp?.[id]??1)<=0});
    paintHeroEnamelStatus(ctx,rect,{
      hp:overlay?.partyHp?.[id]??null,maxHp:member?.maxHp??null,
      ward:(overlay?.guards?.[id]??0)>0,
      ended:overlay?.ended?.includes(id)??false,
      fallen:overlay?.partyHp?.[id]===0
    });
    paintUnitEmblem(ctx,rect,id,overlay?.actorId===id);
  }
  for(const foe of Object.values(overlay?.targets??{})){
    const rect=cellRect(board,foe.position.column,foe.position.row);
    if(rect){
      const pose=miniaturePose(frame,foe.position,true);
      paintMiniatureBackdrop(ctx,rect,foe.id,{fallen:foe.hp<=0,hp:foe.hp,maxHp:foe.maxHp});
      paintActionSeal(ctx,rect,foe.id,pose,{fallen:foe.hp<=0});
      paintPuppetShadow(ctx,rect,foe.id,{pose,fallen:foe.hp<=0});
      // The ink strike ring is transient. No permanent 'last hit' aura that
      // misleadingly resembles a selected legal target after an action ends.
      const current=frame?.event;
      const targeted=current&&['hit','miss','critical'].includes(current.kind)&&
        current.to?.column===foe.position.column&&current.to?.row===foe.position.row;
      drawFoe(ctx,rect,foe,targeted?overlay?.lastCombat:null,pose);
      paintMiniatureFootlights(ctx,rect,foe.id,{fallen:foe.hp<=0});
    }
  }

  // Danger symbols sit on the world tile margin; stitched routes are BELOW figures.
  for(const glyph of threatGlyphs(overlay?.intents,overlay?.positions)){
    const rect=cellRect(board,glyph.position.column,glyph.position.row);
    if(rect)paintThreatSymbol(ctx,rect,glyph.attack);
  }
  // No redundant origin halo is painted across the acting figure's face.
  // Selected-unit enamel stand and tiny corner sigil already identify the actor.
  if(selection){
    const rect=cellRect(board,selection.column,selection.row);
    if(rect)drawSelection(ctx,rect);
  }
  if(frame)drawWorldEffect(ctx,board,frame);
}
export function createBoardPreview({stage,story,container,canvas,toggle,status,onModeChange=()=>{},onCellSelect=()=>{},onBoardReady=()=>{},onEscape=()=>{}}){
  let board=null,visible=false,selection=null,commandOverlay=null;
  let fx=null,lastFxToken=null,fxRequest=0,press=null;
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
    renderBoard(context,board,selection,commandOverlay,fx);
    onBoardReady(board);
    for(const [key,value] of Object.entries({columns:board.columns,rows:board.rows,tile:board.tile,offsetX:board.x,offsetY:board.y}))canvas.dataset[key]=String(value);
    canvas.dataset.rendered='true';
    updateStatus();
  };
  const updateStatus=()=>{
    if(!board)return;
    const live=commandOverlay?.battleMode==='active';
    const base=(live?'Skirmish map':'Table study')+': '+board.columns+' columns × '+board.rows+' rows. ';
    if(!selection){
      status.textContent=base+'Tap a hero or foe to inspect it. Choose a command before targeting an action.';
      canvas.dataset.selectedColumn='';
      canvas.dataset.selectedRow='';
      return;
    }
    canvas.dataset.selectedColumn=String(selection.column);
    canvas.dataset.selectedRow=String(selection.row);
    status.textContent=base+'Selected column '+(selection.column+1)+', row '+(selection.row+1)+': '+getTile(selection.row,selection.column)+'. Combat and movement are controlled in the right rail.';
  };
  const select=(point)=>{
    if(!board)return;
    const candidate=hitTestBoard(board,point.x,point.y);
    if(!candidate)return;
    selection=candidate;
    renderBoard(context,board,selection,commandOverlay,fx);
    onCellSelect(candidate,board);
    updateStatus();
  };
  // A destination is chosen on pointer UP only after an unmoved primary tap.
  // Prevents drag, pinch, canceled gesture or nonprimary pointer from committing.
  canvas.addEventListener('pointerdown',event=>{
    if(!visible)return;
    if(press){press.dragged=true;return}
    if(!event.isPrimary || event.pointerType==='mouse'&&event.button!==0)return;
    press={id:event.pointerId,x:event.clientX,y:event.clientY,dragged:false};
    // Keep the release/cancel event even if a thumb slides outside the canvas.
    try{canvas.setPointerCapture(event.pointerId)}catch{}
    canvas.dataset.pointer='pending';
  });
  canvas.addEventListener('pointermove',event=>{
    if(press?.id!==event.pointerId)return;
    if(Math.hypot(event.clientX-press.x,event.clientY-press.y)>11)press.dragged=true;
  });
  canvas.addEventListener('pointercancel',event=>{
    if(press?.id===event.pointerId){press=null;canvas.dataset.pointer='canceled'}
  });
  canvas.addEventListener('lostpointercapture',event=>{
    if(press?.id===event.pointerId){press=null;canvas.dataset.pointer='canceled'}
  });
  canvas.addEventListener('pointerup',event=>{
    const last=press;press=null;
    if(!visible||!last||last.id!==event.pointerId)return;
    const distance=Math.hypot(event.clientX-last.x,event.clientY-last.y);
    if(last.dragged||distance>11){canvas.dataset.pointer='dragged';return}
    canvas.dataset.pointer='tap';
    const bounds=canvas.getBoundingClientRect();
    select(logicalPointFromClient(bounds,event.clientX,event.clientY));
  });
  canvas.addEventListener('keydown',event=>{
    if(!visible||!board)return;
    if(event.key==='Escape'){event.preventDefault();selection=null;onEscape();renderBoard(context,board,null,commandOverlay,fx);updateStatus();return;}
    const moves={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};
    if(!moves[event.key]&&event.key!=='Enter'&&event.key!==' ')return;
    event.preventDefault();
    const [dx,dy]=moves[event.key]||[0,0];
    const current=selection||{column:Math.floor(board.columns/2),row:Math.floor(board.rows/2)};
    selection={column:Math.max(0,Math.min(board.columns-1,current.column+dx)),row:Math.max(0,Math.min(board.rows-1,current.row+dy))};
    renderBoard(context,board,selection,commandOverlay,fx);onCellSelect(selection,board);updateStatus();
  });
  toggle.addEventListener('click',()=>{
    visible=!visible;
    press=null;
    if(!visible){cancelAnimationFrame(fxRequest);fx=null;}
    stage.classList.toggle('board-mode',visible);
    story.hidden=visible;
    container.hidden=!visible;
    toggle.textContent=visible?'Return to Inkfall House':'Inspect tactical table';
    toggle.setAttribute('aria-pressed',String(visible));
    onModeChange(visible);
    if(visible)requestAnimationFrame(redraw);
    else status.textContent='A miniature-styled tactical battlefield; begin a skirmish or inspect the table.';
  });
  const observer=typeof ResizeObserver==='function'?new ResizeObserver(redraw):null;
  observer?.observe(stage);
  window.addEventListener('resize',redraw,{passive:true});
  const animate=now=>{
    if(!visible||!board||!fx)return;
    fx={...fx,progress:Math.max(0,Math.min(1,(now-fx.started)/EFFECT_DURATION_MS))};
    canvas.dataset.fxPhase=String(Math.round(fx.progress*100));
    renderBoard(context,board,selection,commandOverlay,fx);
    if(fx.progress<1)fxRequest=requestAnimationFrame(animate);
    else {fx=null;fxRequest=0;renderBoard(context,board,selection,commandOverlay);}
  };
  return Object.freeze({
    getBoard:()=>board,
    setCommandOverlay(next){
      commandOverlay=next;
      const event=next?.visualEvent;
      if(!event)lastFxToken=null;
      if(visible&&board&&isValidEffect(event)&&event.token!==lastFxToken){
        lastFxToken=event.token;
        cancelAnimationFrame(fxRequest);fx=null;
        canvas.dataset.fxKey=event.token;canvas.dataset.fxKind=event.kind;
        if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
          fx={event,started:performance.now(),progress:0};
          fxRequest=requestAnimationFrame(animate);
        }
      }
      if(visible&&board){renderBoard(context,board,selection,commandOverlay,fx);updateStatus();}
    }
  });
}
