import {COMMANDS,MAX_AP,createCommandState,remainingAp,chooseAbility,chooseTarget,cancelPreview,confirmPreview,endStudyTurn,changeActor,getCommand,studyOrigin,targetResult,canConfirm} from './engine.js';

export function createCommandRail({rail,story,view,toggle,apValue,turnValue,skillGrid,readout,confirm,cancel,endTurn,onOverlayChange}){
  let state=createCommandState();
  let board=null,visible=false;
  const buttons=new Map();
  for(const skill of COMMANDS){
    const button=document.createElement('button');
    button.type='button';button.className='command-skill';button.dataset.abilityId=skill.id;
    button.title=skill.description;
    button.setAttribute('aria-label',skill.name+', '+skill.ap+' action point'+(skill.ap===1?'':'s')+'. '+skill.description+'. Demonstration only.');
    const symbol=document.createElement('span');symbol.className='skill-symbol';symbol.textContent=skill.symbol;symbol.setAttribute('aria-hidden','true');
    const name=document.createElement('span');name.className='skill-name';name.textContent=skill.name;
    const cost=document.createElement('span');cost.className='skill-cost';cost.textContent=skill.ap+' AP';
    button.append(symbol,name,cost);
    button.addEventListener('click',()=>{state=chooseAbility(state,skill.id);paint()});
    skillGrid.append(button);
    buttons.set(skill.id,button);
  }
  function overlay(){
    if(!visible||!board||!state.abilityId)return null;
    return {origin:studyOrigin(state.actorId,board),command:getCommand(state.abilityId),target:state.target,evaluation:state.preview};
  }
  function paint(){
    const ap=remainingAp(state);
    apValue.textContent=ap+'/'+MAX_AP+' AP';
    apValue.dataset.ap=String(ap);
    turnValue.textContent='Study turn '+state.turn;
    readout.textContent=state.feedback;
    readout.dataset.ability=state.abilityId??'';
    readout.dataset.valid=state.preview?(state.preview.valid?'true':'false'):'pending';
    view.dataset.actorId=state.actorId;
    view.dataset.ap=String(ap);
    view.dataset.confirmations=String(state.confirmations);
    for(const [id,button] of buttons){
      const skill=getCommand(id);
      const selected=state.abilityId===id;
      button.disabled=skill.ap>ap;
      button.dataset.selected=String(selected);
      button.setAttribute('aria-pressed',String(selected));
    }
    confirm.disabled=!board||!canConfirm(state,board);
    cancel.disabled=!state.abilityId;
    onOverlayChange(overlay());
  }
  function setBoard(nextBoard){
    board=nextBoard;
    if(state.target&&state.abilityId){
      const reevaluated=targetResult(getCommand(state.abilityId),state.actorId,state.target,board);
      if(!reevaluated.valid){state=cancelPreview(state)}
      else state=Object.freeze({...state,preview:reevaluated});
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
  function selectActor(id){state=changeActor(state,id);paint();}
  function targetCell(cell,nextBoard){
    if(!visible||!state.abilityId)return;
    if(nextBoard)board=nextBoard;
    state=chooseTarget(state,cell,board);paint();
  }
  confirm.addEventListener('click',()=>{state=confirmPreview(state,board);paint();});
  cancel.addEventListener('click',()=>{state=cancelPreview(state);paint();});
  endTurn.addEventListener('click',()=>{state=endStudyTurn(state);paint();});
  paint();
  return Object.freeze({setMode,setBoard,selectActor,targetCell,getState:()=>state});
}
