import test from 'node:test';
import assert from 'node:assert/strict';
import {RELIEF_MATERIALS,paintReliefTile,paintWorldRelief,paintHeroEnamelStatus} from '../src/board/relief.js';
import {paintQuillPreview,QUILL_PALETTE} from '../src/board/quill.js';
import {drawFoe} from '../src/board/miniatures.js';
import {getTile,measureBoard,cellRect} from '../src/board/geometry.js';
import {renderBoard} from '../src/board/scene.js';
import {createCommandState,setMovementBoard} from '../src/commands/engine.js';
const board=measureBoard(435,286);
function paint(){
 const calls=[],ctx={calls,globalAlpha:1};
 for(const k of ['save','restore','beginPath','closePath','moveTo','lineTo','arc','ellipse','rect','clip','fill','stroke','fillRect','strokeRect','translate','scale','setLineDash','bezierCurveTo','quadraticCurveTo'])ctx[k]=(...values)=>calls.push([k,...values]);
 ctx.createLinearGradient=()=>({addColorStop(){}});
 ctx.createRadialGradient=()=>({addColorStop(){}});
 return ctx;
}
const balanced=c=>assert.equal(c.calls.filter(x=>x[0]==='save').length,c.calls.filter(x=>x[0]==='restore').length);
test('all five materials retain source-drawn paper relief at 31–69 pixel tiles',()=>{
 assert.deepEqual(RELIEF_MATERIALS,['stone','moss','water','rubble','glyph']);
 for(const kind of RELIEF_MATERIALS)for(const width of [31,38,54,69]){
  const rect={x:4,y:6,width,height:width},ctx=paint(),before=JSON.stringify(rect);
  assert.equal(paintReliefTile(ctx,rect,kind),true);
  assert.equal(JSON.stringify(rect),before);
  assert.ok(ctx.calls.some(x=>x[0]==='clip'));
  assert.ok(ctx.calls.some(x=>x[0]==='stroke'));
  balanced(ctx);
 }
 assert.equal(paintReliefTile(paint(),{x:0,y:0,width:40,height:40},'imaginary'),false);
});
test('full relief respects authored grid without changing terrain or bounds',()=>{
 const before=Array.from({length:board.rows},(_,r)=>Array.from({length:board.columns},(_,c)=>getTile(r,c)));
 const data=JSON.stringify(board),ctx=paint();
 assert.equal(paintWorldRelief(ctx,board,getTile),board.rows*board.columns);
 assert.equal(JSON.stringify(board),data);
 assert.deepEqual(before,Array.from({length:board.rows},(_,r)=>Array.from({length:board.columns},(_,c)=>getTile(r,c))));
 balanced(ctx);
});
test('wounded foe health enamel adds shape-based hatches, not only changed color',()=>{
 const low={id:'briar',hp:3,maxHp:13},healthy={id:'briar',hp:12,maxHp:13};
 const rect=cellRect(board,3,3),before=JSON.stringify(low),a=paint(),b=paint();
 drawFoe(a,rect,low,null);drawFoe(b,rect,healthy,null);
 assert.ok(a.calls.filter(x=>x[0]==='lineTo').length>b.calls.filter(x=>x[0]==='lineTo').length);
 assert.equal(JSON.stringify(low),before);
 balanced(a);balanced(b);
});
test('world-native hero status enamel distinguishes wounded, guarded, ended, fallen',()=>{
 const rect=cellRect(board,1,1),variants=[
  {hp:2,maxHp:20,ward:true,ended:false,fallen:false},
  {hp:17,maxHp:20,ward:false,ended:true,fallen:false},
  {hp:0,maxHp:20,ward:false,ended:true,fallen:true}
 ];
 const snapshots=[];
 for(const options of variants){
  const before=JSON.stringify(options),ctx=paint();
  assert.equal(paintHeroEnamelStatus(ctx,rect,options),true);
  assert.equal(JSON.stringify(options),before);
  snapshots.push(ctx.calls);
  balanced(ctx);
 }
 assert.notDeepEqual(snapshots[0],snapshots[1]);
 assert.notDeepEqual(snapshots[1],snapshots[2]);
});
test('quill preview draws distinct legal, illegal and self-Ward ink under pieces',()=>{
 assert.deepEqual(Object.keys(QUILL_PALETTE),['ready','invalid','ward']);
 const origin={column:1,row:1},target={column:3,row:2};
 const base={mode:'ability',origin,target,evaluation:{valid:true},command:{id:'spark'}};
 const old=JSON.stringify(base),legal=paint(),illegal=paint(),ward=paint();
 assert.equal(paintQuillPreview(legal,board,base),true);
 assert.equal(paintQuillPreview(illegal,board,{...base,evaluation:{valid:false}}),true);
 assert.equal(paintQuillPreview(ward,board,{...base,target:origin,command:{id:'ward'}}),true);
 assert.ok(legal.calls.some(x=>x[0]==='bezierCurveTo'));
 assert.ok(!ward.calls.some(x=>x[0]==='bezierCurveTo'));
 assert.ok(illegal.calls.some(x=>x[0]==='setLineDash'));
 assert.equal(JSON.stringify(base),old);
 [legal,illegal,ward].forEach(balanced);
 assert.equal(paintQuillPreview(paint(),board,{mode:'idle',origin,target}),false);
});
test('composed battlefield paints details, threats and figures without state changes',()=>{
 const ctx=paint(),s=setMovementBoard(createCommandState(),{columns:8,rows:6}),old=JSON.stringify(s);
 renderBoard(ctx,board,null,{actorId:s.actorId,positions:s.positions,targets:s.targets,
  partyHp:s.partyHp,guards:s.guards,ended:s.ended,intents:[]});
 assert.ok(ctx.calls.length>1800);
 assert.equal(JSON.stringify(s),old);
 balanced(ctx);
});
