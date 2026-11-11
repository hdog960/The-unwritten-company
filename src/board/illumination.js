/** The Illuminated Table — Gate A hand-inked light and paper-miniature staging.
 * Pure drawing: no state, RNG, remote textures, hit-boxes or animation loops.
 * All world art is clipped; game UI remains in separate external DOM rails.
 */
import {cellRect} from './geometry.js';

export const FIGURE_AURAS=Object.freeze({
  captain:'#9fd5bd',brunna:'#e6aa82',kess:'#bed4a1',
  mirelle:'#baa8e2',briar:'#d3b27f',shade:'#93d8d1'
});
const clamp=n=>Number.isFinite(n)?Math.max(0,Math.min(1,n)):0;
function radial(ctx,x,y,inner,outer,stops){
  const gradient=ctx.createRadialGradient(x,y,Math.max(0,inner),x,y,outer);
  for(const [at,color]of stops)gradient.addColorStop(at,color);
  return gradient;
}
function line(ctx,points,color,width){
  ctx.beginPath();ctx.moveTo(...points[0]);
  for(let i=1;i<points.length;i++)ctx.lineTo(...points[i]);
  ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.stroke();
}
function ring(ctx,x,y,r,color,w,start=0,end=Math.PI*2){
  ctx.beginPath();ctx.arc(x,y,r,start,end);ctx.strokeStyle=color;ctx.lineWidth=w;ctx.stroke();
}
function dot(ctx,x,y,r,color){
  ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();
}

/** Broad soft washes tie different cells into a single hand-painted map.
 * One glow per *region*, not a distracting repetitive texture per tile.
 * Returns the number of original, local painted light sources. */
export function paintLanternPools(ctx,board,tileAt){
  if(!ctx||!board||typeof tileAt!=='function')return 0;
  const emitters=[];
  // The layout's authored glyph engravings serve as the table's lantern anchors.
  for(let row=0;row<board.rows;row++)for(let col=0;col<board.columns;col++){
    const terrain=tileAt(row,col);
    if(terrain==='glyph')emitters.push({row,col,type:'lantern'});
    if(terrain==='water'&&emitters.filter(e=>e.type==='water').length<2)
      emitters.push({row,col,type:'water'});
  }
  ctx.save();ctx.beginPath();ctx.rect(board.x,board.y,board.mapWidth,board.mapHeight);ctx.clip();
  for(const at of emitters){
    const rect=cellRect(board,at.col,at.row);if(!rect)continue;
    const {width:s}=rect,x=rect.x+s*.5,y=rect.y+s*.43;
    const r=s*(at.type==='lantern'?2.2:1.8);
    ctx.fillStyle=at.type==='lantern'?
      radial(ctx,x,y,s*.08,r,[[0,'#ffe5a327'],[.34,'#e4c58d16'],[1,'#e4c58d00']]):
      radial(ctx,x,y,s*.1,r,[[0,'#9cdcc727'],[.45,'#75b3b214'],[1,'#75b3b200']]);
    ctx.fillRect(x-r,y-r,r*2,r*2);
    if(at.type==='lantern'){
      // A near-invisible pen nib halo: feels like an old illuminated folio.
      ctx.save();ctx.globalAlpha=.5;
      ring(ctx,x,y,s*.32,'#fae0a3',Math.max(.8,s*.019),-.78,.9);
      ring(ctx,x,y,s*.32,'#fae0a3',Math.max(.8,s*.019),2.36,3.73);
      ctx.restore();
    }
  }
  ctx.restore();return emitters.length;
}
/** A tiny rear-lit embossed card profile. The art sits behind the figure, so
 * armor and facial ink remain crisp instead of becoming foggy at 38px tiles.
 * Works for hero/foe/alive/fallen and never draws outside the canvas board. */
