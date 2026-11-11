import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {ACTION_SEALS,actionSealState,paintActionSeal} from '../src/board/action-seals.js';
import {measureBoard,cellRect} from '../src/board/geometry.js';
import {puppetPose,visibleMarks} from '../src/board/choreography.js';
const mock=()=>{
 const calls=[],ctx={calls};
 for(const m of ['save','restore','beginPath','closePath','moveTo','lineTo','arc','ellipse','rect','clip','fill','stroke'])
  ctx[m]=(...a)=>calls.push([m,...a]);
 return ctx;
};
test('six authentic figure-specific artwork signatures and bounded rendering',()=>{
 assert.deepEqual(Object.keys(ACTION_SEALS),['captain','brunna','kess','mirelle','briar','shade']);
 assert.equal(new Set(Object.values(ACTION_SEALS).map(x=>x.kind)).size,6);
 const seen=[];
 for(const size of [38,44,51,69]){
  const board=measureBoard(size*8+18,size*6+18),rect=cellRect(board,1,2);
  for(const id of Object.keys(ACTION_SEALS)){
   const a=mock(),b=mock(),pose={kind:'attack',progress:.5};
   assert.equal(paintActionSeal(a,rect,id,pose),true);
   assert.equal(paintActionSeal(b,rect,id,pose),true);
   assert.deepEqual(a.calls,b.calls);
   assert.ok(a.calls.some(c=>c[0]==='clip'));
   assert.equal(a.calls.filter(c=>c[0]==='save').length,a.calls.filter(c=>c[0]==='restore').length);
   for(const c of a.calls.filter(c=>['moveTo','lineTo'].includes(c[0])))
    assert.ok(c[1]>=rect.x&&c[1]<=rect.x+rect.width&&c[2]>=rect.y&&c[2]<=rect.y+rect.height,id+' tile overflow');
   if(size===44)seen.push(JSON.stringify(a.calls));
  }
 }
 assert.equal(new Set(seen).size,6);
});
test('no false artwork when idle, moving, dead, or at the two settled attack endpoints',()=>{
 const rect={x:1,y:2,width:44,height:44};
 for(const id of Object.keys(ACTION_SEALS)){
  const ctx=mock();
  for(const pose of [null,{kind:'move',progress:.5},{kind:'attack',progress:0},
   {kind:'attack',progress:1},{kind:'recoil',progress:.5}]){
   assert.equal(paintActionSeal(ctx,rect,id,pose),false);
  }
  assert.equal(paintActionSeal(ctx,rect,id,{kind:'attack',progress:.5},{fallen:true}),false);
  assert.equal(ctx.calls.length,0);
  assert.equal(paintActionSeal(mock(),rect,id,{kind:'ward',progress:.5}),true);
 }
 assert.equal(actionSealState('other',{kind:'attack',progress:.5}),null);
});
test('real phase changes the semantic ink preparation; misses do not mark victims',()=>{
 const from={column:2,row:3},to={column:5,row:1};
 const event={kind:'miss',from,to,token:'real'},before=JSON.stringify(event);
 const early=puppetPose({event,progress:.08},from);
 assert.equal(actionSealState('kess',early).backwards,true);
 const later=puppetPose({event,progress:.37},from);
 assert.equal(actionSealState('kess',later).backwards,false);
 assert.equal(puppetPose({event,progress:.75},to),null);
 assert.equal(JSON.stringify(event),before);
 const enemy={kind:'enemy-phase',marks:[{kind:'hit',from,to},{kind:'hit',from:to,to:from}]};
 assert.equal(visibleMarks({event:enemy,progress:.1})[1].visible,false);
 const scene=fs.readFileSync('src/board/scene.js','utf8');
 assert.ok(scene.indexOf('paintActionSeal(ctx,rect,id,pose')<scene.indexOf('drawHero(ctx,rect,id'));
 assert.ok(scene.indexOf('paintActionSeal(ctx,rect,foe.id,pose')<scene.indexOf('drawFoe(ctx,rect,foe'));
});
test('drawing contains no DOM, network, unseeded random or new independent animation loop',()=>{
 const s=fs.readFileSync('src/board/action-seals.js','utf8');
 assert.doesNotMatch(s,/fetch\(|window\.|document\.|Math\.random\(|requestAnimationFrame|setInterval|addEventListener/);
 assert.equal(paintActionSeal(null,{x:0,y:0,width:50,height:50},'captain',{kind:'attack',progress:.5}),false);
});
