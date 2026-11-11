import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {attackBeat,figureBeat,GESTURE_IDENTITIES} from '../src/board/combat-beats.js';
import {gestureJoints,paintGestureJoints} from '../src/board/pose-gestures.js';
import {rigMotion} from '../src/board/weapon-rigs.js';
import {clothShape} from '../src/board/articulated-cloth.js';
import {foldedShadowProfile} from '../src/board/paper-puppets.js';
import {puppetPose,visibleMarks} from '../src/board/choreography.js';
import {drawHero,drawFoe} from '../src/board/miniatures.js';
const mk=()=>{
 const calls=[],ctx={calls,globalAlpha:1};
 for(const m of ['save','restore','beginPath','closePath','moveTo','lineTo','arc','ellipse','rect','clip',
   'stroke','fill','fillRect','strokeRect','translate','scale','setLineDash','quadraticCurveTo','bezierCurveTo'])
  ctx[m]=(...args)=>calls.push([m,...args]);
 ctx.createLinearGradient=()=>({addColorStop(){}});
 ctx.createRadialGradient=()=>({addColorStop(){}});
 return ctx;
};
const balanced=ctx=>assert.equal(ctx.calls.filter(c=>c[0]==='save').length,ctx.calls.filter(c=>c[0]==='restore').length);
test('four-beat attack goes backwards before forward release, follows through and settles',()=>{
 for(const [p,phase,sign] of [[0,'rest',0],[.18,'anticipation',-1],[.48,'release',1],
   [.69,'follow-through',1],[.90,'settle',1],[1,'rest',0]]){
  const beat=attackBeat(p);
  assert.equal(beat.phase,phase);assert.equal(Math.sign(beat.sweep),sign);assert.ok(Object.isFrozen(beat));
 }
 assert.deepEqual(attackBeat(-3),attackBeat(0));
 assert.deepEqual(attackBeat(3),attackBeat(1));
 assert.deepEqual(attackBeat(NaN),attackBeat(0));
});
test('six original body postures are distinct, deterministic, bounded and settle exactly',()=>{
 assert.deepEqual(GESTURE_IDENTITIES,['captain','brunna','kess','mirelle','briar','shade']);
 const signatures=[];
 for(const id of GESTURE_IDENTITIES){
  const still=figureBeat(id),windup=figureBeat(id,{kind:'attack',progress:.16});
  const strike=figureBeat(id,{kind:'attack',progress:.53});
  const recoil=figureBeat(id,{kind:'recoil',progress:.5});
  const stagger=figureBeat(id,{kind:'stagger',progress:.5});
  signatures.push(JSON.stringify([windup,strike,recoil,stagger]));
  assert.deepEqual(figureBeat(id,{kind:'attack',progress:0}),still);
  assert.deepEqual(figureBeat(id,{kind:'attack',progress:1}),still);
  assert.ok(Object.isFrozen(strike));
  assert.ok(Math.abs(strike.x)<5&&Math.abs(strike.y)<6);
  assert.notEqual(windup.x,strike.x);
  assert.notEqual(recoil.x,stagger.x);
 }
 assert.equal(new Set(signatures).size,6);
 assert.equal(figureBeat('fake'),null);
});
test('actual hit/miss/critical clock controls victim response and enemy sequencing',()=>{
 const at={column:2,row:2},foe={column:4,row:2};
 for(const kind of ['hit','miss','critical']){
  const mark={kind,from:at,to:foe,token:'real-clock'},original=JSON.stringify(mark);
  const windup=puppetPose({event:mark,progress:.10},at);
  assert.equal(windup.kind,'attack');
  assert.equal(figureBeat('captain',windup).phase,'anticipation');
  const release=puppetPose({event:mark,progress:.35},at);
  assert.equal(figureBeat('captain',release).phase,'release');
  const impact=puppetPose({event:mark,progress:.72},foe);
  if(kind==='miss')assert.equal(impact,null);
  else assert.equal(impact.kind,kind==='critical'?'stagger':'recoil');
  assert.equal(JSON.stringify(mark),original);
 }
 const pair={kind:'enemy-phase',marks:[{kind:'hit',from:at,to:foe},{kind:'critical',from:foe,to:at}]};
 assert.equal(visibleMarks({event:pair,progress:.12})[1].visible,false);
 assert.equal(puppetPose({event:pair,progress:.12},foe),null);
});
test('hand-drawn arms are attached, unique, bounded and saved within the source tile',()=>{
 for(const id of GESTURE_IDENTITIES){
  const still=gestureJoints(id),active=gestureJoints(id,{kind:'attack',progress:.53});
  assert.equal(still.length,2);assert.ok(Object.isFrozen(active));
  assert.notDeepEqual(still,active);
  for(let i=0;i<2;i++)assert.deepEqual(still[i].points[0],active[i].points[0]);
  for(const pose of [null,{kind:'attack',progress:.16},{kind:'attack',progress:.53},
   {kind:'recoil',progress:.5},{kind:'stagger',progress:.5},{kind:'move',progress:.5}]){
   const ctx=mk();
   assert.equal(paintGestureJoints(ctx,id,pose),true);
   for(const {points} of gestureJoints(id,pose))
    for(const [x,y] of points)assert.ok(x>=4&&x<=96&&y>=4&&y<=96);
   for(const [name,x,y] of ctx.calls.filter(c=>['moveTo','lineTo','arc'].includes(c[0])))
    assert.ok(x>=0&&x<=100&&y>=0&&y<=100,id+' bounds '+name);
   balanced(ctx);
  }
 }
 assert.equal(paintGestureJoints(mk(),'fake'),false);
 assert.equal(gestureJoints('fake'),null);
});
test('body, weapon, cloth and shadow all distinguish windup from release',()=>{
 for(const id of GESTURE_IDENTITIES){
  const before={kind:'attack',progress:.18},release={kind:'attack',progress:.53};
  const a=rigMotion(id,before),b=rigMotion(id,release);
  assert.equal(Math.sign(a.angle),-Math.sign(b.angle));
  assert.notDeepEqual(clothShape(id,before),clothShape(id,release));
  assert.notDeepEqual(foldedShadowProfile(id,before),foldedShadowProfile(id,release));
  assert.notEqual(figureBeat(id,before).x,figureBeat(id,release).x);
  assert.deepEqual(rigMotion(id,{kind:'attack',progress:0}),rigMotion(id,null));
 }
});
test('miniature renders remain balanced with all real animation keyframes',()=>{
 for(const size of [38,44,52,68])for(const id of GESTURE_IDENTITIES){
  const ctx=mk(),rect={x:6,y:9,width:size,height:size};
  for(const p of [.15,.4,.7,.95]){
   const pose={kind:'attack',progress:p};
   if(id==='briar'||id==='shade')drawFoe(ctx,rect,{id,hp:6,maxHp:12},null,pose);
   else drawHero(ctx,rect,id,false,pose);
  }
  balanced(ctx);
 }
 const source=fs.readFileSync('src/board/miniatures.js','utf8'),
       gestures=fs.readFileSync('src/board/pose-gestures.js','utf8');
 assert.match(source,/paintGestureJoints\(ctx,id,pose\)/);
 assert.match(source,/paintGestureJoints\(ctx,foe.id,pose\)/);
 assert.ok(source.indexOf('paintGestureJoints(ctx,id,pose)')<source.indexOf('paintWeaponRig(ctx,id,pose)'));
 assert.doesNotMatch(gestures,/fetch\(|requestAnimationFrame|Math\.random|document\.|addEventListener/);
});
