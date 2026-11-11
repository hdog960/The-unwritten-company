/** The Illuminated Table: two original, hand-inked relics of Inkfall's
 * ruined movable-type press. Only already-impassable rubble is decorated;
 * neither the terrain grid nor walkability changes.
 */
import {cellRect} from './geometry.js';

export const PRESS_RELIC_KINDS=Object.freeze(['type-chase','torn-folio']);
const etched=(ctx,points,color,width)=>{
  ctx.beginPath();ctx.moveTo(...points[0]);
  for(const point of points.slice(1))ctx.lineTo(...point);
  ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineJoin='round';ctx.stroke();
};
const face=(ctx,points,fill,stroke,width)=>{
  ctx.beginPath();ctx.moveTo(...points[0]);
  for(const point of points.slice(1))ctx.lineTo(...point);
  ctx.closePath();ctx.fillStyle=fill;ctx.fill();
  if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}
};
const spot=(ctx,x,y,r,fill)=>{
  ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();
};
export function pressRelics(board,tileAt){
  if(!board||typeof tileAt!=='function')return Object.freeze([]);
  const found=[];
  for(let row=0;row<board.rows;row++)for(let column=0;column<board.columns;column++){
    if(tileAt(row,column)!=='rubble')continue;
    found.push(Object.freeze({row,column,kind:(row+column)%2?'type-chase':'torn-folio'}));
  }
  return Object.freeze(found);
}
function typeChase(ctx,x,y,s){
  const at=(u,v)=>[x+u*s,y+v*s],w=Math.max(1,s*.025);
  // A collapsed compositor's bronze chase: deep shadow and bright raised lip.
  face(ctx,[at(.11,.70),at(.36,.43),at(.82,.51),at(.94,.79),at(.70,.94),at(.23,.88)],
    '#101f2da8',null,w);
  face(ctx,[at(.12,.48),at(.31,.23),at(.80,.25),at(.88,.64),at(.64,.81),at(.18,.70)],
    '#a98d65','#253844',Math.max(1.2,s*.05));
  face(ctx,[at(.20,.47),at(.36,.31),at(.74,.34),at(.77,.59),at(.61,.69),at(.26,.63)],
    '#24343a','#d9b98a',w);
  // Movable-type sorts, with readable type-shaped crosscuts at tiny tile sizes.
  for(let i=0;i<4;i++){
    const u=.31+(i%2)*.23,v=.42+Math.floor(i/2)*.15;
    face(ctx,[at(u,v),at(u+.12,v-.01),at(u+.11,v+.11),at(u-.015,v+.115)],
      i%2?'#cfb17b':'#a5a393','#293c42',Math.max(.75,s*.017));
    etched(ctx,[at(u+.035,v+.025),at(u+.085,v+.025),at(u+.07,v+.075)],
      '#435253',Math.max(.8,s*.022));
  }
  // Broken wheel, no tall prop projecting onto adjacent walkable tiles.
  ctx.beginPath();ctx.arc(x+s*.78,y+s*.76,s*.105,0,Math.PI*2);
  ctx.strokeStyle='#e0c38b';ctx.lineWidth=Math.max(1.2,s*.038);ctx.stroke();
  for(let n=0;n<5;n++){
    const a=n*Math.PI*2/5;
    spot(ctx,x+s*(.78+.075*Math.cos(a)),y+s*(.76+.075*Math.sin(a)),
      Math.max(.6,s*.012),'#f0dcad');
  }
  etched(ctx,[at(.25,.29),at(.42,.16),at(.70,.20)],'#f4d5a074',Math.max(.8,s*.02));
}
function tornFolio(ctx,x,y,s){
  const at=(u,v)=>[x+u*s,y+v*s],w=Math.max(1,s*.025);
  // Thick oxblood cover and three staggered signatures: real paper thickness.
  face(ctx,[at(.15,.74),at(.25,.42),at(.66,.31),at(.86,.47),at(.77,.81),at(.41,.89)],
    '#131e28b8',null,w);
  face(ctx,[at(.17,.55),at(.31,.28),at(.73,.35),at(.84,.68),at(.61,.80),at(.22,.73)],
    '#7d4750','#26333d',Math.max(1.2,s*.044));
  face(ctx,[at(.21,.48),at(.32,.27),at(.70,.36),at(.78,.65),at(.58,.75),at(.26,.67)],
    '#e7d5a9','#6e5c55',Math.max(.9,s*.022));
  face(ctx,[at(.25,.45),at(.35,.29),at(.67,.38),at(.74,.61),at(.57,.69),at(.28,.61)],
    '#f2e1b9','#a79070',Math.max(.75,s*.015));
  // Folded page corner and a quill-like witness line, but not floating text.
  face(ctx,[at(.58,.69),at(.74,.61),at(.69,.49)],'#c7a882','#6c5e50',Math.max(.7,s*.015));
  etched(ctx,[at(.32,.45),at(.43,.42),at(.54,.46),at(.63,.44)],
    '#8d755e',Math.max(.75,s*.017));
  etched(ctx,[at(.32,.52),at(.48,.52),at(.60,.55)],
    '#8d755e',Math.max(.7,s*.016));
  etched(ctx,[at(.32,.60),at(.43,.61)],'#8d755e',Math.max(.7,s*.016));
  // Four hammered spine studs and the binding's visible paper underside.
  etched(ctx,[at(.24,.73),at(.61,.83),at(.78,.71)],'#d9b887',Math.max(1,s*.027));
  for(let i=0;i<4;i++)spot(ctx,x+s*(.31+.13*i),y+s*(.765+.023*i),
    Math.max(.65,s*.012),'#f5d6a3');
}
export function paintPressRelics(ctx,board,tileAt){
  if(!ctx||!board||typeof tileAt!=='function')return 0;
  const artifacts=pressRelics(board,tileAt);
  ctx.save();ctx.beginPath();ctx.rect(board.x,board.y,board.mapWidth,board.mapHeight);ctx.clip();
  for(const relic of artifacts){
    const rect=cellRect(board,relic.column,relic.row);
    if(!rect)continue;
    ctx.save();
    ctx.beginPath();ctx.rect(rect.x+1,rect.y+1,rect.width-2,rect.height-2);ctx.clip();
    if(relic.kind==='type-chase')typeChase(ctx,rect.x,rect.y,rect.width);
    else tornFolio(ctx,rect.x,rect.y,rect.width);
    ctx.restore();
  }
  ctx.restore();return artifacts.length;
}
