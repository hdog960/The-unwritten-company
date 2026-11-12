import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {CONTACT_IDENTITIES,CONTACT_TERRAINS,CONTACT_PALETTES,contactPlan,paintTerrainContact} from '../src/board/terrain-contact.js';
import {cellRect,measureBoard,getTile} from '../src/board/geometry.js';
import {animatedHeroRect} from '../src/board/motion.js';
import {renderBoard,miniaturePose} from '../src/board/scene.js';
import {createCommandState,setMovementBoard,chooseMove,chooseTarget,confirmPreview,changeActor} from '../src/commands/engine.js';

const board=measureBoard(440,290),point=(column,row)=>({column,row});
const make=()=>{const calls=[],ctx={calls,globalAlpha:1};
 for(const key of ['save','restore','beginPath','closePath','moveTo','lineTo','arc',
 'rect','clip','fill','stroke','fillRect','strokeRect','ellipse','translate','scale',
 'rotate','setLineDash','quadraticCurveTo','bezierCurveTo'])
  ctx[key]=(...args)=>calls.push([key,...args]);
 ctx.createLinearGradient=()=>({addColorStop(){}});
 ctx.createRadialGradient=()=>({addColorStop(){}});
 return ctx;
};
const balanced=ctx=>assert.equal(ctx.calls.filter(c=>c[0]==='save').length,ctx.calls.filter(c=>c[0]==='restore').length);
test('six authored contact inks, six unique cut shapes, four true walkable materials',()=>{
 assert.deepEqual(CONTACT_IDENTITIES,['captain','brunna','kess','mirelle','briar','shade']);
 assert.deepEqual(CONTACT_TERRAINS,['stone','moss','water','glyph']);
 assert.equal(new Set(CONTACT_IDENTITIES.map(id=>CONTACT_PALETTES[id].shape)).size,6);
 for(const id of CONTACT_IDENTITIES)assert.ok(Object.isFrozen(CONTACT_PALETTES[id]));
});
test('native valid terrain only; not debris, phantom figures, defeated figures or outside board',()=>{
 const rect=cellRect(board,1,1);
 for(const invalid of [null,{}, {x:-1000,y:-1000,width:44,height:44},{...rect,width:-1}])
  assert.equal(contactPlan(board,invalid,'captain'),null);
 assert.equal(contactPlan(board,rect,'unknown'),null);
 assert.equal(contactPlan(board,rect,'captain',{fallen:true}),null);
 assert.equal(contactPlan(board,rect,'captain',{terrainAt:()=> 'rubble'}),null);
 assert.equal(contactPlan(board,rect,'captain',{terrainAt:()=> 'unknown'}),null);
 for(const terrain of CONTACT_TERRAINS){
  const plan=contactPlan(board,rect,'brunna',{terrainAt:()=>terrain});
  assert.equal(plan.terrain,terrain);assert.equal(plan.id,'brunna');
  assert.ok(Object.isFrozen(plan));
 }
});
test('physical foot location during committed walk is read, NEVER already-confirmed destination',()=>{
 const route=[point(2,3),point(3,3),point(4,3),point(5,3)];
 const frame={event:{kind:'move',actorId:'kess',from:route[0],to:route.at(-1),path:route,token:'real-action'},progress:.22};
 const r=animatedHeroRect(board,route.at(-1),'kess',frame);
 const now=contactPlan(board,r,'kess');
 assert.equal(now.column,2);
 assert.notEqual(now.column,route.at(-1).column);
 assert.equal(now.row,3);
 const end=contactPlan(board,animatedHeroRect(board,route.at(-1),'kess',{...frame,progress:1}),'kess');
 assert.equal(end.column,5);
 assert.equal(now.alpha>contactPlan(board,r,'kess').alpha,false);
 assert.equal(miniaturePose(frame,route.at(-1),false,board).kind,'move');
});
test('contact inks are distinct by material and identity; no faux selectable tile corners',()=>{
 const rect=cellRect(board,1,1),signatures=[];
 for(const id of CONTACT_IDENTITIES){
  const ink=make();assert.equal(paintTerrainContact(ink,board,rect,id,{terrainAt:()=> 'stone'}),true);
  balanced(ink);
  signatures.push(JSON.stringify(ink.calls));
 }
 assert.equal(new Set(signatures).size,6);
 const terrainSignatures=[];
 for(const terrain of CONTACT_TERRAINS){
  const ink=make();
  assert.equal(paintTerrainContact(ink,board,rect,'kess',{terrainAt:()=> terrain}),true);
  terrainSignatures.push(JSON.stringify(ink.calls));
 }
 assert.equal(new Set(terrainSignatures).size,4);
});
test('phone-size contact drawings are deterministic and clipped to REAL moving figure footprint',()=>{
 for(const size of [38,44,51,70])for(const id of CONTACT_IDENTITIES){
  const b={...board,tile:size,mapWidth:8*size,mapHeight:6*size};
  const rect=cellRect(b,2,2),before=JSON.stringify(rect),a=make(),c=make();
  assert.equal(paintTerrainContact(a,b,rect,id,{terrainAt:()=> 'water'}),true);
  assert.equal(paintTerrainContact(c,b,rect,id,{terrainAt:()=> 'water'}),true);
  assert.deepEqual(a.calls,c.calls);balanced(a);
  const clip=a.calls.find(x=>x[0]==='rect');
  assert.equal(clip[1],rect.x+1);assert.equal(clip[2],rect.y+1);
  assert.ok(clip[1]+clip[3]<=rect.x+size);
  assert.ok(clip[2]+clip[4]<=rect.y+size);
  assert.equal(JSON.stringify(rect),before);
 }
});
test('actual battle movement event and untouched AP/MP show pure contact behavior',()=>{
 let s=setMovementBoard(createCommandState(),{rows:6,columns:8});
 s=changeActor(s,'mirelle');
 const from=s.positions.mirelle,to=point(from.column,from.row-1);
 const preview=chooseTarget(chooseMove(s),to,{rows:6,columns:8});
 assert.equal(preview.preview.valid,true);
 const moved=confirmPreview(preview,{rows:6,columns:8});
 assert.equal(moved.visualEvent.kind,'move');
 const before=JSON.stringify(moved),frame={event:moved.visualEvent,progress:.3};
 const physical=animatedHeroRect(board,moved.positions.mirelle,'mirelle',frame);
 const ink=make();
 assert.equal(paintTerrainContact(ink,board,physical,'mirelle',{pose:miniaturePose(frame,moved.positions.mirelle,false,board)}),true);
 assert.equal(JSON.stringify(moved),before);balanced(ink);
});
test('actual scene paints contacts between moving mattes and legal targets, never UI or input',()=>{
 const scene=fs.readFileSync('src/board/scene.js','utf8');
 assert.ok(scene.indexOf('paintMiniatureMatte(ctx,rect,foe.id') < scene.indexOf('paintTerrainContact(ctx,board,rect,id'));
 assert.ok(scene.indexOf('paintTerrainContact(ctx,board,rect,id') < scene.indexOf('paintTargetIndicators(ctx,board'));
 assert.ok(scene.indexOf('paintTerrainContact(ctx,board,rect,foe.id') < scene.indexOf('paintTargetIndicators(ctx,board'));
 assert.ok(scene.indexOf('paintTargetIndicators(ctx,board') < scene.indexOf('drawHero(ctx,rect,id,'));
 const overlay={positions:{captain:point(1,1)},partyHp:{captain:12},guards:{},actorId:'captain',targets:{}};
 const paint=make(),snapshot=JSON.stringify(overlay);
 renderBoard(paint,board,null,overlay,null);balanced(paint);
 assert.equal(JSON.stringify(overlay),snapshot);
});
test('no network, storage, timers or new controls; offline cache owns module once',()=>{
 const src=fs.readFileSync('src/board/terrain-contact.js','utf8');
 assert.ok(['fetch(', 'Math.random', 'setInterval', 'setTimeout', 'requestAnimationFrame', 'window.', 'document.', 'addEventListener', 'localStorage'].every(token=>!src.includes(token)));
 const sw=fs.readFileSync('service-worker.js','utf8');
 assert.ok(sw.includes('v0.09-gate-a31-r1'));
 assert.equal(sw.split("'./src/board/terrain-contact.js'").length-1,1);
 assert.ok(!sw.includes('skipWaiting('));
});
