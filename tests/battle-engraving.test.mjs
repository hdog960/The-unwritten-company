import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {measureBoard,cellRect} from '../src/board/geometry.js';
import {threatEngravings,paintThreatEngravings,paintTravelEngraving} from '../src/board/battle-engraving.js';
import {renderBoard} from '../src/board/scene.js';
import {createCommandState,setMovementBoard,chooseMove,chooseTarget} from '../src/commands/engine.js';
import {enemyIntents,startBattle} from '../src/battle/engine.js';

const fake=()=>{
 const calls=[],ctx={calls,globalAlpha:1};
 for(const key of ['save','restore','beginPath','closePath','moveTo','lineTo','bezierCurveTo','quadraticCurveTo',
  'arc','ellipse','rect','clip','fill','stroke','setLineDash','strokeRect','fillRect','translate','scale'])
   ctx[key]=(...args)=>calls.push([key,...args]);
 ctx.createLinearGradient=()=>({addColorStop(){}});
 ctx.createRadialGradient=()=>({addColorStop(){}});
 return ctx;
};
const balance=ctx=>assert.equal(ctx.calls.filter(x=>x[0]==='save').length,ctx.calls.filter(x=>x[0]==='restore').length);
const world={columns:8,rows:6};
const s=startBattle(setMovementBoard(createCommandState(),world),world);
test('actual enemy intents become deterministic immutable threat marks, not fake attacks',()=>{
 const board=measureBoard(435,286),intents=enemyIntents(s,{columns:8,rows:6});
 const before=JSON.stringify({s,intents,board}),marks=threatEngravings(board,intents,s.positions);
 assert.ok(marks.length>0);
 assert.ok(marks.every(p=>p.victimId in s.positions&&p.start.x>=board.x&&p.end.x>=board.x));
 assert.equal(JSON.stringify({s,intents,board}),before);
 assert.ok(Object.isFrozen(marks)&&marks.every(Object.isFrozen));
 assert.deepEqual(marks,threatEngravings(board,intents,s.positions));
 assert.deepEqual(threatEngravings(board,[{victimId:'missing',from:{column:0,row:0},attack:true}],s.positions),[]);
});
test('attack and approach have different stroke rhythms/shapes and preserve map bounds',()=>{
 for(const [w,h] of [[328,270],[435,286],[483,326]]){
  const board=measureBoard(w,h),positions={captain:{column:1,row:4},kess:{column:5,row:2}};
  const intentions=[{foeId:'briar',from:{column:6,row:2},victimId:'kess',attack:true},
    {foeId:'shade',from:{column:0,row:0},victimId:'captain',attack:false}];
  const a=fake(),b=fake();
  assert.equal(paintThreatEngravings(a,board,intentions,positions),2);
  assert.equal(paintThreatEngravings(b,board,intentions,positions),2);
  assert.deepEqual(a.calls,b.calls);
  assert.ok(a.calls.some(x=>x[0]==='clip'));
  assert.ok(a.calls.some(x=>x[0]==='bezierCurveTo'));
  assert.ok(a.calls.filter(x=>x[0]==='setLineDash').length>=3);
  balance(a);
  assert.ok(cellRect(board,1,4));
 }
});
test('two enemy marks on one hero do not stamp duplicate threat rim',()=>{
 const board=measureBoard(435,286),positions={captain:{column:2,row:3}};
 const marks=[{foeId:'a',from:{column:6,row:0},victimId:'captain',attack:true},
   {foeId:'b',from:{column:0,row:0},victimId:'captain',attack:true}];
 const ctx=fake();
 assert.equal(paintThreatEngravings(ctx,board,marks,positions),2);
 assert.equal(ctx.calls.filter(x=>x[0]==='arc').length,1);
 balance(ctx);
});
test('valid travel is dotted with footsteps, invalid is crosscut with no AP or position changes',()=>{
 for(const [w,h] of [[328,270],[435,286],[483,326]]){
  const board=measureBoard(w,h);
  const original={mode:'movement',target:{column:2,row:2},
   evaluation:{valid:true,path:[{column:0,row:2},{column:1,row:2},{column:2,row:2}]}};
  const a=fake(),b=fake(),before=JSON.stringify(original);
  assert.equal(paintTravelEngraving(a,board,original),true);
  assert.equal(paintTravelEngraving(b,board,original),true);
  assert.deepEqual(a.calls,b.calls);
  assert.equal(JSON.stringify(original),before);
  const bad=fake();
  assert.equal(paintTravelEngraving(bad,board,{...original,evaluation:{valid:false,path:[]}}),true);
  assert.notDeepEqual(a.calls,bad.calls);
  assert.ok(bad.calls.some(x=>x[0]==='clip'));
  assert.equal(paintTravelEngraving(fake(),board,{mode:'idle'}),false);
  balance(a);balance(bad);
 }
});
test('engraved underlay composes before figures; threat glyphs remain identifiable',()=>{
 const scene=fs.readFileSync('src/board/scene.js','utf8');
 assert.ok(scene.indexOf('paintThreatEngravings(ctx,board,overlay?.intents')<scene.indexOf('drawHero(ctx,rect'));
 assert.ok(scene.indexOf('paintTravelEngraving(ctx,board,overlay)')<scene.indexOf('drawFoe(ctx,rect'));
 assert.ok(scene.indexOf('paintThreatSymbol(ctx,rect,glyph.attack')>scene.indexOf('drawFoe(ctx,rect'));
 assert.match(scene,/for\(const glyph of threatGlyphs/,'repeated attacks must share one visible glyph');
 assert.doesNotMatch(scene,/ctx\.fillRect\(rect\.x\+2,rect\.y\+2,rect\.width-4/);
 const board=measureBoard(435,286),ctx=fake();
 const state=chooseTarget(chooseMove(s),{column:2,row:5},{columns:8,rows:6});
 const before=JSON.stringify(state);
 renderBoard(ctx,board,null,{mode:'movement',origin:state.positions[state.actorId],
   target:state.target,evaluation:state.preview,actorId:state.actorId,positions:state.positions,
   targets:state.targets,intents:enemyIntents(state,board),partyHp:state.partyHp,guards:state.guards});
 assert.ok(ctx.calls.length>900);
 balance(ctx);
 assert.equal(JSON.stringify(state),before);
});
