import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {VISAGE_IDENTITIES,VISAGE_STYLES,visageExpression,paintVisage} from '../src/board/visages.js';
import {drawHero,drawFoe} from '../src/board/miniatures.js';
import {puppetPose} from '../src/board/choreography.js';
import {renderBoard} from '../src/board/scene.js';
import {measureBoard} from '../src/board/geometry.js';
import {createCommandState,setMovementBoard} from '../src/commands/engine.js';
const context=()=>{
 const calls=[],ctx={calls,globalAlpha:1};
 for(const name of ['save','restore','beginPath','closePath','moveTo','lineTo','arc','ellipse','rect',
  'clip','fill','stroke','fillRect','strokeRect','translate','scale','setLineDash','quadraticCurveTo','bezierCurveTo'])
  ctx[name]=(...args)=>calls.push([name,...args]);
 ctx.createLinearGradient=()=>({addColorStop(){}});
 ctx.createRadialGradient=()=>({addColorStop(){}});
 return ctx;
};
const balanced=c=>assert.equal(c.calls.filter(x=>x[0]==='save').length,c.calls.filter(x=>x[0]==='restore').length);
test('six separately illustrated faces replace the generic dot-eye and straight-mouth head()',()=>{
 assert.deepEqual(VISAGE_IDENTITIES,['captain','brunna','kess','mirelle','briar','shade']);
 assert.deepEqual(Object.keys(VISAGE_STYLES),VISAGE_IDENTITIES);
 assert.equal(new Set(VISAGE_IDENTITIES.map(id=>VISAGE_STYLES[id].signature)).size,6);
 assert.equal(new Set(VISAGE_IDENTITIES.map(id=>JSON.stringify(VISAGE_STYLES[id]))).size,6);
 const src=fs.readFileSync('src/board/miniatures.js','utf8');
 assert.doesNotMatch(src,/bead\(ctx,x-3,y\+1,1/);
 assert.doesNotMatch(src,/mark\(ctx,\[\[x-2,y\+6\]/);
 assert.match(src,/paintVisage\(ctx,id,pose,/);
 assert.match(src,/paintVisage\(ctx,foe.id,pose,/);
});
test('Kess pale ivory hair and Mirelle long dark scholar hair match authored portrait identities',()=>{
 const src=fs.readFileSync('src/board/miniatures.js','utf8');
 const kess=src.split('function drawKess(ctx)')[1].split('function drawMirelle(ctx)')[0];
 const mirelle=src.split('function drawMirelle(ctx)')[1].split('function finishHeroInk')[0];
 const kPortrait=fs.readFileSync('art/portraits/kess.svg','utf8');
 const mPortrait=fs.readFileSync('art/portraits/mirelle.svg','utf8');
 assert.match(kPortrait,/#d6d6bd/,'Kess portrait is genuinely pale-haired');
 assert.match(kess,/#d2d8c6/,'Kess mini needs pale-hair paper colors');
 assert.match(kess,/#fff2d7/);
 assert.match(mPortrait,/#222337/,'Mirelle portrait has dark hair');
 assert.match(mirelle,/#2e334f/,'Mirelle mini has long, dark split hair');
 assert.match(mirelle,/#dcc89c/,'Mirelle also has a small Collegium circlet');
 assert.doesNotMatch(mirelle,/\[52,3\]/,'old towering cone hat must be removed');
});
test('the official real animation event changes eyebrows, pupil direction and wincing',()=>{
 const source={kind:'hit',from:{column:2,row:2},to:{column:5,row:2}};
 const initial=JSON.stringify(source);
 const early=puppetPose({event:source,progress:.08},source.from);
 const release=puppetPose({event:source,progress:.42},source.from);
 const impact=puppetPose({event:source,progress:.75},source.to);
 assert.equal(early.kind,'attack');assert.equal(release.kind,'attack');assert.equal(impact.kind,'recoil');
 for(const id of VISAGE_IDENTITIES){
  const steady=visageExpression(id),before=visageExpression(id,early),after=visageExpression(id,release);
  const wincing=visageExpression(id,impact);
  assert.equal(steady.mood,'steady');
  assert.equal(before.mood,'focused');
  assert.equal(after.mood,'fierce');
  assert.equal(before.look<0,true);
  assert.equal(after.look>0,true);
  assert.equal(wincing.mood,'wincing');assert.ok(wincing.eyeHeight<1);
  assert.ok(Object.isFrozen(steady)&&Object.isFrozen(wincing));
 }
 assert.equal(JSON.stringify(source),initial,'ink expressions may not mutate battle events');
});
test('HP and fallen expression truth: low HP only when really wounded; fake miss never staggers',()=>{
 for(const id of VISAGE_IDENTITIES){
  assert.equal(visageExpression(id,null,{hp:20,maxHp:20}).mood,'steady');
  assert.equal(visageExpression(id,null,{hp:6,maxHp:20}).mood,'weary');
  assert.equal(visageExpression(id,{kind:'miss',progress:.5},{hp:20,maxHp:20}).mood,'steady');
  assert.equal(visageExpression(id,{kind:'stagger',progress:.5}).mood,'stunned');
  assert.equal(visageExpression(id,null,{hp:0,maxHp:20}).mood,'fallen');
  assert.equal(visageExpression(id,null,{fallen:true}).mood,'fallen');
  assert.equal(paintVisage(context(),id,null,{fallen:true}),false);
  assert.equal(paintVisage(context(),id,null,{hp:0,maxHp:20}),false);
 }
 assert.equal(visageExpression('stranger'),null);
 assert.equal(paintVisage(context(),'stranger'),false);
});
test('all original face details are deterministic, source-bounded and visibly unique at 38px to 70px',()=>{
 const seen=[];
 for(const size of [38,44,51,70])for(const id of VISAGE_IDENTITIES){
  const a=context(),b=context(),pose={kind:'attack',progress:.49};
  const saved=JSON.stringify(pose);
  assert.equal(paintVisage(a,id,pose),true);
  assert.equal(paintVisage(b,id,pose),true);
  assert.deepEqual(a.calls,b.calls);
  assert.ok(a.calls.some(x=>x[0]==='stroke'));
  balanced(a);
  assert.equal(JSON.stringify(pose),saved);
  for(const x of a.calls.filter(x=>['moveTo','lineTo','arc','ellipse'].includes(x[0]))){
   assert.ok(x[1]>=0&&x[1]<=100&&x[2]>=0&&x[2]<=100,id+' eye ink escaped 100-point miniature');
  }
  if(size===44)seen.push(JSON.stringify(a.calls));
 }
 assert.equal(new Set(seen).size,6);
});
test('full hero and foe source bodies preserve drawing transforms and canvas stack with expressions',()=>{
 for(const size of [38,44,51,70]){
  const box={x:9,y:11,width:size,height:size};
  for(const id of VISAGE_IDENTITIES){
   const ctx=context(),pose={kind:'stagger',progress:.5};
   if(id==='briar'||id==='shade')drawFoe(ctx,box,{id,hp:3,maxHp:12},null,pose);
   else drawHero(ctx,box,id,false,pose,{hp:3,maxHp:20,guard:1});
   assert.ok(ctx.calls.length>60);
   balanced(ctx);
  }
 }
});
test('rendered battlefield remains separate from gameplay and uses no DOM/time/random behavior',()=>{
 const s=setMovementBoard(createCommandState(),{columns:8,rows:6}),before=JSON.stringify(s);
 const ctx=context(),board=measureBoard(435,286);
 renderBoard(ctx,board,null,{actorId:s.actorId,positions:s.positions,targets:s.targets,
   partyHp:s.partyHp,guards:s.guards,ended:s.ended,intents:[]},null);
 assert.equal(JSON.stringify(s),before);balanced(ctx);
 const source=fs.readFileSync('src/board/visages.js','utf8');
 assert.doesNotMatch(source,/Math\.random|requestAnimationFrame|fetch\(|document\.|window\.|setInterval|addEventListener|localStorage/);
 const mini=fs.readFileSync('src/board/miniatures.js','utf8');
 assert.ok(mini.indexOf('paintVisage(ctx,id,pose')<mini.indexOf("paintArticulatedCloth(ctx,id,pose,'front')"));
});
