import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {measureBoard,cellRect} from '../src/board/geometry.js';
import {createCommandState,setMovementBoard,chooseMove,chooseTarget,remainingAp,remainingMove} from '../src/commands/engine.js';
import {startBattle,enemyIntents} from '../src/battle/engine.js';
import {intentWitnessPlan,paintIntentWitnesses,INTENT_SEALS} from '../src/board/intent-witnesses.js';
import {SOURCE_THREADS,paintThreatEngravings} from '../src/board/battle-engraving.js';
import {renderBoard} from '../src/board/scene.js';
const world={columns:8,rows:6},board=measureBoard(440,290),state=startBattle(setMovementBoard(createCommandState(),world),world),intents=enemyIntents(state,world);
const props={positions:state.positions,targets:state.targets,partyHp:state.partyHp};
const plan=(a=intents,p=props)=>intentWitnessPlan(board,a,p.positions,p.targets,p.partyHp);
function canvas(){const calls=[],ctx={calls,globalAlpha:1};for(const op of ['save','restore','beginPath','closePath','moveTo','lineTo','arc','ellipse','rect','clip','fill','stroke','fillRect','strokeRect','bezierCurveTo','quadraticCurveTo','setLineDash','translate','scale','rotate'])ctx[op]=(...args)=>calls.push([op,...args]);ctx.createLinearGradient=()=>({addColorStop(){}});ctx.createRadialGradient=()=>({addColorStop(){}});return ctx;}
const balanced=c=>assert.equal(c.calls.filter(x=>x[0]==='save').length,c.calls.filter(x=>x[0]==='restore').length);
test('Briar and Shade have genuinely different first-party sculpted seals and ink threads',()=>{
 assert.deepEqual(Object.keys(INTENT_SEALS),['briar','shade']);assert.deepEqual([INTENT_SEALS.briar.name,INTENT_SEALS.shade.name],['thorn-press','fractured-bell']);
 assert.notEqual(INTENT_SEALS.briar.base,INTENT_SEALS.shade.base);assert.notEqual(SOURCE_THREADS.briar.attack,SOURCE_THREADS.shade.attack);
 assert.notEqual(SOURCE_THREADS.briar.approach,SOURCE_THREADS.shade.approach);assert.ok(Object.values(INTENT_SEALS).every(Object.isFrozen));
});
test('two TRUE initial enemy intents yield just two real, immutable source-cell sigils',()=>{
 const before=JSON.stringify(state),marks=plan();assert.equal(marks.length,2);assert.deepEqual(new Set(marks.map(x=>x.foeId)),new Set(['briar','shade']));
 for(const m of marks){const i=intents.find(x=>x.foeId===m.foeId);assert.equal(m.attack,i.attack);assert.equal(m.victimId,i.victimId);
 assert.deepEqual({column:m.column,row:m.row},state.targets[m.foeId].position);assert.deepEqual(m.rect,cellRect(board,m.column,m.row));assert.ok(Object.isFrozen(m)&&Object.isFrozen(m.rect));}
 assert.ok(Object.isFrozen(marks));assert.deepEqual(marks,plan());assert.equal(JSON.stringify(state),before);
});
test('practice, invalid, missing and fabricated foes never create counterfeit intent art',()=>{
 assert.deepEqual(plan([]),[]);assert.deepEqual(intentWitnessPlan(board,null,props.positions,props.targets),[]);
 assert.deepEqual(intentWitnessPlan(null,intents,props.positions,props.targets),[]);
 assert.deepEqual(intentWitnessPlan({...board,tile:0},intents,props.positions,props.targets),[]);
 assert.deepEqual(plan([{foeId:'fiction',victimId:'captain',from:state.positions.captain,attack:true}]),[]);
});
test('dead foes, stale source, absent/fallen victims cannot project visible threat seals',()=>{
 const first=intents[0],foe=state.targets[first.foeId];
 assert.deepEqual(plan([first],{...props,targets:{...props.targets,[first.foeId]:{...foe,hp:0}}}),[]);
 assert.deepEqual(plan([{...first,from:{column:0,row:0}}]),[]);
 assert.deepEqual(plan([{...first,victimId:'fictional'}]),[]);
 assert.deepEqual(plan([first],{...props,partyHp:{...props.partyHp,[first.victimId]:0}}),[]);
 assert.deepEqual(plan([{...first,from:{column:board.columns,row:0}}]),[]);
});
test('an individual living enemy cannot be counted twice',()=>{
 assert.equal(plan([intents[0],intents[0]]).length,1);
 assert.equal(plan([intents[1],intents[0],intents[1]]).length,2);
});
test('two authored silhouettes and attack/approach shapes produce four distinct physical plans',()=>{
 const signatures=[];
 for(const id of ['briar','shade'])for(const attack of [true,false]){
  const src=intents.find(x=>x.foeId===id),live={...src,attack},a=canvas(),b=canvas();
  assert.equal(paintIntentWitnesses(a,board,[live],props.positions,props.targets,props.partyHp),1);
  assert.equal(paintIntentWitnesses(b,board,[live],props.positions,props.targets,props.partyHp),1);
  assert.deepEqual(a.calls,b.calls);balanced(a);signatures.push(JSON.stringify(a.calls));
 }
 assert.equal(new Set(signatures).size,4);
});
test('all original seals stay clipped into foe source cell upper-left edge at phone scales',()=>{
 for(const tile of [38,44,51,70]){const b={...board,tile,mapWidth:board.columns*tile,mapHeight:board.rows*tile};
  for(const i of intents){const c=canvas(),rect=cellRect(b,i.from.column,i.from.row);
   assert.equal(paintIntentWitnesses(c,b,[i],props.positions,props.targets,props.partyHp),1);
   for(const call of c.calls.filter(x=>x[0]==='moveTo'||x[0]==='lineTo')){
    const u=(call[1]-rect.x)/tile,v=(call[2]-rect.y)/tile;
    assert.ok(u>=.04&&u<=.46,'source witness may not cover face/neighbor');
    assert.ok(v>=.05&&v<=.46,'source witness may not hide lower torso/target corners');
   }
   assert.equal(c.calls.filter(x=>x[0]==='clip').length,1);balanced(c);
  }
 }
});
test('actual intent trails preserve their authoritative 4v2 source/sink and distinct attack dash',()=>{
 const before=JSON.stringify(intents),c=canvas();
 assert.equal(paintThreatEngravings(c,board,intents,props.positions),2);
 assert.ok(c.calls.some(x=>x[0]==='bezierCurveTo'));
 assert.ok(c.calls.filter(x=>x[0]==='setLineDash').length>=4);
 assert.equal(JSON.stringify(intents),before);balanced(c);
});
test('real 4v2 full scene and true move-preview AP/MP are untouched, seals drawn beneath figures',()=>{
 const before=JSON.stringify(state),c=canvas();renderBoard(c,board,null,{actorId:state.actorId,positions:props.positions,targets:props.targets,partyHp:props.partyHp,guards:state.guards,intents,ended:[]});
 balanced(c);assert.equal(JSON.stringify(state),before);
 const move=chooseTarget(chooseMove(state),{column:0,row:4},world),mp=remainingMove(move),ap=remainingAp(move);
 paintIntentWitnesses(canvas(),board,intents,props.positions,props.targets,props.partyHp);
 assert.equal(remainingMove(move),mp);assert.equal(remainingAp(move),ap);
 const src=fs.readFileSync('src/board/scene.js','utf8');
 assert.ok(src.indexOf('paintThreatEngravings(ctx,board')<src.indexOf('paintIntentWitnesses(ctx,board'));
 assert.ok(src.indexOf('paintIntentWitnesses(ctx,board')<src.indexOf('drawHero(ctx,rect,id'));
 assert.ok(src.indexOf('paintIntentWitnesses(ctx,board')<src.indexOf('drawFoe(ctx,rect,foe'));
});
test('zero independent clocks, input, network, storage; exact safe offline module graph',()=>{
 const src=fs.readFileSync('src/board/intent-witnesses.js','utf8'),sw=fs.readFileSync('service-worker.js','utf8');
 for(const x of ['fetch(','Math.random','setTimeout','setInterval','requestAnimationFrame','window.','document.','localStorage','addEventListener','AudioContext'])assert.ok(!src.includes(x),x);
 assert.ok(sw.includes('v0.09-gate-a29-r1'));
 assert.equal(sw.split("'./src/board/intent-witnesses.js'").length-1,1);
 assert.ok(!sw.includes('skipWaiting('));
});
