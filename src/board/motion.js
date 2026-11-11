/** Visual movement only; live actor hit tests use authoritative destination state.
 * A miniature walks along its actually confirmed legal path, never a shortcut.
 */
import {cellRect} from './geometry.js';
const clamp=n=>Number.isFinite(n)?Math.min(1,Math.max(0,n)):0;
const smooth=t=>t*t*(3-2*t);
const same=(a,b)=>!!a&&!!b&&a.column===b.column&&a.row===b.row;
export function animatedHeroRect(board,actualPoint,actorId,frame){
  const resting=actualPoint?cellRect(board,actualPoint.column,actualPoint.row):null;
  if(!resting)return null;
  const effect=frame?.event;
  if(effect?.kind!=='move'||effect.actorId!==actorId||!Array.isArray(effect.path)||effect.path.length<2)return resting;
  const path=effect.path;
  if(!same(path.at(-1),actualPoint))return resting;
  const steps=path.length-1,along=smooth(clamp(frame.progress))*steps;
  const index=Math.min(steps-1,Math.floor(along)),progress=along-index;
  const from=cellRect(board,path[index]?.column,path[index]?.row),to=cellRect(board,path[index+1]?.column,path[index+1]?.row);
  if(!from||!to)return resting;
  const x=from.x+(to.x-from.x)*progress;
  const y=from.y+(to.y-from.y)*progress;
  return Object.freeze({...resting,x,y});
}
