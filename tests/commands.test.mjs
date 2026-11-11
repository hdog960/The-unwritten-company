import test from 'node:test';
import assert from 'node:assert/strict';
import {COMMANDS,MAX_AP,createCommandState,remainingAp,chooseAbility,chooseTarget,cancelPreview,confirmPreview,endStudyTurn,changeActor,canConfirm,targetResult,studyOrigin} from '../src/commands/engine.js';

const board={columns:8,rows:6};
const actor=studyOrigin('captain',board);
test('four original action studies have explicit costs, ranges and identities',()=>{
  assert.equal(MAX_AP,2);
  assert.equal(COMMANDS.length,4);
  assert.deepEqual(COMMANDS.map(x=>x.ap),[1,1,1,2]);
  assert.equal(new Set(COMMANDS.map(x=>x.id)).size,4);
});
test('selecting an ability and valid target spends nothing until confirm',()=>{
  const first=createCommandState();
  const chosen=chooseAbility(first,'spark');
  const candidate=chooseTarget(chosen,{column:actor.column+2,row:actor.row},board);
  assert.equal(remainingAp(candidate),2);
  assert.equal(candidate.preview.valid,true);
  assert.equal(canConfirm(candidate,board),true);
  assert.equal(first.ap.captain,2);
  const finished=confirmPreview(candidate,board);
  assert.equal(remainingAp(finished),1);
  assert.equal(finished.confirmations,1);
  assert.equal(finished.abilityId,null);
  assert.equal(finished.target,null);
  assert.match(finished.feedback,/no damage or effects applied/);
  assert.strictEqual(confirmPreview(finished,board),finished,'double confirm must never spend twice');
});
test('cancel and invalid targets do not consume AP',()=>{
  const first=createCommandState();
  const started=chooseAbility(first,'strike');
  const far=chooseTarget(started,{column:actor.column+4,row:actor.row},board);
  assert.equal(far.preview.valid,false);
  assert.equal(canConfirm(far,board),false);
  assert.strictEqual(confirmPreview(far,board),far);
  const canceled=cancelPreview(far);
  assert.equal(remainingAp(canceled),2);
  assert.equal(canceled.abilityId,null);
  assert.equal(canceled.target,null);
});
test('ward targets only marked origin, and rubble rejects glyph tracing',()=>{
  const start=createCommandState();
  const ward=chooseAbility(start,'ward');
  assert.equal(chooseTarget(ward,{...actor},board).preview.valid,true);
  assert.equal(chooseTarget(ward,{column:actor.column+1,row:actor.row},board).preview.valid,false);
  const sigil=chooseAbility(start,'sigil');
  assert.equal(sigil.abilityId,'sigil');
  assert.equal(targetResult(COMMANDS[3],'captain',{column:1,row:2},board).valid,false,'rubble is not suitable for a sigil');
});
test('out-of-bounds and invalid target objects are ignored',()=>{
  const start=chooseAbility(createCommandState(),'spark');
  assert.strictEqual(chooseTarget(start,{column:-1,row:2},board),start);
  assert.strictEqual(chooseTarget(start,{column:1.5,row:1},board),start);
  assert.strictEqual(chooseTarget(start,{column:999,row:0},board),start);
});
test('per-party AP is isolated, switching cancels targeting',()=>{
  let state=createCommandState();
  state=confirmPreview(chooseTarget(chooseAbility(state,'spark'),{column:actor.column+1,row:actor.row},board),board);
  state=changeActor(state,'brunna');
  assert.equal(remainingAp(state),2);
  assert.equal(state.ap.captain,1);
  assert.equal(state.abilityId,null);
  state=changeActor(state,'captain');
  assert.equal(remainingAp(state),1);
  assert.strictEqual(chooseAbility(state,'sigil'),state,'cannot select an unaffordable ability');
});
test('end turn resets only current actor and removes unconfirmed target',()=>{
  let state=createCommandState();
  state=confirmPreview(chooseTarget(chooseAbility(state,'spark'),{column:actor.column+1,row:actor.row},board),board);
  state=changeActor(state,'brunna');
  state=chooseAbility(state,'ward');
  state=endStudyTurn(state);
  assert.equal(state.turn,2);
  assert.equal(state.ap.brunna,2);
  assert.equal(state.ap.captain,1);
  assert.equal(state.target,null);
  assert.equal(state.abilityId,null);
  assert.match(state.feedback,/No enemy turn/);
});
test('already-spent 2 AP ability cannot be double-confirmed',()=>{
  let state=createCommandState();
  state=confirmPreview(chooseTarget(chooseAbility(state,'sigil'),{column:actor.column+1,row:actor.row},board),board);
  assert.equal(remainingAp(state),0);
  assert.strictEqual(chooseAbility(state,'strike'),state);
  assert.equal(state.confirmations,1);
  assert.strictEqual(confirmPreview(state,board),state);
});
test('each preview origin is inside compact and full boards',()=>{
  for(const b of [{columns:4,rows:3},{columns:7,rows:6},{columns:8,rows:6}]){
    for(const id of ['captain','brunna','kess','mirelle']){
      const p=studyOrigin(id,b);
      assert.ok(p.column>=0&&p.column<b.columns);
      assert.ok(p.row>=0&&p.row<b.rows);
    }
  }
});
test('invalid actor selection is ignored and never refills AP',()=>{
  const start=createCommandState();
  assert.strictEqual(changeActor(start,'fake'),start);
  assert.strictEqual(changeActor(start,'captain'),start);
});
