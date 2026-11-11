import test from 'node:test';
import assert from 'node:assert/strict';
import {getTile} from '../src/board/geometry.js';
import {PARTY_SLOTS} from '../src/party/model.js';
import {MAX_MOVEMENT,placeParty,isWalkable,shortestPath,previewMovement,moveActor} from '../src/movement/pathfinding.js';
import {createCommandState,setMovementBoard,chooseMove,chooseTarget,canConfirm,cancelPreview,confirmPreview,changeActor,remainingAp,remainingMove,endStudyTurn,chooseAbility} from '../src/commands/engine.js';
const wide={columns:8,rows:6};
const compact={columns:4,rows:3};
const point=(column,row)=>({column,row});
test('spawns are unique, walkable and deterministic across three board sizes',()=>{
  for(const board of [compact,{columns:7,rows:6},wide]){
    const positions=placeParty(board);
    const keys=Object.values(positions).map(pos=>pos.row+':'+pos.column);
    assert.equal(keys.length,4);assert.equal(new Set(keys).size,4);
    assert.deepEqual(positions,placeParty(board));
    assert.ok(Object.isFrozen(positions));
    for(const member of PARTY_SLOTS)assert.ok(isWalkable(board,positions[member.id]));
  }
});
test('rubble is blocked, water has a 2-point entry cost, and diagonals are forbidden',()=>{
  const positions=placeParty(wide);
  assert.equal(getTile(2,1),'rubble');
  assert.equal(getTile(1,5),'water');
  assert.equal(isWalkable(wide,point(1,2)),false);
  const route=shortestPath(wide,point(4,1),point(6,1),{},'captain');
  assert.equal(route.found,true);
  assert.equal(route.cost,3);
  assert.deepEqual(route.path,[point(4,1),point(5,1),point(6,1)]);
  for(let i=1;i<route.path.length;i++){
    const p=route.path[i],prior=route.path[i-1];
    assert.equal(Math.abs(p.column-prior.column)+Math.abs(p.row-prior.row),1);
  }
  assert.equal(previewMovement(wide,positions,'captain',point(1,2),5).valid,false);
});
test('occupants block their own destinations and transit, and route never phases through a body',()=>{
  const positions=placeParty(wide);
  const occupied=positions.brunna;
  const origin=positions.captain;
  const result=shortestPath(wide,origin,occupied,positions,'captain');
  assert.equal(result.found,false);
  assert.match(result.reason,/occupies/);
  const other=shortestPath(wide,origin,point(0,0),positions,'captain');
  assert.equal(other.found,true);
  const occupiedSet=new Set(Object.entries(positions).filter(([id])=>id!=='captain').map(([,p])=>p.row+':'+p.column));
  for(const p of other.path)assert.equal(occupiedSet.has(p.row+':'+p.column),false);
});
test('movement state previews without spending AP or MP; confirm actually repositions selected miniature',()=>{
  let s=setMovementBoard(createCommandState(),wide);
  s=changeActor(s,'mirelle');
  const old=s.positions.mirelle;
  const destination=point(old.column,old.row-1);
  s=chooseMove(s);
  s=chooseTarget(s,destination,wide);
  assert.equal(s.moveMode,true);
  assert.equal(s.preview.valid,true);
  assert.equal(s.preview.cost,1);
  assert.equal(s.positions.mirelle.row,old.row);
  assert.equal(remainingAp(s),2);
  assert.equal(remainingMove(s),MAX_MOVEMENT);
  assert.equal(canConfirm(s,wide),true);
  const after=confirmPreview(s,wide);
  assert.deepEqual(after.positions.mirelle,destination);
  assert.equal(remainingMove(after),MAX_MOVEMENT-1);
  assert.equal(remainingAp(after),2);
  assert.equal(after.moveMode,false);
  assert.equal(after.confirmations,1);
  assert.match(after.feedback,/AP unchanged/);
  assert.strictEqual(confirmPreview(after,wide),after);
});
test('blocked, occupied and over-budget moves fail without teleport or resource loss',()=>{
  let start=setMovementBoard(createCommandState(),wide);
  start=chooseMove(start);
  for(const tile of [point(1,2),start.positions.brunna,point(7,0)]){
    const s=chooseTarget(start,tile,wide);
    assert.equal(s.preview.valid,false);
    assert.strictEqual(confirmPreview(s,wide),s);
    assert.deepEqual(s.positions,start.positions);
    assert.equal(remainingMove(s),MAX_MOVEMENT);
    assert.equal(remainingAp(s),2);
  }
});
test('cancel never charges movement and switching party member preserves individual budgets',()=>{
  let state=setMovementBoard(createCommandState(),wide);
  state=changeActor(state,'mirelle');
  const origin=state.positions.mirelle;
  state=chooseTarget(chooseMove(state),point(origin.column,origin.row-1),wide);
  state=cancelPreview(state);
  assert.equal(remainingMove(state),MAX_MOVEMENT);
  assert.equal(state.moveMode,false);
  state=confirmPreview(chooseTarget(chooseMove(state),point(origin.column,origin.row-1),wide),wide);
  assert.equal(remainingMove(state),MAX_MOVEMENT-1);
  state=changeActor(state,'brunna');
  assert.equal(remainingMove(state),MAX_MOVEMENT);
  state=changeActor(state,'mirelle');
  assert.equal(remainingMove(state),MAX_MOVEMENT-1);
  state=endStudyTurn(state);
  assert.equal(remainingMove(state),MAX_MOVEMENT);
  assert.deepEqual(state.positions.mirelle,point(origin.column,origin.row-1));
});
test('abilities continue to cost AP and target around the current moved position',()=>{
  let s=setMovementBoard(createCommandState(),wide);
  s=changeActor(s,'mirelle');
  const old=s.positions.mirelle;
  const tile=point(old.column,old.row-1);
  s=confirmPreview(chooseTarget(chooseMove(s),tile,wide),wide);
  s=chooseAbility(s,'ward');
  s=chooseTarget(s,tile,wide);
  assert.equal(s.preview.valid,true,'Ward should target new position, not original spawn');
  s=confirmPreview(s,wide);
  assert.equal(remainingAp(s),1);
  assert.equal(remainingMove(s),MAX_MOVEMENT-1);
});
test('reflow preserves legal locations, corrects duplicate positions, never destroys movement',()=>{
  const start=placeParty(wide);
  assert.deepEqual(placeParty(wide,start),start);
  const invalid={...start,mirelle:start.captain};
  const fixed=placeParty(wide,invalid);
  assert.notDeepEqual(fixed.mirelle,fixed.captain);
  assert.ok(isWalkable(wide,fixed.mirelle));
  assert.equal(Object.isFrozen(moveActor(fixed,'mirelle',point(4,3))),true);
});
test('deterministic spatial property test on 120 destination combinations',()=>{
  let checked=0;
  for(const board of [wide,{columns:7,rows:6},{columns:6,rows:5}]){
    const p=placeParty(board);
    for(let x=0;x<board.columns;x++)for(let y=0;y<board.rows;y++){
      checked++;
      const goal=point(x,y);
      const route=shortestPath(board,p.captain,goal,p,'captain');
      if(!route.found)continue;
      assert.deepEqual(route.path[0],p.captain);
      assert.deepEqual(route.path.at(-1),goal);
      let cost=0;
      for(let i=1;i<route.path.length;i++){
        const at=route.path[i],prior=route.path[i-1];
        assert.equal(Math.abs(at.column-prior.column)+Math.abs(at.row-prior.row),1);
        assert.ok(isWalkable(board,at));
        assert.ok(!Object.entries(p).some(([id,pos])=>id!=='captain'&&pos.column===at.column&&pos.row===at.row));
        cost+=getTile(at.row,at.column)==='water'?2:1;
      }
      assert.equal(cost,route.cost);
      assert.deepEqual(route,shortestPath(board,p.captain,goal,p,'captain'));
    }
  }
  assert.equal(checked,120);
});
