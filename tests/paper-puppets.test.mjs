import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {PUPPET_FOLDS,foldedShadowProfile,paintPuppetShadow} from '../src/board/paper-puppets.js';
import {renderBoard} from '../src/board/scene.js';
import {measureBoard} from '../src/board/geometry.js';
const ink=()=>{
  const calls=[],ctx={calls};
  for(const k of ['save','restore','beginPath','closePath','moveTo','lineTo','rect','clip','fill','stroke'])ctx[k]=(...args)=>calls.push([k,...args]);
  return ctx;
};
test('six different bound paper silhouettes follow action direction without mutating source poses',()=>{
  const ids=Object.keys(PUPPET_FOLDS);
  assert.deepEqual(ids,['captain','brunna','kess','mirelle','briar','shade']);
  assert.equal(new Set(ids.map(id=>JSON.stringify(foldedShadowProfile(id)))).size,6);
  for(const id of ids){
    const pose={kind:'stagger',progress:.5},before=JSON.stringify(pose);
    const standing=foldedShadowProfile(id),hit=foldedShadowProfile(id,pose);
    assert.notDeepEqual(standing,hit);
    assert.equal(JSON.stringify(pose),before);
    assert.ok(Object.isFrozen(hit)&&hit.every(Object.isFrozen));
    for(const [x,y] of hit)assert.ok(x>=.07&&x<=.93&&y>=.38&&y<=.92);
  }
  assert.equal(foldedShadowProfile('unknown'),null);
});
test('paper puppet paint remains inside its own tile at iPhone logical tile sizes',()=>{
  for(const s of [38,44,51,70])for(const id of Object.keys(PUPPET_FOLDS)){
    const rect={x:14,y:19,width:s,height:s},before=JSON.stringify(rect);
    for(const pose of [null,{kind:'attack',progress:.5},{kind:'recoil',progress:.5},{kind:'move',progress:.5}]){
      const ctx=ink();
      assert.equal(paintPuppetShadow(ctx,rect,id,{pose}),true);
      assert.ok(ctx.calls.some(x=>x[0]==='clip'));
      assert.equal(ctx.calls.filter(x=>x[0]==='save').length,ctx.calls.filter(x=>x[0]==='restore').length);
      for(const [name,x,y] of ctx.calls.filter(c=>['moveTo','lineTo'].includes(c[0]))){
        assert.ok(x>=rect.x&&x<=rect.x+s&&y>=rect.y&&y<=rect.y+s,id+' overflow: '+name+' '+s);
      }
      assert.equal(JSON.stringify(rect),before);
    }
  }
});
test('fallen characters have no lively puppet shadow and existing figure render stays above cast ink',()=>{
  assert.equal(paintPuppetShadow(ink(),{x:0,y:0,width:44,height:44},'captain',{fallen:true}),false);
  assert.equal(paintPuppetShadow(ink(),{x:0,y:0,width:44,height:44},'unknown'),false);
  const scene=fs.readFileSync('src/board/scene.js','utf8');
  assert.ok(scene.indexOf('paintPuppetShadow(ctx,rect,id,')<scene.indexOf('drawHero(ctx,rect,id'));
  assert.ok(scene.indexOf('paintPuppetShadow(ctx,rect,foe.id,')<scene.indexOf('drawFoe(ctx,rect,foe'));
  assert.doesNotMatch(scene,/marker\.width\*\.32/,'redundant torso-halo must not return');
});