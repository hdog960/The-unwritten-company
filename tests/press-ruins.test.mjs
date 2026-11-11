import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {measureBoard,cellRect,getTile} from '../src/board/geometry.js';
import {pressRelics,paintPressRelics,PRESS_RELIC_KINDS} from '../src/board/press-ruins.js';
import {renderBoard} from '../src/board/scene.js';
import {createCommandState,setMovementBoard} from '../src/commands/engine.js';

const ink=()=>{
  const calls=[],ctx={calls};
  for(const m of ['save','restore','beginPath','closePath','moveTo','lineTo','bezierCurveTo',
    'quadraticCurveTo','arc','ellipse','rect','clip','fill','stroke','fillRect','strokeRect',
    'setLineDash','translate','scale'])
    ctx[m]=(...args)=>calls.push([m,...args]);
  ctx.createLinearGradient=()=>({addColorStop(){}});
  ctx.createRadialGradient=()=>({addColorStop(){}});
  return ctx;
};
const balanced=ctx=>assert.equal(ctx.calls.filter(x=>x[0]==='save').length,ctx.calls.filter(x=>x[0]==='restore').length);
test('only existing impassable rubble hosts two visibly distinct Inkfall relics',()=>{
  assert.deepEqual(PRESS_RELIC_KINDS,['type-chase','torn-folio']);
  for(const [w,h] of [[328,270],[435,286],[483,326]]){
    const board=measureBoard(w,h),before=JSON.stringify(board);
    const sites=pressRelics(board,getTile);
    assert.ok(sites.length>=2,'there should be two authored pieces on the published board');
    assert.ok(sites.every(site=>getTile(site.row,site.column)==='rubble'));
    assert.ok(sites.every(site=>!!cellRect(board,site.column,site.row)));
    assert.equal(new Set(sites.map(site=>site.kind)).size,2);
    assert.ok(Object.isFrozen(sites)&&sites.every(Object.isFrozen));
    assert.equal(JSON.stringify(board),before);
  }
});
test('physical type chase and torn folio have different deterministic drawn geometries',()=>{
  const board=measureBoard(435,286),rubble=pressRelics(board,getTile);
  const a=ink(),b=ink();
  assert.equal(paintPressRelics(a,board,getTile),rubble.length);
  assert.equal(paintPressRelics(b,board,getTile),rubble.length);
  assert.deepEqual(a.calls,b.calls);
  assert.ok(a.calls.some(c=>c[0]==='clip'));
  assert.ok(a.calls.filter(c=>c[0]==='arc').length>=2);
  balanced(a);
  assert.equal(paintPressRelics(null,board,getTile),0);
  assert.equal(paintPressRelics(ink(),board,()=> 'stone'),0);
});
test('new press wreckage sits below both hero and enemy rendering without changing battle',()=>{
  const scene=fs.readFileSync('src/board/scene.js','utf8');
  assert.ok(scene.indexOf('paintPressRelics(ctx,board,getTile)')>=0);
  assert.ok(scene.indexOf('paintPressRelics(ctx,board,getTile)')<scene.indexOf('drawHero(ctx,rect,id'));
  const state=setMovementBoard(createCommandState(),{columns:8,rows:6}),before=JSON.stringify(state);
  const ctx=ink(),board=measureBoard(435,286);
  renderBoard(ctx,board,null,{actorId:state.actorId,positions:state.positions,
    partyHp:state.partyHp,guards:state.guards,targets:state.targets,intents:[]});
  assert.ok(ctx.calls.length>1400);
  balanced(ctx);
  assert.equal(JSON.stringify(state),before);
});