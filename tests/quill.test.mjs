import test from 'node:test';
import assert from 'node:assert/strict';
import {measureBoard,cellRect} from '../src/board/geometry.js';
import {paintQuillPreview,QUILL_PALETTE} from '../src/board/quill.js';
import {paintHeroEnamelStatus} from '../src/board/relief.js';
import {renderBoard} from '../src/board/scene.js';
import {createCommandState,setMovementBoard,changeActor,chooseAbility,chooseTarget} from '../src/commands/engine.js';
const board=measureBoard(435,286);
const logical={columns:8,rows:6},p=(column,row)=>({column,row});
function ink(){
 const calls=[],ctx={calls,globalAlpha:1};
 const apply=name=>(...args)=>{calls.push([name,...args]);};
 for(const name of ['save','restore','beginPath','closePath','moveTo','lineTo','quadraticCurveTo','bezierCurveTo','arc','ellipse','rect','clip','fill','stroke','fillRect','strokeRect','translate','scale','setLineDash'])ctx[name]=apply(name);
 ctx.createLinearGradient=()=>({addColorStop(){}});
 ctx.createRadialGradient=()=>({addColorStop(){}});
 return ctx;
}
const balanced=ctx=>assert.equal(ctx.calls.filter(x=>x[0]==='save').length,ctx.calls.filter(x=>x[0]==='restore').length);
test('quill preview is absent without a specifically selected command and target',()=>{
 const ctx=ink();
 assert.equal(paintQuillPreview(ctx,board,null),false);
 assert.equal(paintQuillPreview(ctx,board,{mode:'idle',target:p(5,4)}),false);
 assert.equal(paintQuillPreview(ctx,board,{mode:'ability',origin:p(1,1)}),false);
 assert.equal(ctx.calls.length,0);
});
test('authoritative legal attack preview creates a thin manuscript arc under figures',()=>{
 const state=chooseTarget(chooseAbility(changeActor(setMovementBoard(createCommandState(),logical),'kess'),'spark'),p(6,1),logical);
 const ctx=ink();
 const preview={mode:'ability',origin:state.positions.kess,target:state.target,
   evaluation:state.preview,command:{id:'spark'}};
 const old=JSON.stringify(preview);
 assert.equal(paintQuillPreview(ctx,board,preview),true);
 assert.ok(ctx.calls.some(x=>x[0]==='bezierCurveTo'),'a real arc is inked between figures');
 assert.ok(ctx.calls.some(x=>x[0]==='strokeRect'),'only an underlay bookplate frames the target');
 assert.ok(!ctx.calls.some(x=>x[0]==='fillRect'),'no opaque rectangles over enemy miniatures');
 assert.ok(ctx.calls.some(x=>x[0]==='clip'),'the effect must stay within the central board');
 assert.equal(JSON.stringify(preview),old);
 assert.deepEqual(Object.keys(QUILL_PALETTE).sort(),['invalid','ready','ward']);
 balanced(ctx);
});
test('invalid targets use a visibly different broken quill line, not an actionable attack',()=>{
 const overlay={mode:'ability',origin:p(0,4),target:p(7,0),command:{id:'strike'},evaluation:{valid:false}};
 const ctx=ink();
 assert.equal(paintQuillPreview(ctx,board,overlay),true);
 const dashes=ctx.calls.filter(x=>x[0]==='setLineDash');
 assert.ok(dashes.some(x=>x[1].length===2));
 assert.ok(ctx.calls.some(x=>x[0]==='bezierCurveTo'));
 balanced(ctx);
});
test('self Ward uses a shield stamp rather than creating a fake projectile arrow',()=>{
 const ctx=ink();
 assert.equal(paintQuillPreview(ctx,board,{mode:'ability',origin:p(2,3),target:p(2,3),
   evaluation:{valid:true},command:{id:'ward'}}),true);
 assert.ok(!ctx.calls.some(x=>x[0]==='bezierCurveTo'));
 assert.ok(ctx.calls.some(x=>x[0]==='strokeRect'));
 balanced(ctx);
});
test('wounded, guarded, finished and fallen hero bases are distinct engraved drawings',()=>{
 const rect=cellRect(board,1,2);
 const statuses=[
  {hp:17,maxHp:20},
  {hp:3,maxHp:20,ward:true},
  {hp:17,maxHp:20,ended:true},
  {hp:0,maxHp:20,fallen:true}
 ];
 const signatures=[];
 for(const status of statuses){
  const ctx=ink(),before=JSON.stringify(status);
  assert.equal(paintHeroEnamelStatus(ctx,rect,status),true);
  signatures.push(JSON.stringify(ctx.calls));
  assert.equal(JSON.stringify(status),before);
  balanced(ctx);
 }
 assert.equal(new Set(signatures).size,4);
});
test('status engraving and quill preview preserve full tactical scene and existing state',()=>{
 const state=setMovementBoard(createCommandState(),logical),before=JSON.stringify(state),ctx=ink();
 renderBoard(ctx,board,null,{actorId:'captain',positions:state.positions,targets:state.targets,
   partyHp:state.partyHp,guards:state.guards,ended:state.ended,
   mode:'ability',command:{id:'spark'},origin:p(1,4),target:p(6,1),
   evaluation:{valid:true},intents:[]});
 assert.equal(JSON.stringify(state),before);
 assert.ok(ctx.calls.length>1400);
 balanced(ctx);
});
