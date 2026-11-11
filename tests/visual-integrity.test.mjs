import test from 'node:test';
import assert from 'node:assert/strict';
import {measureBoard,cellRect,getTile} from '../src/board/geometry.js';
import {computeTargetIndicators,paintTargetIndicators} from '../src/board/targeting.js';
import {scenicAnchors,paintFloorVignettes,SCENERY_DESIGNS} from '../src/board/scenery.js';
import {animatedHeroRect} from '../src/board/motion.js';
import {createCommandState,setMovementBoard,changeActor,chooseAbility,chooseMove,chooseTarget,confirmPreview,remainingAp,remainingMove} from '../src/commands/engine.js';
import {startBattle} from '../src/battle/engine.js';
import {renderBoard} from '../src/board/scene.js';
const logical={columns:8,rows:6},board=measureBoard(440,290),point=(column,row)=>({column,row});
const base=()=>setMovementBoard(createCommandState(),logical);
function context(){
  const calls=[];
  const ctx={calls,createLinearGradient(){return{addColorStop(){}}},createRadialGradient(){return{addColorStop(){}}}};
  for(const key of ['save','restore','beginPath','closePath','moveTo','lineTo','arc','ellipse','rect','clip','fill','stroke','fillRect','strokeRect','bezierCurveTo','quadraticCurveTo','translate','scale','setLineDash'])
    ctx[key]=(...args)=>calls.push([key,...args]);
  return ctx;
}
test('real battle previews illuminate living enemies, never empty or invalid tiles',()=>{
  const s=chooseAbility(changeActor(startBattle(base(),logical),'kess'),'spark'),before=JSON.stringify(s);
  const hints=computeTargetIndicators(s,logical);
  assert.ok(hints.length>=1);
  assert.ok(hints.every(x=>x.kind==='enemy'));
  assert.ok(hints.some(x=>x.point.column===s.targets.briar.position.column&&x.point.row===s.targets.briar.position.row));
  assert.equal(JSON.stringify(s),before);
  assert.equal(remainingAp(s),2);
  assert.ok(Object.isFrozen(hints)&&hints.every(Object.isFrozen));
});
test('Ward indicates only actor tile, and training mode retains practice markers',()=>{
  const s=chooseAbility(changeActor(base(),'mirelle'),'ward'),hints=computeTargetIndicators(s,logical);
  assert.equal(hints.length,1);
  assert.equal(hints[0].kind,'self');
  assert.deepEqual(hints[0].point,s.positions.mirelle);
  const practice=computeTargetIndicators(chooseAbility(changeActor(base(),'kess'),'spark'),logical);
  assert.ok(practice.some(x=>x.kind==='enemy')&&practice.some(x=>x.kind==='study'));
  assert.deepEqual(computeTargetIndicators(chooseMove(base()),logical),[]);
});
test('painting legal targets preserves board state and uses clipped world-level geometry',()=>{
  const s=chooseAbility(changeActor(base(),'kess'),'spark'),hints=computeTargetIndicators(s,logical);
  const ctx=context(),before=JSON.stringify(s);
  assert.equal(paintTargetIndicators(ctx,board,hints),hints.length);
  assert.equal(JSON.stringify(s),before);
  assert.ok(ctx.calls.some(x=>x[0]==='clip'));
  assert.equal(ctx.calls.filter(x=>x[0]==='save').length,ctx.calls.filter(x=>x[0]==='restore').length);
});
test('guild floor inlays are unique, walkable, and suppressed under occupied characters',()=>{
  assert.deepEqual(SCENERY_DESIGNS,['inkfall-seal','map-fragment','candlemark','vine-crest']);
  const anchors=scenicAnchors(board);
  assert.ok(anchors.length>=2);
  assert.equal(new Set(anchors.map(p=>p.row+':'+p.column)).size,anchors.length);
  assert.ok(anchors.every(p=>getTile(p.row,p.column)!=='rubble'));
  const occupied=Object.fromEntries(anchors.map((p,i)=>['occupied'+i,{row:p.row,column:p.column}]));
  assert.equal(paintFloorVignettes(context(),board,occupied),0);
  assert.ok(paintFloorVignettes(context(),board,{})>0);
});
test('animated figure traverses exact two-step route and no other hero is displaced',()=>{
  const path=[point(0,0),point(1,0),point(1,1)],actual=path.at(-1);
  const frame=p=>({event:{kind:'move',actorId:'mirelle',path},progress:p});
  assert.deepEqual(animatedHeroRect(board,actual,'mirelle',frame(0)),cellRect(board,0,0));
  assert.deepEqual(animatedHeroRect(board,actual,'mirelle',frame(.5)),cellRect(board,1,0));
  assert.deepEqual(animatedHeroRect(board,actual,'mirelle',frame(1)),cellRect(board,1,1));
  assert.deepEqual(animatedHeroRect(board,actual,'kess',frame(.5)),cellRect(board,1,1));
  assert.deepEqual(animatedHeroRect(board,actual,'mirelle',null),cellRect(board,1,1));
});
test('actual confirmed legal movement embeds actor/path in VFX without charging AP',()=>{
  const initial=changeActor(base(),'mirelle'),from=initial.positions.mirelle;
  const goal=point(from.column,from.row-1),preview=chooseTarget(chooseMove(initial),goal,logical);
  assert.equal(preview.preview.valid,true);
  const moved=confirmPreview(preview,logical);
  assert.equal(moved.visualEvent.actorId,'mirelle');
  assert.deepEqual(moved.visualEvent.path,preview.preview.path);
  assert.equal(remainingAp(moved),2);
  assert.equal(remainingMove(moved),4);
  assert.deepEqual(moved.positions.mirelle,goal);
  assert.deepEqual(animatedHeroRect(board,goal,'mirelle',{event:moved.visualEvent,progress:0}),cellRect(board,from.column,from.row));
});
test('full scene paints actual enemies, legal target markers and floor scenes without gameplay changes',()=>{
  const state=chooseAbility(changeActor(startBattle(base(),logical),'kess'),'spark'),before=JSON.stringify(state);
  const ctx=context(),hints=computeTargetIndicators(state,logical);
  renderBoard(ctx,board,null,{actorId:state.actorId,positions:state.positions,targets:state.targets,
    partyHp:state.partyHp,guards:state.guards,targetIndicators:hints,intents:[]});
  assert.ok(ctx.calls.length>900);
  assert.equal(ctx.calls.filter(x=>x[0]==='save').length,ctx.calls.filter(x=>x[0]==='restore').length);
  assert.equal(JSON.stringify(state),before);
});
