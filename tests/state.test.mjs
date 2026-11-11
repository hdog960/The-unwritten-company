import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState, reduce } from '../src/engine/state.js';

test('state transitions are immutable and repeatable',()=>{
  const original=createInitialState();
  const updated=reduce(original,{type:'SEED_CHANGED',seed:'Sable-777'});
  assert.equal(original.seed,'Lantern-001');
  assert.equal(updated.seed,'Sable-777');
  assert.equal(updated.preview,null);
  const next=reduce(updated,{type:'PREVIEW_REQUESTED'});
  assert.ok(next.preview.title.length>0);
  assert.equal(next.preview.seed,'Sable-777');
  assert.equal(next.isPlayable,false);
  assert.equal(original.preview,null);
  assert.equal(reduce(next,{type:'RESET'}).preview,null);
});
test('unrecognized actions preserve state and preview remains safe',()=>{
  const original=createInitialState();
  assert.strictEqual(reduce(original,{type:'NOPE'}),original);
  const preview=reduce(original,{type:'PREVIEW_REQUESTED'}).preview;
  assert.equal(Object.isFrozen(preview),true);
});