export function paintMiniatureBackdrop(ctx,rect,id,options={}){
  if(!ctx||!rect||!Object.hasOwn(FIGURE_AURAS,id))return false;
  const s=rect.width,x=rect.x+s*.5,y=rect.y+s*.48;
  const active=!!options.active,fallen=!!options.fallen;
  const hpRatio=options.hp===null||options.hp===undefined||!options.maxHp?1:clamp(options.hp/options.maxHp);
  const low=hpRatio>0&&hpRatio<=.35;
  const hue=low?'#e9a281':FIGURE_AURAS[id];
  ctx.save();
  // Printed drop shadow is an offset, grounded oval under the miniature;
  // the existing physical base is painted above it by paintUnitStand().
  ctx.beginPath();
  ctx.ellipse(x+s*.065,rect.y+s*.83,s*.36,s*.11,0,0,Math.PI*2);
  ctx.fillStyle='#101b26a9';ctx.fill();
  if(!fallen){
    // Soft local backlight improves silhouettes without bright HUD borders.
    ctx.fillStyle=radial(ctx,x,y,s*.03,s*.47,
      [[0,low?'#ffb08a61':active?'#f8e3bd69':'#d6d0a645'],
       [.45,active?'#f1d9b244':'#b1c2ae22'],[1,'#d6ca9d00']]);
    ctx.fillRect(rect.x,rect.y,s,s);
    // Asymmetrical ink strokes: figures are tiny physical illustrations,
    // not uniformly glowing fantasy tokens.
    const c=active?'#fce4b5':hue;
    ctx.save();ctx.globalAlpha=active?.9:.67;
    line(ctx,[[x-s*.31,y+s*.05],[x-s*.34,y-s*.13],[x-s*.22,y-s*.26]],
      c,Math.max(.9,s*.025));
    line(ctx,[[x+s*.29,y-s*.2],[x+s*.36,y-s*.08],[x+s*.31,y+s*.02]],
      c,Math.max(.8,s*.021));
    ctx.restore();
    if(low){
      // Danger is striped, not communicated by color alone.
      for(let i=0;i<3;i++){
        const px=x-s*.26+i*s*.09,py=rect.y+s*.89;
        line(ctx,[[px,py],[px+s*.055,py-s*.035]],'#f6c7a6',Math.max(1,s*.028));
      }
    }
  }else{
    ring(ctx,x,rect.y+s*.78,s*.29,'#a79a87',Math.max(.8,s*.019),.15,2.8);
  }
  ctx.restore();return true;
}
/** Per-unit, full-resolution apron accents on the *physical* board.
 * Hero colors and enemy silhouettes use different geometries; no captions,
 * floating health HUD or opaque gameplay controls are ever drawn. */
export function paintMiniatureFootlights(ctx,rect,id,{active=false,fallen=false}={}){
  if(!ctx||!rect||!Object.hasOwn(FIGURE_AURAS,id))return false;
  const s=rect.width,cx=rect.x+s*.5,cy=rect.y+s*.85;
  const c=FIGURE_AURAS[id];
  ctx.save();
  if(!fallen){
    ctx.globalAlpha=active?1:.7;
    const from=active?-.8:Math.PI*.08,to=active?3.8:Math.PI*.87;
    ring(ctx,cx,cy,s*.3,c,Math.max(1,s*.028),from,to);
    // Three tiny engraved brass studs on the front enamel base.
    for(let i=-1;i<=1;i++){
      const theta=Math.PI*.5+i*.46;
      dot(ctx,cx+Math.cos(theta)*s*.28,cy+Math.sin(theta)*s*.08,
        Math.max(.6,s*.012),'#f4dfb1');
    }
    if(id==='briar'){
      line(ctx,[[cx-s*.3,cy-s*.08],[cx-s*.25,cy-s*.16]],'#d6b381',Math.max(.8,s*.019));
      line(ctx,[[cx+s*.3,cy-s*.08],[cx+s*.25,cy-s*.16]],'#d6b381',Math.max(.8,s*.019));
    }else if(id==='shade'){
      ring(ctx,cx,cy,s*.34,'#94ddd3',Math.max(.9,s*.021),1.1,2.5);
    }
  }
  ctx.restore();return true;
}
