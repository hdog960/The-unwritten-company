import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {combatBearing,bearingPose} from '../src/board/bearings.js';
import {miniaturePose,renderBoard} from '../src/board/scene.js';
import {figureBeat} from '../src/board/combat-beats.js';
import {rigMotion} from '../src/board/weapon-rigs.js';
import {gestureJoints} from '../src/board/pose-gestures.js';
import {clothPose,clothShape} from '../src/board/articulated-cloth.js';
import {foldedShadowProfile} from '../src/board/paper-puppets.js';
import {visageExpression} from '../src/board/visages.js';
import {paintActionSeal} from '../src/board/action-seals.js';
import {drawHero,drawFoe} from '../src/board/miniatures.js';
import {createCommandState,setMovementBoard} from '../src/commands/engine.js';
import {measureBoard} from '../src/board/geometry.js';

const p=(column,row)=>({column,row});
const event=(kind,from,to)=>({event:{kind,from,to,token:'real-seed'},progress:.3});
function ink(){
 const calls=[],ctx={calls,globalAlpha:1};
 for(const op of ['save','restore','beginPath','closePath','moveTo','lineTo','rect','clip','fill','stroke',
  'arc','ellipse','fillRect','strokeRect','translate','scale','setLineDash','quadraticCurveTo','bezierCurveTo'])
  ctx[op]=(...a)=>calls.push([op,...a]);
 ctx.createLinearGradient=()=>({addColorStop(){}});
 ctx.createRadialGradient=()=>({addColorStop(){}});
 return ctx;
}
const balanced=c=>assert.equal(c.calls.filter(x=>x[0]==='save').length,c.calls.filter(x=>x[0]==='restore').length);
test('eight grid bearings are derived from true from/to coordinates, not character handedness',()=>{
 const center=p(4,3);
 for(const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,-1],[-1,1],[1,1]]){
  const dest=p(4+dx*2,3+dy*2),frame=event('hit',center,dest);
  const body=miniaturePose(frame,center);
  assert.equal(body.kind,'attack');
  assert.deepEqual(body.bearing,{x:dx,y:dy,role:'attack'});
  assert.deepEqual(combatBearing(frame,center,body),body.bearing);
  assert.ok(Object.isFrozen(body)&&Object.isFrozen(body.bearing));
 }
});
test('left-facing hero releases toward left; right-facing hero releases toward right, with genuine windup',()=>{
 const from=p(4,2);
 const right=miniaturePose(event('hit',from,p(6,2)),from);
 const left=miniaturePose(event('hit',from,p(2,2)),from);
 for(const id of ['captain','brunna','kess','mirelle','briar','shade']){
  const a=figureBeat(id,right),b=figureBeat(id,left);
  assert.ok(a.x>0&&b.x<0,id+' direction must be physical not preset');
  assert.equal(Math.sign(a.x),-Math.sign(b.x));
  const wA=rigMotion(id,right),wB=rigMotion(id,left);
  assert.equal(wA.angle,-wB.angle,'physical weapon swing should reverse with target');
  assert.notDeepEqual(gestureJoints(id,right),gestureJoints(id,left),'the weapon wrist must follow');
  assert.equal(clothPose(id,right).fold,-clothPose(id,left).fold);
  assert.notDeepEqual(foldedShadowProfile(id,right),foldedShadowProfile(id,left));
  assert.ok(visageExpression(id,right).look>0&&visageExpression(id,left).look<0);
  const bare={kind:'attack',progress:.5};
  const backed=figureBeat(id,bare);
  assert.deepEqual(figureBeat(id,{...bare}),backed,'unbound illustrated study pose must not change');
 }
});
test('pure vertical and diagonal attacks have bounded vertical movement and do not drift across columns',()=>{
 const at=p(3,3);
 for(const id of ['captain','brunna','kess','mirelle','briar','shade']){
  const up=figureBeat(id,miniaturePose(event('critical',at,p(3,1)),at));
  const down=figureBeat(id,miniaturePose(event('critical',at,p(3,5)),at));
  assert.equal(up.x,0);assert.equal(down.x,0);
  assert.ok(up.y<down.y,'vertical attack must lunge in target direction');
  for(const pt of [up,down,figureBeat(id,miniaturePose(event('critical',at,p(1,1)),at))])
   assert.ok(Math.abs(pt.x)<5&&Math.abs(pt.y)<6,'the miniature cannot escape its tile');
 }
});
test('damage reactions push away from the real source; misses NEVER move victims',()=>{
 const defender=p(4,3);
 const left=miniaturePose({event:{kind:'hit',from:p(2,3),to:defender},progress:.75},defender);
 const right=miniaturePose({event:{kind:'hit',from:p(6,3),to:defender},progress:.75},defender);
 const critical=miniaturePose({event:{kind:'critical',from:p(2,3),to:defender},progress:.75},defender);
 assert.equal(left.kind,'recoil');assert.equal(right.kind,'recoil');assert.equal(critical.kind,'stagger');
 assert.deepEqual(left.bearing,{x:1,y:0,role:'impact'});
 assert.deepEqual(right.bearing,{x:-1,y:0,role:'impact'});
 for(const id of ['captain','brunna','kess','mirelle','briar','shade']){
  assert.ok(figureBeat(id,left).x>0&&figureBeat(id,right).x<0);
  assert.ok(figureBeat(id,critical).x>figureBeat(id,left).x);
 }
 const miss={event:{kind:'miss',from:p(2,3),to:defender},progress:.75};
 assert.equal(miniaturePose(miss,defender),null);
 assert.equal(combatBearing(miss,defender,{kind:'recoil',progress:.5}),null);
});
test('enemy attacks obey actual staggered marks: no early second target, no imaginary facing',()=>{
 const a=p(1,2),b=p(6,4),hero=p(3,4);
 const enemy={event:{kind:'enemy-phase',marks:[
  {kind:'hit',from:a,to:hero},{kind:'critical',from:b,to:hero}
 ]},progress:.08};
 const first=miniaturePose(enemy,a),second=miniaturePose(enemy,b);
 assert.equal(first.kind,'attack');assert.deepEqual(first.bearing,{x:1,y:1,role:'attack'});
 assert.equal(second,null,'enemy two cannot lean before its scheduled phase');
 assert.equal(combatBearing(enemy,b,{kind:'attack',progress:.1}),null);
 const late={...enemy,progress:.54};
 const secondActive=miniaturePose(late,b);
 assert.ok(secondActive?.bearing,'later enemy must receive only its actual victim direction');
 assert.deepEqual(secondActive.bearing,{x:-1,y:0,role:'attack'});
});
test('authentic action-seal nib follows the attacked tile in four cardinal directions',()=>{
 const from=p(4,3),rect={x:10,y:15,width:46,height:46},images=[];
 for(const dest of [p(6,3),p(2,3),p(4,1),p(4,5)]){
  const pose=miniaturePose(event('hit',from,dest),from),ctx=ink(),snapshot=JSON.stringify(pose);
  assert.equal(paintActionSeal(ctx,rect,'captain',pose),true);
  const written=ctx.calls.filter(c=>['moveTo','lineTo'].includes(c[0]));
  for(const [,x,y] of written)assert.ok(x>=rect.x&&x<=rect.x+rect.width&&y>=rect.y&&y<=rect.y+rect.height,'ink escaped tile');
  images.push(JSON.stringify(written.slice(-9)));balanced(ctx);
  assert.equal(JSON.stringify(pose),snapshot);
 }
 assert.equal(new Set(images).size,4);
});
test('real art/engine remain unchanged: all six figures render in 38-70px landscape source tiles',()=>{
 const at=p(4,3),frame=event('critical',at,p(1,2));
 for(const size of [38,44,51,70])for(const id of ['captain','brunna','kess','mirelle','briar','shade']){
  const box={x:3,y:5,width:size,height:size},ctx=ink(),pose=miniaturePose(frame,at);
  if(['briar','shade'].includes(id))drawFoe(ctx,box,{id,hp:7,maxHp:12},null,pose);
  else drawHero(ctx,box,id,false,pose,{hp:10,maxHp:20});
  balanced(ctx);assert.ok(ctx.calls.length>100);
 }
 const state=setMovementBoard(createCommandState(),{columns:8,rows:6});
 const previous=JSON.stringify(state),scene=ink();
 renderBoard(scene,measureBoard(440,290),null,{actorId:state.actorId,positions:state.positions,
  targets:state.targets,partyHp:state.partyHp,guards:state.guards,ended:state.ended,intents:[]},frame);
 balanced(scene);assert.equal(JSON.stringify(state),previous);
});
test('direction visuals do not add network, timers, input, randomness or persistent state',()=>{
 for(const file of ['src/board/bearings.js','src/board/combat-beats.js']){
  const source=fs.readFileSync(file,'utf8');
  assert.doesNotMatch(source,/fetch\(|document\.|window\.|Math\.random|setInterval|setTimeout|requestAnimationFrame|localStorage|addEventListener/);
 }
 assert.equal(combatBearing(null,p(0,0),{kind:'attack',progress:.3}),null);
 assert.equal(combatBearing(event('hit',p(0,0),p(0,0)),p(0,0),{kind:'attack',progress:.3}),null);
 assert.equal(combatBearing(event('hit',p(1,1),p(2,1)),null,{kind:'attack',progress:.3}),null);
 assert.equal(bearingPose(event('miss',p(1,1),p(2,1)),p(2,1),null),null);
 const input={kind:'ward',progress:.5},clone=bearingPose(event('hit',p(1,1),p(2,1)),p(1,1),input);
 assert.equal(clone,input,'no bearing for Ward');
});
