/** v0.08: one deterministic, fully finishable tactical skirmish. No campaign/save logic. */
import {hashSeed,makeRng} from '../engine/random.js';
import {hitOnRoll,positionTargets} from '../combat/engine.js';
import {isWalkable,shortestPath,tileKey} from '../movement/pathfinding.js';
import {PARTY_SLOTS} from '../party/model.js';
export const BASE_GUARD=Object.freeze({captain:12,brunna:14,kess:12,mirelle:12});
export const ENEMY_KITS=Object.freeze({
  briar:Object.freeze({name:'Briar',range:1,speed:2,bonus:3,damage:2,die:2,attack:'Thorn lash'}),
  shade:Object.freeze({name:'Shade',range:3,speed:1,bonus:2,damage:1,die:2,attack:'Hollow ray'})
});
const point=p=>Object.freeze({column:p.column,row:p.row});
const dist=(a,b)=>Math.abs(a.column-b.column)+Math.abs(a.row-b.row);
export const aliveParty=state=>PARTY_SLOTS.filter(m=>(state.partyHp?.[m.id]??0)>0).map(m=>m.id);
export const aliveFoes=state=>Object.values(state.targets??{}).filter(t=>t.hp>0);
export const outcomeFor=state=>{
  if(aliveFoes(state).length===0)return 'won';
  if(aliveParty(state).length===0)return 'lost';
  return 'active';
};
export function createPartyHp(){return Object.freeze(Object.fromEntries(PARTY_SLOTS.map(m=>[m.id,m.maxHp])));}
function nearestHero(foe,state){
  const alive=aliveParty(state);
  return alive.length?alive.slice().sort((a,b)=>
    dist(foe.position,state.positions[a])-dist(foe.position,state.positions[b])||
    PARTY_SLOTS.findIndex(x=>x.id===a)-PARTY_SLOTS.findIndex(x=>x.id===b)
  )[0]:null;
}
function enemyRoute(foe,state,board,victimId){
  const kit=ENEMY_KITS[foe.id],target=state.positions[victimId];
  if(dist(foe.position,target)<=kit.range)return {position:point(foe.position),cost:0};
  const occupied={...state.positions};
  for(const enemy of aliveFoes(state))if(enemy.id!==foe.id)occupied['foe:'+enemy.id]=enemy.position;
  const options=[];
  for(let row=0;row<board.rows;row++)for(let column=0;column<board.columns;column++){
    const to={row,column};
    if(!isWalkable(board,to)||Object.values(occupied).some(p=>p.row===row&&p.column===column))continue;
    const route=shortestPath(board,foe.position,to,occupied,'enemy:'+foe.id);
    if(!route.found||route.cost>kit.speed)continue;
    if(dist(to,target)>=dist(foe.position,target))continue;
    options.push({position:point(to),cost:route.cost,distance:dist(to,target)});
  }
  options.sort((a,b)=>a.distance-b.distance||a.cost-b.cost||a.position.row-b.position.row||a.position.column-b.position.column);
  return options[0]??{position:point(foe.position),cost:0};
}
/** Current telegraphs are genuine predictions, with no hidden re-roll of target choice. */
export function enemyIntents(state,board){
  if(!board||state.battleMode!=='active')return Object.freeze([]);
  return Object.freeze(aliveFoes(state).map(foe=>{
    const victimId=nearestHero(foe,state);
    if(!victimId)return null;
    const route=enemyRoute(foe,state,board,victimId);
    const attack=dist(route.position,state.positions[victimId])<=ENEMY_KITS[foe.id].range;
    return Object.freeze({foeId:foe.id,victimId,position:route.position,from:foe.position,attack,
      name:ENEMY_KITS[foe.id].name,verb:attack?ENEMY_KITS[foe.id].attack:'Approach',
      detail:(attack?'Targeting ':'Closing on ')+PARTY_SLOTS.find(x=>x.id===victimId).name});
  }).filter(Boolean));
}
export function rollEnemyAttack(seed,round,foe,actorId,guard){
  const kit=ENEMY_KITS[foe.id];
  if(!kit||!Object.hasOwn(BASE_GUARD,actorId)||!Number.isInteger(round)||round<1)throw new Error('Invalid enemy roll');
  const rng=makeRng(hashSeed(seed+'|enemy|'+round+'|'+foe.id+'|'+actorId));
  const face=1+Math.floor(rng()*20);
  const die=1+Math.floor(rng()*kit.die);
  const hit=hitOnRoll(face,kit.bonus,guard);
  const critical=hit&&face===20;
  const damage=hit?(kit.damage+die)*(critical?2:1):0;
  return Object.freeze({foeId:foe.id,actorId,face,bonus:kit.bonus,guard,hit,critical,damage});
}
export function resolveEnemyPhase(state,board){
  if(state.battleMode!=='active'||outcomeFor(state)!=='active')return state;
  let targets={...state.targets},hp={...state.partyHp},log=[];
  for(const def of Object.keys(ENEMY_KITS)){
    const foe=targets[def];
    if(!foe||foe.hp<=0)continue;
    const working=Object.freeze({...state,targets:Object.freeze({...targets}),partyHp:Object.freeze({...hp})});
    const targetId=nearestHero(foe,working);
    if(!targetId)break;
    const path=enemyRoute(foe,working,board,targetId);
    const moved=Object.freeze({...foe,position:path.position});
    targets[def]=moved;
    if(dist(path.position,state.positions[targetId])>ENEMY_KITS[def].range){
      log.push(ENEMY_KITS[def].name+' advances');
      continue;
    }
    const guard=BASE_GUARD[targetId]+(state.guards[targetId]??0);
    const result=rollEnemyAttack(String(state.seed),state.turn,moved,targetId,guard);
    const damage=Math.min(hp[targetId],result.damage);
    hp[targetId]=Math.max(0,hp[targetId]-damage);
    const name=PARTY_SLOTS.find(x=>x.id===targetId).name;
    log.push(ENEMY_KITS[def].name+' '+(result.hit?'hits '+name+' -'+damage:'misses '+name)+
      ' ('+result.face+'+'+result.bonus+' vs '+result.guard+')');
  }
  const frozenHp=Object.freeze(hp),nextTargets=Object.freeze(targets);
  const result=Object.freeze({...state,targets:nextTargets,partyHp:frozenHp,lastEnemyPhase:Object.freeze(log),phaseCount:(state.phaseCount??0)+1});
  return Object.freeze({...result,battleMode:outcomeFor(result),feedback:log.join(' · ')||'The field falls quiet.'});
}
export function startBattle(state,board){
  if(!board||!state.positions)throw new Error('Board required to start the skirmish');
  const partyHp=createPartyHp();
  const fresh=positionTargets(board,state.positions);
  const ap=Object.freeze(Object.fromEntries(PARTY_SLOTS.map(m=>[m.id,2])));
  const mp=Object.freeze(Object.fromEntries(PARTY_SLOTS.map(m=>[m.id,5])));
  const guards=Object.freeze(Object.fromEntries(PARTY_SLOTS.map(m=>[m.id,0])));
  return Object.freeze({...state,partyHp,targets:fresh,ap,mp,guards,actorId:'captain',battleMode:'active',
    ended:Object.freeze([]),phaseCount:0,turn:1,rollIndex:0,lastCombat:null,lastEnemyPhase:Object.freeze([]),
    abilityId:null,moveMode:false,target:null,preview:null,confirmations:0,
    feedback:'SKIRMISH · Defeat both foes. End each hero turn to face their counterattack.'});
}
export function endBattleTurn(state,board){
  if(state.battleMode!=='active'||!board)return state;
  if((state.partyHp?.[state.actorId]??0)<=0||state.ended.includes(state.actorId))return state;
  const ended=Object.freeze([...state.ended,state.actorId]);
  const next=Object.freeze({...state,ended,abilityId:null,moveMode:false,target:null,preview:null});
  const available=aliveParty(next).filter(id=>!ended.includes(id));
  if(available.length){
    const who=available[0];
    return Object.freeze({...next,actorId:who,feedback:PARTY_SLOTS.find(x=>x.id===who).name+' is ready. '+ended.length+' hero turn(s) complete.'});
  }
  const counter=resolveEnemyPhase(next,board);
  if(counter.battleMode==='lost')return Object.freeze({...counter,ended,abilityId:null,moveMode:false,target:null,preview:null,feedback:'DEFEAT · Company fallen. Replay to try again.'});
  const alive=aliveParty(counter);
  const ap=Object.freeze({...counter.ap,...Object.fromEntries(alive.map(id=>[id,2]))});
  const mp=Object.freeze({...counter.mp,...Object.fromEntries(alive.map(id=>[id,5]))});
  const guards=Object.freeze(Object.fromEntries(PARTY_SLOTS.map(m=>[m.id,0])));
  return Object.freeze({...counter,ap,mp,guards,actorId:alive[0],turn:state.turn+1,ended:Object.freeze([]),
    abilityId:null,moveMode:false,target:null,preview:null,
    feedback:'ROUND '+(state.turn+1)+' · '+counter.lastEnemyPhase.map(event=>event.replace(/ \([^)]*\)/g,'')).join('; ')});
}
