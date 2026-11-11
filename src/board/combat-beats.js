/** Gate A twelve: genuine four-beat choreography. Read-only animation state
 * consumes puppetPose already based on verified combat events. No timers,
 * collision, gameplay state, RNG or event subscriptions. */
export const GESTURE_IDENTITIES=Object.freeze(['captain','brunna','kess','mirelle','briar','shade']);
const PERSONALITY=Object.freeze({
 captain:Object.freeze({dir:1,step:3.5,lift:3.5,turn:1.2}),
 brunna:Object.freeze({dir:-1,step:2.4,lift:3,turn:.65}),
 kess:Object.freeze({dir:1,step:4.6,lift:3.8,turn:1.6}),
 mirelle:Object.freeze({dir:-1,step:2.6,lift:2.8,turn:1.1}),
 briar:Object.freeze({dir:-1,step:3.7,lift:3.8,turn:1.5}),
 shade:Object.freeze({dir:1,step:3.1,lift:4.8,turn:1.9})
});
const clamp=t=>Number.isFinite(t)?Math.min(1,Math.max(0,t)):0;
const ease=t=>{const p=clamp(t);return p*p*(3-2*p)};
const clean=v=>Math.abs(v)<1e-10?0:v;
/** Sign-changing motion: an actual backload, release, follow-through, settle. */
export function attackBeat(progress){
 const p=clamp(progress);
 let phase='rest',sweep=0;
 if(p>0&&p<.26){phase='anticipation';sweep=-.23*ease(p/.26);}
 else if(p>=.26&&p<.62){phase='release';sweep=-.23+1.13*ease((p-.26)/.36);}
 else if(p>=.62&&p<.80){phase='follow-through';sweep=.90-.52*ease((p-.62)/.18);}
 else if(p>=.80&&p<1){phase='settle';sweep=.38*(1-ease((p-.80)/.20));}
 return Object.freeze({phase,sweep:clean(sweep)});
}
export function figureBeat(id,pose=null){
 const character=PERSONALITY[id];if(!character)return null;
 const progress=clamp(pose?.progress),arc=pose?.kind==='attack'?attackBeat(progress):null;
 const pulse=Math.sin(Math.PI*progress);
 let x=0,y=0,turn=0;
 if(arc){
  x=character.dir*character.step*arc.sweep;
  y=-character.lift*Math.max(0,arc.sweep)+1.5*Math.max(0,-arc.sweep);
  turn=character.turn*arc.sweep;
 }else if(pose?.kind==='recoil'){
  x=-character.dir*3.1*pulse;y=2.2*pulse;turn=-character.turn*.5*pulse;
 }else if(pose?.kind==='stagger'){
  x=-character.dir*4.5*pulse;y=3.3*pulse;turn=-character.turn*.8*pulse;
 }else if(pose?.kind==='move'){
  x=character.dir*.65*pulse;y=-2.6*pulse;turn=character.turn*.16*pulse;
 }else if(pose?.kind==='ward'){
  y=-1.9*pulse;turn=character.turn*.2*pulse;
 }
 return Object.freeze({x:clean(x),y:clean(y),turn:clean(turn),
  sweep:arc?.sweep??0,phase:arc?.phase??(pose?.kind??'rest')});
}
