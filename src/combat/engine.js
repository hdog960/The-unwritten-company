/** v0.07 deterministic combat math against stationary training effigies.
 * No enemy turns, AI, victory screen, campaign or persisted character HP yet.
 */
import {hashSeed,makeRng} from '../engine/random.js';
import {isWalkable,tileKey} from '../movement/pathfinding.js';
import {PARTY_SLOTS} from '../party/model.js';
export const TRAINING_TARGETS=Object.freeze([
  Object.freeze({id:'briar',name:'Briar',fullName:'Briar Sentry',maxHp:13,guard:12,kind:'thorn'}),
  Object.freeze({id:'shade',name:'Shade',fullName:'Hollow Shade',maxHp:16,guard:14,kind:'shade'})
]);
export const PARTY_ATTACK_BONUS=Object.freeze({captain:3,brunna:4,kess:3,mirelle:4});
const OFFENSE=Object.freeze({
  strike:Object.freeze({base:2,bonus:1,die:3}),
  spark:Object.freeze({base:2,bonus:0,die:3}),
  sigil:Object.freeze({base:4,bonus:-1,die:3})
});
const freezePoint=p=>Object.freeze({column:p.column,row:p.row});
export function positionTargets(board,party,prior=null){
  if(!board || !party || !Number.isInteger(board.columns) || !Number.isInteger(board.rows))throw new RangeError('Missing board/party');
  const used=new Set(Object.values(party).map(tileKey));
  const targets={};
  for(const def of TRAINING_TARGETS){
    const preferred=prior?.[def.id]?.position??(def.id==='briar'?{column:board.columns-1,row:0}:{column:0,row:1});
    const candidates=[];
    for(let row=0;row<board.rows;row++)for(let column=0;column<board.columns;column++){
      const p={column,row};if(!isWalkable(board,p)||used.has(tileKey(p)))continue;
      candidates.push({p,distance:Math.abs(p.column-preferred.column)+Math.abs(p.row-preferred.row)});
    }
    candidates.sort((a,b)=>a.distance-b.distance||a.p.row-b.p.row||a.p.column-b.p.column);
    if(!candidates.length)throw new Error('No training target space');
    const past=prior?.[def.id],hp=past?Math.max(0,Math.min(def.maxHp,past.hp)):def.maxHp;
    const next=Object.freeze({...def,hp,position:freezePoint(candidates[0].p)});
    targets[def.id]=next;
    if(hp>0)used.add(tileKey(next.position));
  }
  return Object.freeze(targets);
}
export function livingOccupants(party,targets){
  const occupied={...party};
  for(const target of Object.values(targets??{}))if(target.hp>0)occupied['enemy:'+target.id]=target.position;
  return Object.freeze(occupied);
}
export function defeatedTargetAt(targets,point){
  return Object.values(targets??{}).find(x=>x.hp===0&&x.position.column===point?.column&&x.position.row===point?.row)??null;
}
export function livingTargetAt(targets,point){
  return Object.values(targets??{}).find(x=>x.hp>0&&x.position.column===point?.column&&x.position.row===point?.row)??null;
}
export function hitOnRoll(face,attackBonus,guard){
  if(!Number.isInteger(face)||face<1||face>20)throw new RangeError('Invalid d20 face');
  return face===20 || (face!==1&&face+attackBonus>=guard);
}
export function chanceToHit(actorId,skillId,guard){
  const offense=OFFENSE[skillId];
  if(!offense||!Object.hasOwn(PARTY_ATTACK_BONUS,actorId))return null;
  let hits=0;
  for(let face=1;face<=20;face++)if(hitOnRoll(face,PARTY_ATTACK_BONUS[actorId]+offense.bonus,guard))hits++;
  return hits*5;
}
export function previewStrike(actorId,skillId,target){
  const offense=OFFENSE[skillId];
  if(!offense||!target||target.hp<=0)return null;
  const chance=chanceToHit(actorId,skillId,target.guard);
  return Object.freeze({valid:true,targetId:target.id,guard:target.guard,chance,minDamage:offense.base+1,maxDamage:offense.base+offense.die,
    reason:target.name+' · '+chance+'% hit · Guard '+target.guard+'. Confirm.'});
}
/** Roll is isolated from rendering/frame time and reproducible with the same seed and action index. */
export function rollAttack(seed,index,actorId,skillId,target){
  const offense=OFFENSE[skillId];
  if(!offense||!target||!Object.hasOwn(PARTY_ATTACK_BONUS,actorId)||!Number.isInteger(index)||index<0)throw new RangeError('Invalid attack contract');
  const rng=makeRng(hashSeed(String(seed)+'|attack|'+index+'|'+actorId+'|'+skillId+'|'+target.id));
  const face=1+Math.floor(rng()*20);
  const die=1+Math.floor(rng()*offense.die);
  const bonus=PARTY_ATTACK_BONUS[actorId]+offense.bonus;
  const hit=hitOnRoll(face,bonus,target.guard);
  const critical=hit&&face===20;
  const rawDamage=offense.base+die;
  const damage=hit?Math.min(target.hp,rawDamage*(critical?2:1)):0;
  return Object.freeze({
    id:target.id,seed:String(seed),index,actorId,skillId,face,bonus,total:face+bonus,guard:target.guard,
    hit,critical,damage,rolledDamage:rawDamage,healthBefore:target.hp,healthAfter:Math.max(0,target.hp-damage),maxHp:target.maxHp,
    chance:chanceToHit(actorId,skillId,target.guard)
  });
}
export function applyAttack(targets,outcome){
  const target=targets?.[outcome?.id];
  if(!target||target.hp!==outcome.healthBefore)throw new Error('Stale combat outcome');
  return Object.freeze({...targets,[target.id]:Object.freeze({...target,hp:outcome.healthAfter})});
}
export function combatFeedback(outcome,name){
  const marker=outcome.critical?'CRIT':outcome.hit?'HIT':'MISS';
  return marker+' '+(outcome.hit?'-'+outcome.damage+' ':'')+'· '+name+' '+outcome.healthAfter+'/'+outcome.maxHp+' · '+outcome.face+'+'+outcome.bonus+' vs'+outcome.guard;
}
