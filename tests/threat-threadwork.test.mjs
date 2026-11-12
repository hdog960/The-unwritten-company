import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {measureBoard,cellRect} from '../src/board/geometry.js';
import {THREAD_MATERIALS,threatThreadPlan,paintThreatThreadwork} from '../src/board/threat-threadwork.js';
import {threatEngravings,paintThreatEngravings,threatGlyphs} from '../src/board/battle-engraving.js';
import {createCommandState,setMovementBoard,chooseTarget,chooseMove,remainingAp,remainingMove} from '../src/commands/engine.js';
import {startBattle,enemyIntents} from '../src/battle/engine.js';
import {renderBoard} from '../src/board/scene.js';
const board=measureBoard(440,290),world={columns:8,rows:6},point=(column,row)=>({column,row});
function canvas(){
 const calls=[],ctx={calls,globalAlpha:1};
 for(const method of ['save','restore','beginPath','closePath','moveTo','lineTo',
  'arc','ellipse','rect','clip','fill','stroke','setLineDash','fillRect','strokeRect',
  'bezierCurveTo','quadraticCurveTo','translate','scale'])ctx[method]=(...args)=>calls.push([method,...args]);
 ctx.createLinearGradient=()=>({addColorStop(){}});
 ctx.createRadialGradient=()=>({addColorStop(){}});
 return ctx;
}
const balanced=c=>assert.equal(c.calls.filter(x=>x[0]==='save').length,
 c.calls.filter(x=>x[0]==='restore').length);
