import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {CONDITION_INKS,FIGURE_CONDITION_LEVELS,figureCondition,paintFigureCondition} from '../src/board/figure-condition.js';
import {drawHero,drawFoe} from '../src/board/miniatures.js';
import {measureBoard} from '../src/board/geometry.js';
import {renderBoard} from '../src/board/scene.js';
import {createCommandState,setMovementBoard} from '../src/commands/engine.js';
const ink=()=>{
 const calls=[],ctx={calls};
 for(const m of ['save','restore','beginPath','closePath','moveTo','lineTo','arc','rect','clip','fill','stroke','fillRect','strokeRect','translate','scale','ellipse','quadraticCurveTo','bezierCurveTo','setLineDash'])
  ctx[m]=(...args)=>calls.push([m,...args]);
 ctx.createLinearGradient=()=>({addColorStop(){}});
 ctx.createRadialGradient=()=>({addColorStop(){}});
 return ctx;
};
const balanced=c=>assert.equal(c.calls.filter(x=>x[0]==='save').length,c.calls.filter(x=>x[0]==='restore').length);
test('six separately designed cracked armor, robe, bark and spectral paper patterns',()=>{
 const ids=['captain','brunna','kess','mirelle','briar','shade'];
 assert.deepEqual(Object.keys(CONDITION_INKS),ids);
 assert.deepEqual(FIGURE_CONDITION_LEVELS,['intact','scuffed','torn']);
 for(const n of ['cut','tear','seam'])assert.equal(new Set(ids.map(id=>JSON.stringify(CONDITION_INKS[id][n]))).size,6);
 for(const id of ids){
  const a=ink(),b=ink(),w={hp:7,maxHp:20,pose:{kind:'recoil',progress:.55}};
  assert.equal(paintFigureCondition(a,id,w),true);
  assert.equal(paintFigureCondition(b,id,w),true);
  assert.deepEqual(a.calls,b.calls);
  assert.ok(a.calls.some(x=>x[0]==='clip')&&a.calls.some(x=>x[0]==='fill'));
  balanced(a);
  for(const p of a.calls.filter(c=>['moveTo','lineTo','arc'].includes(c[0])))
   assert.ok(p[1]>=2&&p[1]<=98&&p[2]>=2&&p[2]<=98,id+' overflow');
 }
});
test('real HP is the only source of wounds; no wounds from a miss or fake recoil',()=>{
 for(const id of Object.keys(CONDITION_INKS)){
  assert.equal(figureCondition(id,{hp:20,maxHp:20}).level,'intact');
  assert.equal(figureCondition(id,{hp:16,maxHp:20}).level,'scuffed');
  assert.equal(figureCondition(id,{hp:7,maxHp:20}).level,'torn');
  assert.equal(paintFigureCondition(ink(),id,{hp:20,maxHp:20}),false);
  assert.equal(paintFigureCondition(ink(),id,{hp:0,maxHp:20}),false);
  assert.equal(paintFigureCondition(ink(),id,{hp:null,maxHp:20}),false);
  assert.equal(paintFigureCondition(ink(),id,{hp:20,maxHp:20,pose:{kind:'recoil',progress:.5}}),false);
  assert.equal(figureCondition(id,{hp:16,maxHp:20,pose:{kind:'miss',progress:.5}}).pulse,0);
  assert.equal(figureCondition(id,{hp:16,maxHp:20,pose:{kind:'recoil',progress:.5}}).pulse,.65);
  assert.equal(figureCondition(id,{hp:16,maxHp:20,pose:{kind:'stagger',progress:.5}}).pulse,1);
  assert.equal(figureCondition(id,{hp:20,maxHp:20,fallen:true}).fallen,true);
 }
 assert.equal(figureCondition('unknown',{hp:2,maxHp:20}),null);
});
test('Ward stitching belongs only to real guarded, living party heroes',()=>{
 for(const id of ['captain','brunna','kess','mirelle']){
  const c=ink();
  assert.equal(figureCondition(id,{hp:20,maxHp:20,guard:2}).ward,true);
  assert.equal(paintFigureCondition(c,id,{hp:20,maxHp:20,guard:2}),true);
  balanced(c);
  assert.equal(paintFigureCondition(ink(),id,{hp:20,maxHp:20,guard:0}),false);
  assert.equal(paintFigureCondition(ink(),id,{hp:0,maxHp:20,guard:2}),false);
 }
 for(const id of ['briar','shade'])assert.equal(figureCondition(id,{hp:7,maxHp:10,guard:3}).ward,false);
});
test('all six real miniatures draw on 38-70px tiles with complete save/restore',()=>{
 for(const size of [38,44,51,70])for(const id of Object.keys(CONDITION_INKS)){
  const ctx=ink(),rect={x:6,y:7,width:size,height:size},pose={kind:'stagger',progress:.5};
  if(id==='briar'||id==='shade')drawFoe(ctx,rect,{id,hp:6,maxHp:15},null,pose);
  else drawHero(ctx,rect,id,false,pose,{hp:6,maxHp:15,guard:1});
  balanced(ctx);assert.ok(ctx.calls.length>50);
 }
 const state=setMovementBoard(createCommandState(),{columns:8,rows:6});
 const before=JSON.stringify(state),ctx=ink();
 renderBoard(ctx,measureBoard(435,286),null,{
   actorId:state.actorId,positions:state.positions,targets:state.targets,
   partyHp:state.partyHp,guards:state.guards,ended:state.ended,intents:[]});
 balanced(ctx);assert.equal(JSON.stringify(state),before);
});
test('the scene uses genuine party HP/guard and foe HP, never visual guesswork',()=>{
 const mini=fs.readFileSync('src/board/miniatures.js','utf8'),scene=fs.readFileSync('src/board/scene.js','utf8');
 assert.match(mini,/paintFigureCondition\(ctx,id,/);
 assert.match(mini,/paintFigureCondition\(ctx,foe.id,\{hp:foe.hp,maxHp:foe.maxHp,pose\}\)/);
 assert.match(scene,/hp:overlay\?\.partyHp\?\.\[id\]/);
 assert.match(scene,/guard:overlay\?\.guards\?\.\[id\]/);
 const art=fs.readFileSync('src/board/figure-condition.js','utf8');
 assert.doesNotMatch(art,/fetch\(|requestAnimationFrame|setInterval|Math\.random|document\.|addEventListener/);
});
