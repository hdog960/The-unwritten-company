import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {WEAPON_RIGS,rigMotion,rigPoint,paintWeaponRig} from '../src/board/weapon-rigs.js';
import {drawHero,drawFoe} from '../src/board/miniatures.js';
import {puppetPose} from '../src/board/choreography.js';
function ink(){
 const calls=[],ctx={calls};
 for(const name of ['save','restore','beginPath','closePath','moveTo','lineTo','arc','stroke','fill',
 'translate','scale','ellipse','fillRect','strokeRect','quadraticCurveTo','bezierCurveTo'])
  ctx[name]=(...args)=>calls.push([name,...args]);
 ctx.createLinearGradient=()=>({addColorStop(){}});
 ctx.createRadialGradient=()=>({addColorStop(){}});
 return ctx;
}
const balanced=ctx=>assert.equal(ctx.calls.filter(c=>c[0]==='save').length,ctx.calls.filter(c=>c[0]==='restore').length);
test('six weapons are geometrically individual and source-inked, not static duplicates',()=>{
 assert.deepEqual(WEAPON_RIGS,['captain','brunna','kess','mirelle','briar','shade']);
 const signatures=[];
 for(const id of WEAPON_RIGS){
  const a=ink(),b=ink();
  assert.equal(paintWeaponRig(a,id),true);
  assert.equal(paintWeaponRig(b,id),true);
  assert.deepEqual(a.calls,b.calls);
  assert.ok(a.calls.filter(c=>c[0]==='lineTo').length>=4);
  balanced(a);
  signatures.push(JSON.stringify(a.calls));
 }
 assert.equal(new Set(signatures).size,6);
 assert.equal(paintWeaponRig(ink(),'unknown'),false);
 assert.equal(rigPoint('unknown',[10,20]),null);
});
test('real attack puppetry changes separately hinged weapons, not unit positions',()=>{
 const path={column:3,row:2},enemy={kind:'hit',from:path,to:{column:2,row:2}};
 for(const id of WEAPON_RIGS){
  const position=id==='briar'||id==='shade'?enemy.from:enemy.from;
  const event={event:{...enemy,token:'t'},progress:.34};
  const pose=puppetPose(event,position);
  assert.equal(pose.kind,'attack');
  const a=rigMotion(id,null),b=rigMotion(id,pose),before=JSON.stringify(pose);
  assert.equal(a.angle,0);
  assert.notEqual(b.angle,0);
  const first=ink(),active=ink();
  paintWeaponRig(first,id,null);paintWeaponRig(active,id,pose);
  assert.notDeepEqual(first.calls,active.calls);
  assert.equal(JSON.stringify(pose),before);
  balanced(first);balanced(active);
  assert.deepEqual(rigMotion(id,{kind:'attack',progress:0}),a);
 }
});
test('tiny phone silhouettes render every rig/pose without overflowing 100-unit art source',()=>{
 for(const id of WEAPON_RIGS)for(const pose of [null,{kind:'attack',progress:.5},{kind:'move',progress:.5},
  {kind:'recoil',progress:.5},{kind:'stagger',progress:.5}]){
  const r=ink();assert.equal(paintWeaponRig(r,id,pose),true);
  for(const [op,x,y] of r.calls.filter(c=>['moveTo','lineTo','arc'].includes(c[0]))){
   assert.ok(x>=0&&x<=100&&y>=0&&y<=100,id+' rig point '+op+' '+x+','+y);
  }
  balanced(r);
 }
 for(const size of [38,44,51,69]){
  for(const id of WEAPON_RIGS){
   const r=ink(),rect={x:6,y:8,width:size,height:size};
   if(id==='briar'||id==='shade')drawFoe(r,rect,{id,hp:7,maxHp:12},null,{kind:'attack',progress:.5});
   else drawHero(r,rect,id,false,{kind:'attack',progress:.5});
   balanced(r);
  }
 }
});
test('weapon art is inside figures and not an additional canvas or touch surface',()=>{
 const source=fs.readFileSync('src/board/miniatures.js','utf8');
 const rigs=fs.readFileSync('src/board/weapon-rigs.js','utf8');
 assert.match(source,/paintWeaponRig\(ctx,id,pose\)/);
 assert.match(source,/paintWeaponRig\(ctx,foe.id,pose\)/);
 assert.doesNotMatch(rigs,/document\.|window\.|fetch\(|Math\.random\(/);
 assert.doesNotMatch(rigs,/addEventListener/);
});
