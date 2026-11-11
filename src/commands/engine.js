/** v0.07 — command, movement, and deterministic training-combat state. */
import {PARTY_SLOTS} from '../party/model.js';
import {getTile} from '../board/geometry.js';
import {MAX_MOVEMENT,placeParty,previewMovement,moveActor} from '../movement/pathfinding.js';
import {positionTargets,livingOccupants,livingTargetAt,defeatedTargetAt,previewStrike,rollAttack,applyAttack,combatFeedback} from '../combat/engine.js';
import {startBattle,endBattleTurn,outcomeFor} from '../battle/engine.js';

export const MAX_AP = 2;
export const COMMANDS = Object.freeze([
  Object.freeze({id:'strike',name:'Strike',symbol:'⚔',ap:1,range:1,target:'near',description:'Adjacent target · melee'}),
  Object.freeze({id:'spark',name:'Spark',symbol:'✧',ap:1,range:3,target:'away',description:'Up to 3 tiles · arcane bolt'}),
  Object.freeze({id:'ward',name:'Ward',symbol:'◇',ap:1,range:0,target:'self',description:'Self-target · +2 guard this turn'}),
  Object.freeze({id:'sigil',name:'Sigil',symbol:'✦',ap:2,range:2,target:'away',description:'Up to 2 tiles · powerful sigil'})
]);
const COST_BY_ID = new Map(COMMANDS.map(command=>[command.id,command]));
export function getCommand(id){return COST_BY_ID.get(id) ?? null;}
export function studyOrigin(actorId,board){
  if(!board||!Number.isInteger(board.columns)||!Number.isInteger(board.rows)||board.columns<4||board.rows<3)throw new Error('Invalid board geometry');
  const anchors={
    captain:[1,board.rows-2],
    brunna:[2,board.rows-1],
    kess:[board.columns-2,1],
    mirelle:[board.columns-2,board.rows-2]
  };
  const at=anchors[actorId]??anchors.captain;
  return Object.freeze({column:at[0],row:at[1]});
}
export function isInside(board,target){
  return !!board&&Number.isInteger(target?.column)&&Number.isInteger(target?.row)&&target.column>=0&&target.row>=0&&target.column<board.columns&&target.row<board.rows;
}
export function targetResult(command,actorId,target,board,positions=null){
  if(!command || !isInside(board,target))return Object.freeze({valid:false,reason:'Choose a tile inside the table.'});
  const source=positions?.[actorId] ?? studyOrigin(actorId,board);
  const distance=Math.abs(source.column-target.column)+Math.abs(source.row-target.row);
  if(command.target==='self'){
    return distance===0?Object.freeze({valid:true,reason:'Origin tile ready.'}):Object.freeze({valid:false,reason:'Ward must target the marked origin.'});
  }
  if(distance===0)return Object.freeze({valid:false,reason:'Choose a tile beyond your origin.'});
  if(distance>command.range)return Object.freeze({valid:false,reason:'Target is outside '+command.range+'-tile range.'});
  if(command.id==='sigil'&&getTile(target.row,target.column)==='rubble')
    return Object.freeze({valid:false,reason:'A sigil cannot be traced on loose rubble.'});
  return Object.freeze({valid:true,reason:'Target ready · '+distance+' tile'+(distance===1?'':'s')+' from origin.'});
}
export function createCommandState(){
  const ap=Object.fromEntries(PARTY_SLOTS.map(m=>[m.id,MAX_AP]));
  const mp=Object.fromEntries(PARTY_SLOTS.map(m=>[m.id,MAX_MOVEMENT]));
  const guards=Object.freeze(Object.fromEntries(PARTY_SLOTS.map(m=>[m.id,0])));
  return Object.freeze({actorId:'captain',ap:Object.freeze(ap),mp:Object.freeze(mp),guards,positions:null,targets:null,battleMode:'practice',partyHp:null,ended:Object.freeze([]),phaseCount:0,lastEnemyPhase:Object.freeze([]),seed:'Lantern-001',rollIndex:0,lastCombat:null,turn:1,abilityId:null,moveMode:false,target:null,preview:null,confirmations:0,feedback:'Choose Move or an ability. Two stationary training foes await.'});
}
export function remainingAp(state){return state.ap[state.actorId];}
export function remainingMove(state){return state.mp[state.actorId];}
export function setMovementBoard(state,board){
  const placed=placeParty(board,state.positions);
  const targets=positionTargets(board,placed,state.targets);
  const changed=!state.positions || PARTY_SLOTS.some(x=>state.positions[x.id].column!==placed[x.id].column||state.positions[x.id].row!==placed[x.id].row);
  const shifted=!state.targets || Object.keys(targets).some(id=>state.targets[id].position.column!==targets[id].position.column||state.targets[id].position.row!==targets[id].position.row);
  return changed||shifted?Object.freeze({...state,positions:placed,targets,target:null,preview:null}):state;
}
export function setCombatSeed(state,seed){
  const clean=String(seed??'Lantern-001').trim().replace(/[^A-Za-z0-9 _-]/g,'').slice(0,32)||'Lantern-001';
  if(clean===state.seed)return state;
  const fresh=createCommandState();
  return Object.freeze({...fresh,seed:clean,positions:state.positions,targets:null,feedback:'New training seed '+clean+'. Open the board to reset targets.'});
}
export function abilityPreview(state,board){
  const skill=getCommand(state.abilityId);
  if(!skill||!state.target)return null;
  const legality=targetResult(skill,state.actorId,state.target,board,state.positions);
  if(!legality.valid||skill.target==='self')return legality;
  const enemy=livingTargetAt(state.targets,state.target);
  if(enemy)return previewStrike(state.actorId,skill.id,enemy);
  if(defeatedTargetAt(state.targets,state.target))return Object.freeze({valid:false,reason:'Target defeated. Choose a living foe.'});
  return state.battleMode==='active'?Object.freeze({valid:false,reason:'Choose a living foe. Empty tiles cannot be attacked.'}):Object.freeze({...legality,reason:'Empty tile · practice only. No damage.'});
}
export function changeActor(state,id){
  if(!PARTY_SLOTS.some(member=>member.id===id)||id===state.actorId)return state;
  if(state.battleMode==='won'||state.battleMode==='lost')return state;
  if(state.battleMode==='active' && ((state.partyHp[id]??0)<=0||state.ended.includes(id)))return state;
  return Object.freeze({...state,actorId:id,abilityId:null,moveMode:false,target:null,preview:null,feedback:'Now inspecting '+PARTY_SLOTS.find(member=>member.id===id).name+'. AP and movement remain tied to each character.'});
}
export function chooseAbility(state,id){
  const ability=getCommand(id);
  if(state.battleMode==='won'||state.battleMode==='lost'||state.battleMode==='active'&&((state.partyHp[state.actorId]??0)<=0||state.ended.includes(state.actorId)))return state;
  if(!ability||ability.ap>remainingAp(state))return state;
  return Object.freeze({...state,abilityId:id,moveMode:false,target:null,preview:null,feedback:ability.name+' selected. Tap a highlighted tile to preview; no AP spent.'});
}
export function chooseMove(state){
  if(state.battleMode==='won'||state.battleMode==='lost'||state.battleMode==='active'&&((state.partyHp[state.actorId]??0)<=0||state.ended.includes(state.actorId)))return state;
  if(remainingMove(state)<=0)return state;
  return Object.freeze({...state,abilityId:null,moveMode:true,target:null,preview:null,feedback:'Move selected. Tap a destination for the least-cost route; no movement spent yet.'});
}
export function chooseTarget(state,target,board){
  if(!state.abilityId&&!state.moveMode)return state;
  if(!isInside(board,target))return state;
  const candidate=Object.freeze({...state,target:Object.freeze({...target})});
  const preview=state.moveMode?previewMovement(board,livingOccupants(state.positions,state.targets),state.actorId,target,remainingMove(state)):
    abilityPreview(candidate,board);
  return Object.freeze({...candidate,preview,feedback:preview.reason});
}
export function cancelPreview(state){
  if(!state.abilityId && !state.moveMode && !state.target)return state;
  return Object.freeze({...state,abilityId:null,moveMode:false,target:null,preview:null,feedback:'Targeting canceled. No AP or movement spent.'});
}
export function canConfirm(state,board){
  if(state.battleMode==='won'||state.battleMode==='lost'||state.battleMode==='active'&&((state.partyHp[state.actorId]??0)<=0||state.ended.includes(state.actorId)))return false;
  if(state.moveMode)return !!state.target && !!state.positions && previewMovement(board,livingOccupants(state.positions,state.targets),state.actorId,state.target,remainingMove(state)).valid;
  const command=getCommand(state.abilityId);
  return !!command && !!state.target && remainingAp(state)>=command.ap && abilityPreview(state,board)?.valid===true;
}
export function confirmPreview(state,board){
  if(!canConfirm(state,board))return state;
  if(state.moveMode){
    const route=previewMovement(board,livingOccupants(state.positions,state.targets),state.actorId,state.target,remainingMove(state));
    if(!route.valid)return state;
    const nextMp=Object.freeze({...state.mp,[state.actorId]:remainingMove(state)-route.cost});
    const nextPositions=moveActor(state.positions,state.actorId,state.target);
    return Object.freeze({...state,mp:nextMp,positions:nextPositions,moveMode:false,abilityId:null,target:null,preview:null,confirmations:state.confirmations+1,
      feedback:'Moved '+(route.path.length-1)+' tiles for '+route.cost+' movement. '+nextMp[state.actorId]+' movement remains; AP unchanged.'});
  }
  const command=getCommand(state.abilityId);
  const next=Object.freeze({...state.ap,[state.actorId]:remainingAp(state)-command.ap});
  const opponent=command.target==='self'?null:livingTargetAt(state.targets,state.target);
  if(opponent){
    const outcome=rollAttack(state.seed,state.rollIndex,state.actorId,command.id,opponent);
    const updated=Object.freeze({...state,ap:next,targets:applyAttack(state.targets,outcome),rollIndex:state.rollIndex+1,lastCombat:Object.freeze({...outcome,position:opponent.position}),
      abilityId:null,moveMode:false,target:null,preview:null,confirmations:state.confirmations+1,feedback:combatFeedback(outcome,opponent.name)});
    return state.battleMode==='active'&&outcomeFor(updated)==='won'?
      Object.freeze({...updated,battleMode:'won',feedback:'VICTORY · Both foes down. Tap Replay.'}):updated;
  }
  if(command.id==='ward'){
    const guards=Object.freeze({...state.guards,[state.actorId]:2});
    return Object.freeze({...state,ap:next,guards,abilityId:null,moveMode:false,target:null,preview:null,confirmations:state.confirmations+1,
      feedback:state.battleMode==='active'?'Ward +2 Guard · ready for enemy attacks.':'Ward ready · Guard +2. No enemy actions yet.'});
  }
  const message=command.name+' study confirmed at column '+(state.target.column+1)+', row '+(state.target.row+1)+'. '+command.ap+' AP used; no damage or effects applied.';
  return Object.freeze({...state,ap:next,moveMode:false,abilityId:null,target:null,preview:null,confirmations:state.confirmations+1,feedback:message});
}
export {startBattle,endBattleTurn} from '../battle/engine.js';
export function endStudyTurn(state){
  const next=Object.freeze({...state.ap,[state.actorId]:MAX_AP});
  const nextMp=Object.freeze({...state.mp,[state.actorId]:MAX_MOVEMENT});
  const guards=Object.freeze({...state.guards,[state.actorId]:0});
  return Object.freeze({...state,ap:next,mp:nextMp,guards,turn:state.turn+1,abilityId:null,moveMode:false,target:null,preview:null,
    feedback:'Demonstration turn '+(state.turn+1)+'. '+MAX_AP+' AP and '+MAX_MOVEMENT+' movement restored for '+PARTY_SLOTS.find(x=>x.id===state.actorId).name+'. No enemy turn.'});
}
