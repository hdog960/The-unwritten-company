import test from 'node:test';
import assert from 'node:assert/strict';
import {measureBoard} from '../src/board/geometry.js';
import {paintImpactFragments} from '../src/board/impact-fragments.js';
import {drawWorldEffect,EFFECT_DURATION_MS} from '../src/board/effects.js';
const ink=()=>{
 const calls=[],ctx={calls,globalAlpha:1};
 for(const key of ['save','restore','beginPath','closePath','moveTo','lineTo','quadraticCurveTo',
  'bezierCurveTo','arc','ellipse','rect','clip','fill','stroke','translate','scale','setLineDash'])
  ctx[key]=(...args)=>calls.push([key,...args]);
 return ctx;
};
const position={column:4,row:3},from={column:5,row:1};
test('critical, hit and miss each produce different ephemeral hand-cut artwork',()=>{
 for(const dims of [[328,270],[435,286],[483,326]]){
  const board=measureBoard(...dims),sig=[];
  for(const [kind,expected] of [['miss',4],['hit',6],['critical',9]]){
   const event={kind,from,to:position},before=JSON.stringify(event);
   const a=ink(),b=ink();
   assert.equal(paintImpactFragments(a,board,event,.48),expected);
   assert.equal(paintImpactFragments(b,board,event,.48),expected);
   assert.deepEqual(a.calls,b.calls);
   assert.equal(JSON.stringify(event),before);
   assert.equal(a.calls.filter(x=>x[0]==='save').length,a.calls.filter(x=>x[0]==='restore').length);
   assert.ok(a.calls.some(x=>x[0]==='clip'));
   sig.push(JSON.stringify(a.calls));
  }
  assert.equal(new Set(sig).size,3);
 }
});
test('nothing paints before contact, after recovery, without real target or on unknown events',()=>{
 const board=measureBoard(435,286),a=ink();
 for(const progress of [-1,0,1,2,NaN])
  assert.equal(paintImpactFragments(a,board,{kind:'hit',from,to:position},progress),0);
 assert.equal(a.calls.length,0);
 assert.equal(paintImpactFragments(a,board,{kind:'enemy-phase',to:position},.5),0);
 assert.equal(paintImpactFragments(a,board,{kind:'hit',to:{column:99,row:99}},.5),0);
 assert.equal(a.calls.length,0);
});
test('real visual hit/miss/crit frames use clipped miniature-safe flourishes, without state changes',()=>{
 const board=measureBoard(435,286);
 for(const kind of ['hit','miss','critical']){
  const event={kind,from,to:position,token:'impact-test',skillId:'spark'};
  const before=JSON.stringify(event),ctx=ink();
  assert.equal(drawWorldEffect(ctx,board,{event,progress:.82}),true);
  assert.ok(ctx.calls.some(c=>c[0]==='clip'));
  assert.equal(ctx.calls.filter(x=>x[0]==='save').length,ctx.calls.filter(x=>x[0]==='restore').length);
  assert.equal(JSON.stringify(event),before);
 }
 assert.equal(EFFECT_DURATION_MS,490);
});