const example=()=>{
 const positions={captain:point(0,5),kess:point(0,0),
  brunna:point(3,5),mirelle:point(3,4)};
 const intent=[
  {foeId:'briar',from:point(7,0),victimId:'captain',attack:true},
  {foeId:'shade',from:point(7,5),victimId:'kess',attack:false}
 ];
 return {positions,intent,marks:threatEngravings(board,intent,positions)};
};
test('Briar thorn engraving and Shade fractured bell use truly different first-party material and geometry',()=>{
 assert.deepEqual(Object.keys(THREAD_MATERIALS),['briar','shade']);
 assert.notEqual(THREAD_MATERIALS.briar.name,THREAD_MATERIALS.shade.name);
 assert.notEqual(THREAD_MATERIALS.briar.light,THREAD_MATERIALS.shade.light);
 assert.ok(Object.values(THREAD_MATERIALS).every(Object.isFrozen));
});
test('real intent sources drive immutable pure threat-stitch plans, preserving actual actor state',()=>{
 const {marks,positions}=example(),before=JSON.stringify({board,marks,positions});
 const one=threatThreadPlan(board,marks,positions),two=threatThreadPlan(board,marks,positions);
 assert.deepEqual(one,two);assert.equal(JSON.stringify({board,marks,positions}),before);
 assert.ok(one.length>2);
 assert.ok(Object.isFrozen(one)&&one.every(Object.isFrozen)&&one.every(x=>Object.isFrozen(x.tangent)));
 assert.deepEqual(new Set(one.map(x=>x.foeId)),new Set(['briar','shade']));
 assert.deepEqual(new Set(one.map(x=>x.type)),new Set(['thorn-stitch','bell-fracture']));
});
test('true attack has three physical barbs; approach has only one, no fake attack color reliance',()=>{
 const {marks,positions}=example(),plan=threatThreadPlan(board,marks,positions);
 const attacks=plan.filter(x=>x.foeId==='briar'),walks=plan.filter(x=>x.foeId==='shade');
 assert.ok(attacks.length>0&&walks.length>0);
 assert.ok(attacks.every(x=>x.attack===true&&x.notches===3));
 assert.ok(walks.every(x=>x.attack===false&&x.notches===1));
 const c=canvas(),a=canvas();
 assert.equal(paintThreatThreadwork(c,board,marks,positions),plan.length);
 assert.equal(paintThreatThreadwork(a,board,marks,positions),plan.length);
 assert.deepEqual(c.calls,a.calls);balanced(c);
 // No fake animated battlefield-time state, no full circular route/target.
 assert.equal(c.calls.filter(x=>x[0]==='arc').length,0);
 assert.ok(c.calls.filter(x=>x[0]==='fill').length>=plan.length*2);
});
test('each stitch is bounded in real battlefield and never crosses hero body interiors',()=>{
 const {marks,positions}=example(),all=threatThreadPlan(board,marks,positions);
 for(const s of all){
  assert.ok(s.x-s.s*.095>=board.x&&s.x+s.s*.095<=board.x+board.mapWidth);
  assert.ok(s.y-s.s*.095>=board.y&&s.y+s.s*.095<=board.y+board.mapHeight);
  for(const pos of Object.values(positions)){
   const r=cellRect(board,pos.column,pos.row),pad=r.width*.22;
   const center=s.x>=r.x+pad&&s.x<=r.x+r.width-pad&&
     s.y>=r.y+pad&&s.y<=r.y+r.width-pad;
   assert.equal(center,false,'physical ink does not print inside a real hero figure');
  }
 }
});
test('short attacks, absent victims and unsourced foes cannot invent a stitch trail',()=>{
 const {marks,positions}=example();
 assert.deepEqual(threatThreadPlan(null,marks,positions),[]);
 assert.deepEqual(threatThreadPlan({...board,tile:0},marks,positions),[]);
 assert.deepEqual(threatThreadPlan(board,null,positions),[]);
 assert.deepEqual(threatThreadPlan(board,[{...marks[0],foeId:'invented'}],positions),[]);
 assert.deepEqual(threatThreadPlan(board,[{...marks[0],start:null}],positions),[]);
 assert.deepEqual(threatThreadPlan(board,[{...marks[0],end:{x:NaN,y:0}}],positions),[]);
 const short={...marks[0],start:{x:40,y:40},end:{x:41,y:40}};
 assert.deepEqual(threatThreadPlan(board,[short],positions),[]);
});
test('real four-hero/two-foe seeded battle still owns enemy intentions and actual source figures',()=>{
 const battle=startBattle(setMovementBoard(createCommandState(),world),world);
 const intents=enemyIntents(battle,world),before=JSON.stringify({battle,intents});
 const stamps=threatEngravings(board,intents,battle.positions);
 assert.equal(stamps.length,2);
 assert.equal(threatGlyphs(intents,battle.positions).length>=1,true);
 const printed=threatThreadPlan(board,stamps,battle.positions);
 assert.ok(printed.every(s=>intents.some(i=>i.foeId===s.foeId&&i.victimId===s.victimId)));
 assert.equal(JSON.stringify({battle,intents}),before);
});
test('authored source marks and actual attack/approach remain deterministic at native 38–70px sizes',()=>{
 const {positions,intent}=example();
 for(const tile of [38,44,51,70]){
  const b={...board,tile,mapWidth:board.columns*tile,mapHeight:board.rows*tile};
  const marks=threatEngravings(b,intent,positions),plan=threatThreadPlan(b,marks,positions);
  assert.ok(plan.length>1);
  const a=canvas(),again=canvas();
  assert.equal(paintThreatThreadwork(a,b,marks,positions),plan.length);
  assert.equal(paintThreatThreadwork(again,b,marks,positions),plan.length);
  assert.deepEqual(a.calls,again.calls);
  assert.ok(a.calls.some(x=>x[0]==='clip'));
  balanced(a);
 }
});
test('real live threat engraving retains exactly one non-target open arc per threatened hero',()=>{
 const positions={captain:point(2,3)};
 const intents=[
  {foeId:'briar',from:point(6,0),victimId:'captain',attack:true},
  {foeId:'shade',from:point(0,0),victimId:'captain',attack:false}
 ];
 const ctx=canvas();
 assert.equal(paintThreatEngravings(ctx,board,intents,positions),2);
 const arcs=ctx.calls.filter(x=>x[0]==='arc');
 assert.equal(arcs.length,1,'multiple enemies must NOT stamp overlapping victim rings');
 assert.ok(arcs.every(a=>a[5]-a[4]<Math.PI*.5),'never a full/selectable target bullseye');
 assert.ok(ctx.calls.some(c=>c[0]==='bezierCurveTo'),
  'a very faint genuine source-victim score remains, never a fictitious movement path');
 balanced(ctx);
});
test('tangible enemy thread and paper-corner arc paint only below native figures and targeting',()=>{
 const scene=fs.readFileSync('src/board/scene.js','utf8');
 const trace=fs.readFileSync('src/board/battle-engraving.js','utf8');
 assert.ok(trace.includes('paintThreatThreadwork(ctx,board,marks,positions)'));
 assert.ok(scene.indexOf('paintThreatEngravings(ctx,board,overlay?.intents')>=0);
 assert.ok(scene.indexOf('paintThreatEngravings(ctx,board,overlay?.intents')<
   scene.indexOf('drawHero(ctx,rect,id'));
 assert.ok(scene.indexOf('paintThreatEngravings(ctx,board,overlay?.intents')<
   scene.indexOf('drawFoe(ctx,rect,foe'));
 assert.ok(!trace.includes('ctx.arc(x,y,r,0,Math.PI*2)'),
  'old full victim ring must be gone');
});
test('actual move previews, AP/MP and the full source-painted battle remain unaffected',()=>{
 const game=startBattle(setMovementBoard(createCommandState(),world),world);
 const move=chooseTarget(chooseMove(game),point(2,5),world);
 const before=JSON.stringify(move),ap=remainingAp(move),mp=remainingMove(move);
 const ink=canvas();
 renderBoard(ink,board,null,{actorId:move.actorId,positions:move.positions,targets:move.targets,
  partyHp:move.partyHp,guards:move.guards,intents:enemyIntents(move,world)});
 assert.equal(JSON.stringify(move),before);
 assert.equal(remainingAp(move),ap);assert.equal(remainingMove(move),mp);
 balanced(ink);
});
test('pure local source and strict PWA cache prevent network, clock, DOM and stale worker upgrade',()=>{
 const source=fs.readFileSync('src/board/threat-threadwork.js','utf8');
 const sw=fs.readFileSync('service-worker.js','utf8');
 for(const banned of ['Math.random','fetch(','window.','document.','setInterval','setTimeout',
 'requestAnimationFrame','localStorage','AudioContext','addEventListener'])
  assert.ok(!source.includes(banned),banned);
 assert.ok(sw.includes('v0.09-gate-a31-r1'));
 assert.equal(sw.split("'./src/board/threat-threadwork.js'").length-1,1);
 assert.ok(!sw.includes('skipWaiting('));
});
