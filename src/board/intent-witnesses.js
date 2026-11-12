/** v0.09 Gate A 27 — two original enemy-intent author signatures.
 * Pure visual, printed ON the source tile. Neither enemy AI nor hit odds,
 * target selection, damage, AP, MP, save schema or touch controls change.
 */
import {cellRect} from './geometry.js';
export const INTENT_SEALS=Object.freeze({
 briar:Object.freeze({name:'thorn-press',base:'#a87c53',light:'#f3cc8a',
   lip:'#273c36',ink:'#5e3c32',thread:'#d4b26d',attack:'#ffc094'}),
 shade:Object.freeze({name:'fractured-bell',base:'#6289a3',light:'#d1ede4',
   lip:'#253449',ink:'#344c68',thread:'#a1d1d4',attack:'#d1baff'})
});
const same=(a,b)=>a?.column===b?.column&&a?.row===b?.row;
const point=(board,p)=>Number.isInteger(p?.row)&&Number.isInteger(p?.column)&&
 p.row>=0&&p.column>=0&&p.row<board.rows&&p.column<board.columns;
export function intentWitnessPlan(board,intents,positions={},targets={},partyHp={}){
 if(!board||!Number.isInteger(board.rows)||!Number.isInteger(board.columns)||
 !Number.isFinite(board.tile)||board.tile<=0||!Array.isArray(intents))return Object.freeze([]);
 const seen=new Set(),out=[];
 for(const i of intents){
  if(!i||!Object.hasOwn(INTENT_SEALS,i.foeId)||seen.has(i.foeId))continue;
  const foe=targets?.[i.foeId],victim=positions?.[i.victimId];
  if(!foe||!(foe.hp>0)||!point(board,foe.position)||!point(board,victim)||
   !point(board,i.from)||!same(foe.position,i.from)||
   (partyHp&&Object.hasOwn(partyHp,i.victimId)&&!(partyHp[i.victimId]>0)))continue;
  const rect=cellRect(board,i.from.column,i.from.row);
  if(!rect)continue;
  seen.add(i.foeId);
  out.push(Object.freeze({foeId:i.foeId,victimId:i.victimId,
    attack:i.attack===true,kind:INTENT_SEALS[i.foeId].name,
    row:i.from.row,column:i.from.column,rect:Object.freeze({...rect})}));
 }
 return Object.freeze(out);
}
function path(ctx,points){ctx.beginPath();ctx.moveTo(...points[0]);for(const p of points.slice(1))ctx.lineTo(...p);}
function relief(ctx,points,fill,stroke,w){
 path(ctx,points);ctx.closePath();ctx.fillStyle=fill;ctx.fill();
 if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=w;ctx.lineJoin='round';ctx.stroke();}
}
function score(ctx,points,color,w){
 path(ctx,points);ctx.strokeStyle=color;ctx.lineWidth=w;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke();
}
/** Render both unique foe signatures as small, solid physical press-stamps
 * in the top-left margin of their ACTUAL SOURCE tiles, below all miniatures.
 * Attack has three opposing tear-cuts. Approach has a single hooked seam.
 * No text, noncolor-only statuses, UI, glows, new images or invented intents.
 */
export function paintIntentWitnesses(ctx,board,intents,positions,targets,partyHp){
 const marks=intentWitnessPlan(board,intents,positions,targets,partyHp);
 if(!ctx||!marks.length)return 0;
 for(const mark of marks){
  const {rect,foeId,attack}=mark,s=rect.width,x=rect.x,y=rect.y,
   ink=INTENT_SEALS[foeId],at=(u,v)=>[x+u*s,y+v*s],w=Math.max(.85,s*.022);
  ctx.save();ctx.beginPath();ctx.rect(x+1,y+1,s-2,s-2);ctx.clip();
  // Original stacked enamel and bookpress paper-thickness side wall.
  relief(ctx,[at(.055,.124),at(.315,.09),at(.438,.21),at(.411,.43),at(.108,.453),
    at(.047,.345)],ink.lip,'#182730',w*1.1);
  relief(ctx,[at(.069,.084),at(.307,.067),at(.405,.174),at(.381,.375),
    at(.125,.396),at(.069,.311)],ink.base,ink.light,w*1.15);
  relief(ctx,[at(.080,.092),at(.296,.086),at(.359,.15),at(.135,.175)],ink.light,null,w);
  // Two visually unrelated signatures, NOT recolors.
  if(foeId==='briar'){
   relief(ctx,[at(.13,.315),at(.153,.225),at(.207,.257),at(.244,.168),
     at(.269,.263),at(.339,.241),at(.303,.347)],ink.ink,ink.light,w*.78);
   score(ctx,[at(.148,.344),at(.235,.277),at(.296,.327)],ink.light,w*.8);
   score(ctx,[at(.19,.239),at(.16,.207),at(.195,.211)],ink.thread,w*.7);
  }else{
   // Broken-bell negative space with a suspended cracked clapper.
   relief(ctx,[at(.119,.318),at(.158,.185),at(.23,.169),at(.316,.21),
     at(.34,.332),at(.292,.342),at(.254,.263),at(.217,.326)],ink.ink,ink.light,w*.8);
   score(ctx,[at(.153,.319),at(.236,.359),at(.318,.313)],ink.light,w*.92);
   score(ctx,[at(.239,.214),at(.242,.29),at(.275,.315)],ink.thread,w*.8);
  }
  // ATTACK versus APPROACH is explicit in geometry regardless of color.
  if(attack){
   // Triple notched tooth-cuts proclaim an imminent live attack.
   for(const j of [0,1,2]){
    const xx=.127+j*.091;
    relief(ctx,[at(xx,.404),at(xx+.026,.361),at(xx+.052,.402)],
      ink.attack,ink.lip,w*.6);
   }
  }else{
   // Pursuit is a single folded arrow-stitch, never an exclamation.
   score(ctx,[at(.15,.414),at(.23,.371),at(.31,.414)],ink.thread,w*1.5);
   score(ctx,[at(.19,.429),at(.23,.407),at(.27,.429)],ink.light,w*.75);
  }
  ctx.restore();
 }
 return marks.length;
}
