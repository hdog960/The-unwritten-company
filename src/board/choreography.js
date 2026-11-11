/** The Illuminated Table — battle-synchronous puppet timing.
 * Visual-only. Authority for positions, damage, AP and enemy phases remains
 * in the deterministic battle/command engines, not on animation frames.
 */
const clamp=v=>Number.isFinite(v)?Math.max(0,Math.min(1,v)):0;
const same=(a,b)=>!!a&&!!b&&a.column===b.column&&a.row===b.row;
const ATTACK_END=.60,IMPACT_START=.53,IMPACT_END=.96;
export const PUPPET_PHASES=Object.freeze({attackEnd:ATTACK_END,impactStart:IMPACT_START,impactEnd:IMPACT_END});
export function visibleMarks(frame){
  if(!frame?.event)return [];
  const event=frame.event,marks=event.kind==='enemy-phase'?event.marks??[]:[event];
  const p=clamp(frame.progress);
  return marks.map((mark,index)=>{
    const offset=event.kind==='enemy-phase'?index*.2:0;
    const scale=event.kind==='enemy-phase'?1-.2*Math.max(0,marks.length-1):1;
    const local=(p-offset)/Math.max(.05,scale);
    return {mark,progress:clamp(local),visible:local>=0&&local<=1};
  });
}
export function puppetPose(frame,position){
  if(!position||!frame?.event)return null;
  for(const {mark,progress:p,visible} of visibleMarks(frame)){
    if(!visible)continue;
    if(mark.kind==='ward'&&same(position,mark.to)){
      if(p>.03&&p<.98)return {kind:'ward',progress:clamp((p-.03)/.95)};
    }
    if(mark.kind==='move'&&same(position,mark.to))
      return {kind:'move',progress:p};
    if(!['hit','critical','miss'].includes(mark.kind))continue;
    // The attacker visibly prepares/casts while the projectile travels.
    if(same(position,mark.from)&&p<=ATTACK_END)
      return {kind:'attack',progress:clamp(p/ATTACK_END)};
    // No physical recoil on a miss or before the projectile arrives.
    if(mark.kind!=='miss'&&same(position,mark.to)&&p>=IMPACT_START&&p<=IMPACT_END)
      return {kind:mark.kind==='critical'?'stagger':'recoil',
        progress:clamp((p-IMPACT_START)/(IMPACT_END-IMPACT_START))};
  }
  return null;
}
