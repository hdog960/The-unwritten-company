import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {PARTY_SLOTS,createPartyPreviewState,selectPartyMember,activePartyMember,partyStatusLabel} from '../src/party/model.js';

test('party contains one custom hero placeholder and three authored companion studies',()=>{
  assert.equal(PARTY_SLOTS.length,4);
  assert.equal(PARTY_SLOTS.filter(slot=>slot.kind==='hero').length,1);
  assert.equal(PARTY_SLOTS.filter(slot=>slot.kind==='companion').length,3);
  assert.deepEqual(PARTY_SLOTS.map(x=>x.id),['captain','brunna','kess','mirelle']);
  assert.equal(new Set(PARTY_SLOTS.map(x=>x.id)).size,4);
  assert.ok(PARTY_SLOTS.every(x=>x.portrait.startsWith('./art/portraits/')));
});
test('party selection is immutable and rejects invalid members',()=>{
  const initial=createPartyPreviewState();
  assert.equal(initial.selectedId,'captain');
  assert.equal(initial.previewOnly,true);
  assert.equal(Object.isFrozen(initial),true);
  assert.strictEqual(selectPartyMember(initial,'bad-id'),initial);
  assert.strictEqual(selectPartyMember(initial,'captain'),initial);
  const result=selectPartyMember(initial,'kess');
  assert.equal(result.selectedId,'kess');
  assert.equal(initial.selectedId,'captain');
  assert.equal(activePartyMember(result).name,'Kess');
  assert.equal(Object.isFrozen(result),true);
});
test('every illustrative status is bounded and explicitly marked as preview art',()=>{
  for(const member of PARTY_SLOTS){
    assert.ok(member.hp>0 && member.hp<=member.maxHp);
    assert.match(partyStatusLabel(member),/health/);
  }
  assert.throws(()=>partyStatusLabel({hp:20,maxHp:10,status:'Broken'}),/Invalid/);
});
test('all four original portraits exist and include semantic artwork rather than emoji placeholders',()=>{
  for(const member of PARTY_SLOTS){
    const svg=fs.readFileSync(member.portrait.slice(2),'utf8');
    assert.match(svg,/<svg xmlns="http:\/\/www.w3.org\/2000\/svg"/);
    assert.match(svg,/<title id="title">/);
    assert.ok(svg.length>1800);
    assert.ok((svg.match(/<path /g)||[]).length>=10);
    assert.doesNotMatch(svg,/data:image\/|http:\/\/(?!www.w3.org)/);
  }
});
