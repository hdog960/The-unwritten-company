import {PARTY_SLOTS,createPartyPreviewState,selectPartyMember,activePartyMember,partyStatusLabel} from './model.js';

function node(tag,cls,text){
  const item=document.createElement(tag);
  if(cls)item.className=cls;
  if(text!==undefined)item.textContent=text;
  return item;
}
export function createPartyRail({chronicle,party,roster,readout,onSelect=()=>{}}){
  let state=createPartyPreviewState();
  const buttons=[];
  let currentBattle=null;
  for(const member of PARTY_SLOTS){
    const button=node('button','party-card');
    button.type='button';
    button.dataset.memberId=member.id;
    button.setAttribute('aria-label',member.name+', '+member.identity+', '+partyStatusLabel(member)+'. Illustration only; not recruited or playable.');
    const portrait=node('span','portrait-frame');
    const image=node('img');
    image.className='portrait-image';
    image.alt='';
    image.decoding='async';
    image.draggable=false;
    image.src=new URL(member.portrait,document.baseURI).href;
    portrait.append(image);
    const copy=node('span','party-card-copy');
    const title=node('span','party-name',member.name);
    const role=node('span','party-role',member.role);
    const bottom=node('span','party-health');
    const line=node('span','party-health-track');
    const fill=node('span','party-health-fill');
    fill.style.width=(member.hp/member.maxHp*100).toFixed(0)+'%';
    line.append(fill);
    bottom.append(line,node('span','party-health-num',member.hp+'/'+member.maxHp));
    copy.append(title,role,bottom);
    button.append(portrait,copy);
    button.addEventListener('click',()=>setSelected(member.id));
    roster.append(button);
    buttons.push(button);
  }
  function render(){
    const selectedMember=activePartyMember(state);
    roster.dataset.selectedId=selectedMember.id;
    buttons.forEach(button=>{
      const member=PARTY_SLOTS.find(m=>m.id===button.dataset.memberId);
      const selected=member.id===selectedMember.id;
      button.dataset.selected=String(selected);
      button.setAttribute('aria-pressed',String(selected));
      button.tabIndex=selected?0:-1;
      const hp=currentBattle?.partyHp?.[member.id]??member.hp;
      const ended=currentBattle?.ended?.includes(member.id)??false;
      const fallen=!!currentBattle?.partyHp&&hp<=0;
      const inactive=currentBattle?.battleMode==='active'&&(fallen||ended);
      button.disabled=!!inactive;
      button.dataset.fallen=String(fallen);
      button.dataset.ended=String(ended);
      button.querySelector('.party-health-num').textContent=hp+'/'+member.maxHp;
      button.querySelector('.party-health-fill').style.width=(100*hp/member.maxHp)+'%';
      button.setAttribute('aria-label',member.name+', '+member.role+', '+hp+' of '+member.maxHp+' HP'+(fallen?', fallen':ended?', turn completed':'')+'.');
    });
    const hp=currentBattle?.partyHp?.[selectedMember.id]??selectedMember.hp;
    readout.textContent=selectedMember.name+' · '+hp+'/'+selectedMember.maxHp+' HP · '+(currentBattle?.battleMode==='active'?'In skirmish':currentBattle?.battleMode==='won'?'Victory':currentBattle?.battleMode==='lost'?'Defeat':'Study only')+'.';
    readout.dataset.selectedId=selectedMember.id;
  }
  function setSelected(id,focus=false){
    if(currentBattle?.battleMode==='active'&&((currentBattle.partyHp?.[id]??0)<=0||currentBattle.ended?.includes(id)))return;
    state=selectPartyMember(state,id);
    render();
    onSelect(state.selectedId);
    if(focus)buttons.find(button=>button.dataset.memberId===state.selectedId)?.focus();
  }
  roster.addEventListener('keydown',event=>{
    if(!['ArrowDown','ArrowUp','Home','End'].includes(event.key))return;
    event.preventDefault();
    const index=PARTY_SLOTS.findIndex(item=>item.id===state.selectedId);
    let next=index;
    if(event.key==='ArrowDown')next=(index+1)%PARTY_SLOTS.length;
    if(event.key==='ArrowUp')next=(index-1+PARTY_SLOTS.length)%PARTY_SLOTS.length;
    if(event.key==='Home')next=0;
    if(event.key==='End')next=PARTY_SLOTS.length-1;
    setSelected(PARTY_SLOTS[next].id,true);
  });
  render();
  function setMode(isBoard){
    chronicle.hidden=isBoard;
    party.hidden=!isBoard;
    if(!isBoard&&party.contains(document.activeElement)){
      // The board-mode toggle is in a separate visible rail; preserve keyboard position.
      document.getElementById('battle-toggle')?.focus({preventScroll:true});
    }
  }
  function updateBattle(battle){
    currentBattle=battle;
    if(battle?.actorId)state=selectPartyMember(state,battle.actorId);
    render();
  }
  return Object.freeze({setMode,updateBattle,getState:()=>state,select:id=>setSelected(id)});
}
