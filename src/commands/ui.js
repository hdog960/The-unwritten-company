import {COMMANDS,MAX_AP,createCommandState,remainingAp,chooseAbility,chooseTarget,cancelPreview,confirmPreview,endStudyTurn,changeActor,getCommand,studyOrigin,targetResult,canConfirm,chooseMove,remainingMove,setMovementBoard,setCombatSeed,abilityPreview,startBattle,endBattleTurn} from './engine.js';
import {enemyIntents,aliveParty,aliveFoes} from '../battle/engine.js';
import {previewMovement,MAX_MOVEMENT} from '../movement/pathfinding.js';
import {livingOccupants} from '../combat/engine.js';
import {PARTY_SLOTS} from '../party/model.js';
import {BASE_GUARD} from '../battle/engine.js';

export function createCommandRail({rail,story,view,toggle,apValue,turnValue,skillGrid,readout,confirm,cancel,endTurn,move,combatSummary,onOverlayChange,onPartyChange=()=>{}}){
  let state=createCommandState();
  let board=null,visible=false;
  const buttons=new Map();
  const shortName=id=>({captain:'Capt',brunna:'Brunna',kess:'Kess',mirelle:'Mirelle'})[id]??id;
  for(const skill of COMMANDS){
    const button=document.createElement('button');
    button.type='button';button.className='command-skill';button.dataset.abilityId=skill.id;
    button.title=skill.description;
    button.setAttribute('aria-label',skill.name+', '+skill.ap+' action point'+(skill.ap===1?'':'s')+'. '+skill.description+'. Training preview; foes do not act.');
    const symbol=document.createElement('span');symbol.className='skill-symbol';symbol.textContent=skill.symbol;symbol.setAttribute('aria-hidden','true');
    const name=document.createElement('span');name.className='skill-name';name.textContent=skill.name;
    const cost=document.createElement('span');cost.className='skill-cost';cost.textContent=skill.ap+' AP';
    button.append(symbol,name,cost);
    button.addEventListener('click',()=>{state=chooseAbility(state,skill.id);paint()});
    skillGrid.append(button);
    buttons.set(skill.id,button);
  }
  function overlay(){
    if(!visible||!board)return null;
    const origin=state.positions?.[state.actorId]??studyOrigin(state.actorId,board);
    return {
      actorId:state.actorId,positions:state.positions,origin,
      mode:state.moveMode?'movement':state.abilityId?'ability':'idle',
      command:getCommand(state.abilityId),target:state.target,
      evaluation:state.preview,targets:state.targets,lastCombat:state.lastCombat,visualEvent:state.visualEvent,partyHp:state.partyHp,guards:state.guards,intents:enemyIntents(state,board),battleMode:state.battleMode
    };
  }
  function paint(){
    const ap=remainingAp(state);
    apValue.textContent=ap+'/'+MAX_AP+' AP';
    const foes=Object.values(state.targets??{});
    const active=state.battleMode==='active',finished=state.battleMode==='won'||state.battleMode==='lost';
    const intents=active?enemyIntents(state,board):[];
    combatSummary.textContent=finished?(state.battleMode==='won'?'VICTORY · BOTH FOES DOWN':'DEFEAT · COMPANY FALLEN'):
      active?(intents.length?intents.map(i=>(i.foeId==='briar'?'BRIAR':'SHADE')+'›'+shortName(i.victimId)).join('  ·  '):'SKIRMISH · HOLD'):
      foes.length?foes.map(x=>x.name+' '+x.hp+'/'+x.maxHp).join(' · '):'TWO TRAINING FOES';
    combatSummary.setAttribute('aria-label',
      (active?intents.map(i=>i.name+' '+(i.attack?'will attack ':'will approach ')+i.victimId).join('. ')+'. ':'')+
      (foes.length?foes.map(x=>x.fullName+': '+x.hp+' of '+x.maxHp+' health, Guard '+x.guard).join('. '):'Two stationary training foes'));
    combatSummary.dataset.live=String(foes.filter(x=>x.hp>0).length);
    combatSummary.dataset.foes=JSON.stringify(foes.map(x=>({id:x.id,hp:x.hp,col:x.position.column,row:x.position.row})));
    combatSummary.dataset.intents=JSON.stringify(intents);
    view.dataset.battleMode=state.battleMode;
    view.dataset.round=String(state.turn);
    view.dataset.phaseCount=String(state.phaseCount);
    view.dataset.partyHp=JSON.stringify(state.partyHp??{});
    view.dataset.positions=JSON.stringify(state.positions??{});
    view.dataset.ended=JSON.stringify(state.ended);
    endTurn.textContent=finished?'Replay Skirmish':active?'End Turn':'End Study Turn';
    endTurn.setAttribute('aria-label',finished?'Replay the same seeded skirmish':active?'End this hero turn; enemies act once all living heroes finish':'End demonstration turn');
    endTurn.disabled=false;
    apValue.dataset.ap=String(ap);
    move.textContent='Move '+remainingMove(state)+'/'+MAX_MOVEMENT;
    move.setAttribute('aria-label','Movement: '+remainingMove(state)+' of '+MAX_MOVEMENT+' points available. Preview a path. Does not spend action points.');
    move.dataset.mp=String(remainingMove(state));
    move.dataset.selected=String(state.moveMode);
    move.setAttribute('aria-pressed',String(state.moveMode));
    move.disabled=remainingMove(state)<=0||finished;
    turnValue.textContent=active?'Round '+state.turn:finished?'Battle ended':'Study turn '+state.turn;
    readout.textContent=state.feedback;
    readout.dataset.tone=state.battleMode==='won'?'victory':state.battleMode==='lost'?'defeat':
      state.feedback.startsWith('MISS')?'miss':state.feedback.startsWith('CRIT')?'critical':
      state.feedback.startsWith('HIT')?'hit':state.feedback.startsWith('ROUND')?'enemy':'normal';
    readout.dataset.ability=state.abilityId??'';
    readout.dataset.mode=state.moveMode?'movement':state.abilityId?'ability':'idle';
    readout.dataset.valid=state.preview?(state.preview.valid?'true':'false'):'pending';
    view.dataset.actorId=state.actorId;
    view.dataset.ap=String(ap);
    view.dataset.actorColumn=String(state.positions?.[state.actorId]?.column ?? '');
    view.dataset.actorRow=String(state.positions?.[state.actorId]?.row ?? '');
    readout.dataset.cost=state.preview?.cost===null||state.preview?.cost===undefined?'':String(state.preview.cost);
    readout.dataset.hit=state.lastCombat?String(state.lastCombat.hit):'';
    readout.dataset.roll=state.lastCombat?String(state.lastCombat.face):'';
    readout.dataset.targetHp=state.lastCombat?String(state.lastCombat.healthAfter):'';
    readout.dataset.attackIndex=String(state.rollIndex);
    readout.title=state.feedback.startsWith('ROUND ')&&state.lastEnemyPhase?.length?
      state.lastEnemyPhase.join('; '):
      (/^(HIT|MISS|CRIT)/.test(state.feedback)&&state.lastCombat)?
      ('Roll '+state.lastCombat.face+' + '+state.lastCombat.bonus+' = '+state.lastCombat.total+' versus Guard '+state.lastCombat.guard+'; '+(state.lastCombat.hit?'hit':'miss')+', '+state.lastCombat.damage+' damage.'):
      state.feedback;
    readout.setAttribute('aria-label',readout.title);
    view.dataset.guard=String(state.guards[state.actorId]);
    view.dataset.confirmations=String(state.confirmations);
    for(const [id,button] of buttons){
      const skill=getCommand(id);
      button.setAttribute('aria-label',skill.name+', '+skill.ap+' action point'+(skill.ap===1?'':'s')+'. '+skill.description+(active?'. Real skirmish ability.':'. Training table preview.'));
      const selected=state.abilityId===id;
      button.disabled=skill.ap>ap||finished;
      button.dataset.selected=String(selected);
      button.setAttribute('aria-pressed',String(selected));
    }
    confirm.disabled=!board||!canConfirm(state,board);
    confirm.setAttribute('aria-label',state.moveMode?'Confirm travel destination':state.abilityId?'Confirm '+getCommand(state.abilityId).name+' action':'Confirm selected action');
    cancel.disabled=!state.abilityId&&!state.moveMode;
    onPartyChange(state,intents);
    onOverlayChange(overlay());
  }
  function setBoard(nextBoard){
    board=nextBoard;
    state=setMovementBoard(state,board);
    if(state.target&&(state.abilityId||state.moveMode)){
      const reevaluated=state.moveMode?
        previewMovement(board,livingOccupants(state.positions,state.targets),state.actorId,state.target,remainingMove(state)):
        abilityPreview(state,board);
      state=Object.freeze({...state,preview:reevaluated,feedback:reevaluated.reason});
    }
    paint();
  }
  function setMode(isBoard){
    visible=isBoard;
    story.hidden=isBoard;
    view.hidden=!isBoard;
    rail.classList.toggle('command-mode',isBoard);
    toggle.textContent=isBoard?'← House':'Inspect tactical table';
    if(!isBoard)state=cancelPreview(state);
    paint();
  }
  function setSeed(seed){
    const next=setCombatSeed(state,seed);
    if(next!==state){
      state=board?setMovementBoard(next,board):next;
      paint();
    }
  }
  function selectActor(id){state=changeActor(state,id);paint();}
  function cancelPending(){state=cancelPreview(state);paint();}
  function targetCell(cell,nextBoard){
    if(!visible)return;
    if(nextBoard)board=nextBoard;
    if(state.abilityId||state.moveMode){
      state=chooseTarget(state,cell,board);paint();return;
    }
    // Inspect a miniature on the same board that controls the fight. This
    // does not spend AP/MP, select an ability, trigger RNG or change HP.
    const memberId=Object.entries(state.positions??{}).find(([,where])=>where.column===cell.column&&where.row===cell.row)?.[0];
    if(memberId){
      const next=changeActor(state,memberId);
      const member=PARTY_SLOTS.find(person=>person.id===memberId);
      if(next===state&&memberId!==state.actorId)return;
      state=Object.freeze({...next,feedback:member.name+' · HP '+(state.partyHp?.[memberId]??member.maxHp)+'/'+member.maxHp+
        ' · Guard '+(BASE_GUARD[memberId]+(state.guards?.[memberId]??0))+
        (state.battleMode==='active'?' · Ready to command.':' · Study miniature.')});
      paint();return;
    }
    const foe=Object.values(state.targets??{}).find(x=>x.position.column===cell.column&&x.position.row===cell.row);
    if(foe){
      state=Object.freeze({...state,feedback:foe.fullName+' · '+foe.hp+'/'+foe.maxHp+' HP · Guard '+foe.guard+
        (foe.hp<=0?' · Defeated.':foe.id==='briar'?' · Thorn melee threat.':' · Ranged spectral threat.')});
      paint();
    }
  }
  move.addEventListener('click',()=>{state=chooseMove(state);paint();});
  confirm.addEventListener('click',()=>{state=confirmPreview(state,board);paint();});
  cancel.addEventListener('click',()=>{state=cancelPreview(state);paint();});
  endTurn.addEventListener('click',()=>{
    if(state.battleMode==='active')state=endBattleTurn(state,board);
    else if(state.battleMode==='won'||state.battleMode==='lost')state=startBattle(state,board);
    else state=endStudyTurn(state);
    paint();
  });
  paint();
  function beginSkirmish(seed){
    if(!board)return false;
    state=setCombatSeed(state,seed);
    state=setMovementBoard(state,board);
    state=startBattle(state,board);
    paint();
    return true;
  }
  return Object.freeze({setMode,setBoard,setSeed,beginSkirmish,cancelPending,selectActor,targetCell,getState:()=>state});
}
