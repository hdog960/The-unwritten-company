import test from 'node:test';
import assert from 'node:assert/strict';
import {TRAINING_TARGETS,positionTargets,livingOccupants,livingTargetAt,defeatedTargetAt,hitOnRoll,chanceToHit,previewStrike,rollAttack,applyAttack,combatFeedback} from '../src/combat/engine.js';
import {placeParty,previewMovement,isWalkable} from '../src/movement/pathfinding.js';
import {createCommandState,setCombatSeed,setMovementBoard,changeActor,chooseAbility,chooseTarget,canConfirm,cancelPreview,confirmPreview,endStudyTurn,remainingAp,remainingMove} from '../src/commands/engine.js';
const wide={columns:8,rows:6};
const p=(column,row)=>({column,row});
const initialized=(seed='Sable-777')=>setCombatSeed(setMovementBoard(createCommandState(),wide),seed);
const attack=(state,actor,skill,target)=>chooseTarget(chooseAbility(changeActor(state,actor),skill),target,wide);

test('two original static enemies spawn on legal non-party tiles even on compact boards',()=>{
  assert.equal(TRAINING_TARGETS.length,2);
  for(const board of [{columns:4,rows:3},{columns:7,rows:6},wide]){
    const party=placeParty(board),foes=positionTargets(board,party);
    assert.equal(Object.keys(foes).length,2);
    const used=new Set(Object.values(party).map(x=>x.row+':'+x.column));
    for(const foe of Object.values(foes)){
      assert.ok(isWalkable(board,foe.position));
      assert.ok(!used.has(foe.position.row+':'+foe.position.column));
      used.add(foe.position.row+':'+foe.position.column);
      assert.ok(foe.hp>0&&foe.guard>0);
    }
    assert.deepEqual(foes,positionTargets(board,party));
  }
});
test('d20 edge faces override defense and the printed chance matches enumeration',()=>{
  assert.equal(hitOnRoll(1,30,2),false);
  assert.equal(hitOnRoll(20,-30,99),true);
  assert.equal(hitOnRoll(8,3,12),false);
  assert.equal(hitOnRoll(9,3,12),true);
  assert.equal(chanceToHit('kess','spark',12),60);
  assert.equal(chanceToHit('captain','not-a-power',12),null);
  assert.equal(previewStrike('kess','spark',{...TRAINING_TARGETS[0],hp:13}).chance,60);
  assert.throws(()=>hitOnRoll(0,1,12),RangeError);
});
test('seed, action counter and exact actor target produce reproducible rolls',()=>{
  const briar={...TRAINING_TARGETS[0],hp:13};
  const r0=rollAttack('Sable-777',0,'kess','spark',briar);
  assert.deepEqual(rollAttack('Sable-777',0,'kess','spark',briar),r0);
  assert.equal(r0.face,7);
  assert.equal(r0.hit,false);
  assert.equal(r0.damage,0);
  assert.equal(r0.healthAfter,13);
  const r1=rollAttack('Sable-777',1,'kess','spark',briar);
  assert.equal(r1.face,4);
  assert.equal(r1.hit,false);
  const r2=rollAttack('Sable-777',2,'kess','spark',briar);
  assert.equal(r2.face,15);
  assert.equal(r2.damage,3);
  assert.equal(r2.healthAfter,10);
  assert.match(combatFeedback(r2,'Briar'),/10\/13/);
});
test('critical hits double base-plus-die before clamping to remaining HP',()=>{
  const foe={...TRAINING_TARGETS[0],hp:13};
  let crit;
  for(let index=0;index<500;index++){
    const outcome=rollAttack('Crimson-Anchor',index,'brunna','strike',foe);
    if(outcome.critical){crit=outcome;break;}
  }
  assert.ok(crit,'at least one seeded natural 20 in 500 deterministic attempts');
  assert.equal(crit.face,20);
  assert.equal(crit.damage,Math.min(13,crit.rolledDamage*2));
  const wounded={...foe,hp:2};
  const capped=rollAttack('Crimson-Anchor',crit.index,'brunna','strike',wounded);
  assert.equal(capped.damage,2);
  assert.equal(capped.healthAfter,0);
});
test('attack applies immutable HP changes, rejects stale/double applications',()=>{
  const party=placeParty(wide),targets=positionTargets(wide,party),original=targets.briar.hp;
  const outcome=rollAttack('Sable-777',2,'kess','spark',targets.briar);
  const after=applyAttack(targets,outcome);
  assert.equal(targets.briar.hp,original);
  assert.equal(after.briar.hp,original-3);
  assert.ok(Object.isFrozen(after)&&Object.isFrozen(after.briar));
  assert.throws(()=>applyAttack(after,outcome),/Stale/);
});
test('selected enemy previews defense before confirmation; canceled shots spend no AP or RNG',()=>{
  let s=initialized();
  s=attack(s,'kess','spark',s.targets.briar.position);
  assert.equal(s.preview.valid,true);
  assert.equal(s.preview.chance,60);
  assert.match(s.preview.reason,/60% hit · Guard 12/);
  assert.equal(remainingAp(s),2);
  assert.equal(s.rollIndex,0);
  const canceled=cancelPreview(s);
  assert.equal(remainingAp(canceled),2);
  assert.equal(canceled.rollIndex,0);
  assert.equal(canceled.targets.briar.hp,13);
});
test('misses consume AP and a seeded third hit reduces HP without creating enemy turns',()=>{
  let s=initialized();
  s=attack(s,'kess','spark',s.targets.briar.position);
  s=confirmPreview(s,wide);
  assert.equal(s.lastCombat.face,7);
  assert.equal(s.lastCombat.hit,false);
  assert.equal(s.targets.briar.hp,13);
  assert.equal(s.rollIndex,1);
  assert.equal(remainingAp(s),1);
  assert.strictEqual(confirmPreview(s,wide),s);
  s=confirmPreview(attack(s,'kess','spark',s.targets.briar.position),wide);
  assert.equal(s.lastCombat.face,4);
  assert.equal(remainingAp(s),0);
  s=endStudyTurn(s);
  assert.equal(remainingAp(s),2);
  s=confirmPreview(attack(s,'kess','spark',s.targets.briar.position),wide);
  assert.equal(s.lastCombat.face,15);
  assert.equal(s.lastCombat.hit,true);
  assert.equal(s.targets.briar.hp,10);
  assert.equal(s.lastCombat.healthAfter,10);
  assert.equal(s.rollIndex,3);
  assert.equal(s.ap.kess,1);
  assert.equal(s.ap.brunna,2);
});
test('combat seed reset is deliberate and reproducible without touching saved runs',()=>{
  let first=initialized();
  first=confirmPreview(attack(first,'kess','spark',first.targets.briar.position),wide);
  assert.equal(first.rollIndex,1);
  assert.strictEqual(setCombatSeed(first,'Sable-777'),first);
  const reset=setMovementBoard(setCombatSeed(first,'Lantern-002'),wide);
  assert.equal(reset.seed,'Lantern-002');
  assert.equal(reset.rollIndex,0);
  assert.equal(reset.targets.briar.hp,13);
  assert.equal(reset.ap.kess,2);
});
test('Ward grants a +2 self Guard modifier and resets at personal end turn',()=>{
  let s=initialized(),origin=s.positions.brunna;
  s=chooseTarget(chooseAbility(changeActor(s,'brunna'),'ward'),origin,wide);
  assert.equal(s.preview.valid,true);
  s=confirmPreview(s,wide);
  assert.equal(s.guards.brunna,2);
  assert.equal(s.guards.kess,0);
  assert.equal(remainingAp(s),1);
  s=endStudyTurn(s);
  assert.equal(s.guards.brunna,0);
  assert.equal(remainingAp(s),2);
  assert.equal(s.targets.briar.hp,13);
});
test('living foes block movement; knocked-out targets stop blocking and cannot be attacked',()=>{
  let s=initialized();
  const pos=s.targets.briar.position;
  assert.equal(previewMovement(wide,livingOccupants(s.positions,s.targets),'kess',pos,5).valid,false);
  assert.equal(livingTargetAt(s.targets,pos).id,'briar');
  for(let i=0;i<100&&s.targets.briar.hp>0;i++){
    if(s.ap.kess<1)s=endStudyTurn(changeActor(s,'kess'));
    s=confirmPreview(attack(s,'kess','spark',pos),wide);
  }
  assert.equal(s.targets.briar.hp,0);
  assert.equal(livingTargetAt(s.targets,pos),null);
  assert.equal(defeatedTargetAt(s.targets,pos)?.id,'briar');
  assert.equal(previewMovement(wide,livingOccupants(s.positions,s.targets),'kess',pos,5).valid,true);
  if(s.ap.kess===0)s=endStudyTurn(changeActor(s,'kess'));
  s=attack(s,'kess','spark',pos);
  assert.equal(s.preview.valid,false);
  assert.match(s.preview.reason,/defeated/i);
  assert.strictEqual(confirmPreview(s,wide),s);
});
test('combat damage, target positions and HP survive board reflow',()=>{
  let s=initialized();
  s=confirmPreview(attack(s,'kess','spark',s.targets.briar.position),wide);
  s=confirmPreview(attack(s,'kess','spark',s.targets.briar.position),wide);
  s=endStudyTurn(s);
  s=confirmPreview(attack(s,'kess','spark',s.targets.briar.position),wide);
  assert.equal(s.targets.briar.hp,10);
  const compact={columns:6,rows:5};
  const adjusted=setMovementBoard(s,compact);
  assert.equal(adjusted.targets.briar.hp,10);
  const seen=new Set(Object.values(adjusted.positions).map(x=>x.row+':'+x.column));
  for(const x of Object.values(adjusted.targets))if(x.hp>0){
    assert.ok(!seen.has(x.position.row+':'+x.position.column));
    seen.add(x.position.row+':'+x.position.column);
  }
});
test('unselected/empty offensive practice stays distinct from genuine foe HP damage',()=>{
  let s=initialized();
  const before=s.targets.briar.hp;
  s=chooseTarget(chooseAbility(s,'spark'),p(3,3),wide);
  assert.equal(s.preview.valid,true);
  assert.match(s.preview.reason,/practice only/);
  s=confirmPreview(s,wide);
  assert.equal(s.targets.briar.hp,before);
  assert.equal(s.rollIndex,0);
  assert.match(s.feedback,/no damage or effects applied/);
});
