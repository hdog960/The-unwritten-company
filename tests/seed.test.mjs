import test from 'node:test';
import assert from 'node:assert/strict';
import { hashSeed, makeRng, chooseDeterministic } from '../src/engine/random.js';
import { buildPreview, normalizeSeed } from '../src/engine/state.js';

test('seed hashes are stable and domain picks reproducible',()=>{
  assert.equal(hashSeed('Lantern-001'),hashSeed('Lantern-001'));
  assert.deepEqual(Array.from({length:12},makeRng(hashSeed('the-hero'))),Array.from({length:12},makeRng(hashSeed('the-hero'))));
  assert.equal(chooseDeterministic(['a','b','c'],'seed','region'),chooseDeterministic(['a','b','c'],'seed','region'));
});
test('random values are finite [0,1) and varied',()=>{
  const rng=makeRng(hashSeed('sample'));
  const values=Array.from({length:256},rng);
  assert.ok(values.every(value=>value>=0 && value<1));
  assert.ok(new Set(values).size>200);
});
test('contract preview is deterministic, sanitized, and never claims playability',()=>{
  assert.deepEqual(buildPreview('Lantern-001'),buildPreview('Lantern-001'));
  assert.equal(normalizeSeed('  !!#$  '),'Lantern-001');
  assert.equal(buildPreview('<script>alert(1)</script>').playable,false);
});
test('empty pick pool throws rather than creating corrupt content',()=>{
  assert.throws(()=>chooseDeterministic([],'seed','none'),/nonempty/);
});
