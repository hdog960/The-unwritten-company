import test from 'node:test';
import assert from 'node:assert/strict';
import {PARTY_SLOTS} from '../src/party/model.js';
import {createCommandState,setMovementBoard,setCombatSeed,changeActor,chooseAbility,chooseTarget,chooseMove,confirmPreview,endStudyTurn,remainingAp,remainingMove,canConfirm} from '../src/commands/engine.js';
import {startBattle,endBattleTurn,enemyIntents,resolveEnemyPhase,aliveParty,aliveFoes,outcomeFor,rollEnemyAttack,BASE_GUARD} from '../src/battle/engine.js';
import {previewMovement,isWalkable} from '../src/movement/pathfinding.js';
import {livingOccupants} from '../src/combat/engine.js';
const board={columns:8,rows:6},p=(column,row)=>({column,row});
const fresh=(seed='Sable-777')=>{
  const ready=setMovementBoard(setCombatSeed(createCommandState(),seed),board);
  return startBattle(ready,board);
};
const distance=(a,b)=>Math.abs(a.column-b.column)+Math.abs(a.row-b.row);
function playRound(state){
  let s=state;
  let guard=0;
  while(s.battleMode==='active'&&s.ended.length<aliveParty(s).length && guard++<16)s=endBattleTurn(s,board);
  return s;
}
function autoPlay(seed){
  let s=fresh(seed),attackCount=0,moveCount=0,phaseCount=0,frames=0;
  while(s.battleMode==='active'&&frames++<600){
    const foes=aliveFoes(s);
    const actor=s.actorId,from=s.positions[actor];
    const attackable=foes.filter(foe=>distance(from,foe.position)<=3).sort((a,b)=>
      a.hp-b.hp||distance(from,a.position)-distance(from,b.position));
    if(remainingAp(s)>0&&attackable.length){
      const target=attackable[0].position;
      let proposed=chooseTarget(chooseAbility(s,'spark'),target,board);
      if(canConfirm(proposed,board)){
        s=confirmPreview(proposed,board);
        attackCount++;
        continue;
      }
    }
    if(remainingMove(s)>0){
      const occupied=livingOccupants(s.positions,s.targets);
      const candidates=[];
      const bestBefore=Math.min(...foes.map(foe=>distance(from,foe.position)));
      for(let row=0;row<board.rows;row++)for(let column=0;column<board.columns;column++){
        const goal=p(column,row),move=previewMovement(board,occupied,actor,goal,remainingMove(s));
        if(!move.valid)continue;
        const closest=Math.min(...foes.map(foe=>distance(goal,foe.position)));
        if(closest<bestBefore)candidates.push({goal,cost:move.cost,closest});
      }
      candidates.sort((a,b)=>a.closest-b.closest||a.cost-b.cost||a.goal.row-b.goal.row||a.goal.column-b.goal.column);
      if(candidates.length){
        const proposed=chooseTarget(chooseMove(s),candidates[0].goal,board);
        assert.equal(proposed.preview.valid,true);
        s=confirmPreview(proposed,board);
        moveCount++;
        continue;
      }
    }
    const previous=s.phaseCount;
    s=endBattleTurn(s,board);
    if(s.phaseCount>previous)phaseCount++;
  }
  return {state:s,attackCount,moveCount,phaseCount,frames};
}
test('beginning a skirmish creates full HP, two enemies and deterministic initial intent',()=>{
  const a=fresh(),b=fresh();
  assert.equal(a.battleMode,'active');
  assert.equal(a.partyHp.captain,20);
  assert.equal(a.partyHp.brunna,24);
  assert.equal(a.partyHp.kess,16);
  assert.equal(a.partyHp.mirelle,14);
  assert.equal(aliveFoes(a).length,2);
  assert.equal(outcomeFor(a),'active');
  assert.deepEqual(enemyIntents(a,board),enemyIntents(b,board));
  assert.ok(enemyIntents(a,board).every(i=>i.victimId&&i.detail&&i.position));
  assert.equal(a.turn,1);
});
test('each hero ends once per round; an exhausted hero cannot act again',()=>{
  let s=fresh();
  assert.equal(s.actorId,'captain');
  s=endBattleTurn(s,board);
  assert.deepEqual(s.ended,['captain']);
  assert.equal(s.actorId,'brunna');
  assert.strictEqual(changeActor(s,'captain'),s);
  const refused=chooseAbility(changeActor(s,'kess'),'spark');
  assert.equal(refused.actorId,'kess');
  s=endBattleTurn(s,board); // Kess finishes, Brunna & Mirelle still pending
  assert.equal(s.actorId,'brunna');
  s=endBattleTurn(s,board);
  assert.equal(s.actorId,'mirelle');
  const before=s.phaseCount;
  s=endBattleTurn(s,board);
  assert.equal(s.phaseCount,before+1);
  assert.equal(s.turn,2);
  assert.equal(s.ended.length,0);
  for(const hero of PARTY_SLOTS)assert.equal(s.ap[hero.id],2);
});
test('enemy phase is repeatable, changes HP and keeps enemies on walkable unoccupied tiles',()=>{
  const start=fresh('Lantern-073');
  const a=playRound(start),b=playRound(start);
  assert.deepEqual(a,b);
  assert.equal(a.phaseCount,1);
  assert.equal(a.battleMode,'active');
  assert.ok(a.lastEnemyPhase.length>=1);
  assert.ok(Object.values(a.partyHp).some((hp,i)=>hp<PARTY_SLOTS[i].maxHp)||
    a.lastEnemyPhase.every(s=>s.includes('advances')||s.includes('misses')));
  const used=new Set(Object.values(a.positions).map(t=>t.row+':'+t.column));
  for(const foe of aliveFoes(a)){
    assert.ok(isWalkable(board,foe.position));
    const key=foe.position.row+':'+foe.position.column;
    assert.ok(!used.has(key),'enemy cannot move into an occupied hero or foe tile');
    used.add(key);
  }
});
test('enemy rolls are seeded and receive existing +2 Ward Guard during the enemy phase',()=>{
  const start=fresh('Guard-Witness');
  const foe=start.targets.shade;
  const base=rollEnemyAttack('Guard-Witness',1,foe,'captain',BASE_GUARD.captain);
  const ward=rollEnemyAttack('Guard-Witness',1,foe,'captain',BASE_GUARD.captain+2);
  assert.equal(base.face,ward.face);
  assert.equal(base.guard+2,ward.guard);
  assert.ok(ward.damage<=base.damage);
  assert.deepEqual(rollEnemyAttack('Guard-Witness',1,foe,'captain',BASE_GUARD.captain),base);
  assert.equal(start.guards.captain,0);
});
test('damaged party HP persists between rounds; End Turn never heals an injured hero',()=>{
  let s=fresh('Lantern-073'),maxById=Object.fromEntries(PARTY_SLOTS.map(x=>[x.id,x.maxHp]));
  for(let i=0;i<12&&s.battleMode==='active';i++)s=playRound(s);
  assert.ok(PARTY_SLOTS.some(x=>s.partyHp[x.id]<maxById[x.id]),'enemies should eventually deal actual HP damage');
  const before={...s.partyHp};
  if(s.battleMode==='active')s=playRound(s);
  for(const id of Object.keys(before))assert.ok(s.partyHp[id]<=before[id],'ending turn cannot heal party HP');
});
test('skirmish starter resets rolls and HP for same seed with no persistence claim',()=>{
  let s=fresh();
  const target=s.targets.briar.position;
  s=confirmPreview(chooseTarget(chooseAbility(changeActor(s,'kess'),'spark'),target,board),board);
  const reset=startBattle(s,board);
  assert.equal(reset.rollIndex,0);
  assert.equal(reset.partyHp.kess,16);
  assert.equal(reset.targets.briar.hp,13);
  assert.equal(reset.turn,1);
  assert.deepEqual(reset.ended,[]);
  assert.deepEqual(enemyIntents(reset,board),enemyIntents(fresh(),board));
});
test('a deterministic scripted game is winnable without fabricated enemy turns or healing',()=>{
  const {state,frames,attackCount,moveCount,phaseCount}=autoPlay('Lantern-Win-001');
  assert.equal(state.battleMode,'won','expected the Company to win using only 2AP attacks and legal moves');
  assert.equal(outcomeFor(state),'won');
  assert.ok(frames<600&&attackCount>=5&&moveCount>=1&&phaseCount>=1);
  assert.ok(aliveParty(state).length>=1,'at least one hero should survive the intended skirmish');
  assert.ok(aliveFoes(state).length===0);
  assert.equal(state.targets.briar.hp,0);
  assert.equal(state.targets.shade.hp,0);
  assert.strictEqual(endBattleTurn(state,board),state,'outcome cannot be advanced as another live turn');
});
test('same seed and sequence reproduce an identical complete victorious battle',()=>{
  const a=autoPlay('Lantern-Win-001'),b=autoPlay('Lantern-Win-001');
  assert.deepEqual(a,b);
});
test('a player who never attacks can lose; defeat has no further actions',()=>{
  let s=fresh('Yield-001'),steps=0;
  while(s.battleMode==='active'&&steps++<360)s=endBattleTurn(s,board);
  assert.equal(s.battleMode,'lost');
  assert.equal(outcomeFor(s),'lost');
  assert.deepEqual(aliveParty(s),[]);
  assert.strictEqual(endBattleTurn(s,board),s);
  assert.strictEqual(chooseAbility(s,'spark'),s);
  assert.ok(steps<360);
});
test('winning strike stops immediately and prevents double-damage or a phantom enemy phase',()=>{
  const auto=autoPlay('Lantern-Win-001');
  assert.equal(auto.state.battleMode,'won');
  assert.equal(auto.state.lastCombat?.healthAfter,0);
  const before=auto.state.phaseCount;
  assert.strictEqual(confirmPreview(auto.state,board),auto.state);
  assert.equal(auto.state.phaseCount,before);
});
test('practice mode still preserves the earlier End Study Turn behavior',()=>{
  let s=setMovementBoard(createCommandState(),board);
  s=endStudyTurn(s);
  assert.equal(s.turn,2);
  assert.equal(s.battleMode,'practice');
  assert.equal(s.ap.captain,2);
  assert.equal(s.phaseCount,0);
});
