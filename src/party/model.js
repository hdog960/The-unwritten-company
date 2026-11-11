/** v0.04 illustrated party study — not recruited, not controllable in combat, no live HP mutations. */
export const PARTY_SLOTS = Object.freeze([
  Object.freeze({id:'captain',name:'Captain',role:'Your hero',identity:'Custom hero placeholder',hp:20,maxHp:20,status:'Ready',portrait:'./art/portraits/captain.svg',kind:'hero'}),
  Object.freeze({id:'brunna',name:'Brunna',role:'Oathkeeper',identity:'Disgraced Oathkeeper',hp:24,maxHp:24,status:'Guarded',portrait:'./art/portraits/brunna.svg',kind:'companion'}),
  Object.freeze({id:'kess',name:'Kess',role:'Rogue',identity:'Charming Disaster',hp:16,maxHp:16,status:'Alert',portrait:'./art/portraits/kess.svg',kind:'companion'}),
  Object.freeze({id:'mirelle',name:'Mirelle',role:'Scholar',identity:'Forbidden Scholar',hp:14,maxHp:14,status:'Focused',portrait:'./art/portraits/mirelle.svg',kind:'companion'})
]);
export const INITIAL_PARTY_SELECTION = 'captain';
export function createPartyPreviewState(){
  return Object.freeze({selectedId:INITIAL_PARTY_SELECTION,previewOnly:true});
}
export function selectPartyMember(state,id){
  if(!PARTY_SLOTS.some(member=>member.id===id) || state.selectedId===id) return state;
  return Object.freeze({...state,selectedId:id});
}
export function activePartyMember(state){
  return PARTY_SLOTS.find(member=>member.id===state.selectedId) ?? PARTY_SLOTS[0];
}
export function partyStatusLabel(member){
  if(!member || !Number.isInteger(member.hp)||!Number.isInteger(member.maxHp)||member.maxHp<1||member.hp<0||member.hp>member.maxHp) throw new Error('Invalid preview status');
  return member.hp+' of '+member.maxHp+' health, '+member.status;
}
