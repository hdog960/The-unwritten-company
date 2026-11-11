import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {CLOTH_IDENTITIES,clothPose,clothShape,paintArticulatedCloth} from '../src/board/articulated-cloth.js';
import {drawHero,drawFoe} from '../src/board/miniatures.js';
import {puppetPose} from '../src/board/choreography.js';
const mk=()=>{
 const calls=[],ctx={calls,globalAlpha:1};
 for(const m of ['save','restore','beginPath','closePath','moveTo','lineTo','arc','ellipse',
  'stroke','fill','fillRect','strokeRect','translate','scale','quadraticCurveTo','bezierCurveTo'])
  ctx[m]=(...args)=>calls.push([m,...args]);
 ctx.createLinearGradient=()=>({addColorStop(){}});
 ctx.createRadialGradient=()=>({addColorStop(){}});
 return ctx;
};
const ok=ctx=>assert.equal(ctx.calls.filter(c=>c[0]==='save').length,ctx.calls.filter(c=>c[0]==='restore').length);
test('six bespoke silhouettes replace four static capes, while keeping all living figure identities',()=>{
 assert.deepEqual(CLOTH_IDENTITIES,['captain','brunna','kess','mirelle','briar','shade']);
 const signatures=CLOTH_IDENTITIES.map(id=>JSON.stringify(clothShape(id)));
 assert.equal(new Set(signatures).size,6);
 const src=fs.readFileSync('src/board/miniatures.js','utf8');
 assert.doesNotMatch(src,/function cape\(/);
 assert.doesNotMatch(src,/  cape\(ctx,/);
 assert.match(src,/paintArticulatedCloth\(ctx,id,pose,'back'\)/);
 assert.match(src,/paintArticulatedCloth\(ctx,id,pose,'front'\)/);
 assert.match(src,/paintArticulatedCloth\(ctx,foe.id,pose,'back'\)/);
 assert.match(src,/paintArticulatedCloth\(ctx,foe.id,pose,'front'\)/);
 assert.ok(src.indexOf("paintArticulatedCloth(ctx,id,pose,'back')")<src.indexOf("drawCaptain(ctx)"));
 assert.ok(src.indexOf("paintArticulatedCloth(ctx,id,pose,'front')")<src.indexOf("paintWeaponRig(ctx,id,pose)"));
});
test('cloth stays attached at shoulders while unique tips trail real attack/ward/recoil/stagger/movement',()=>{
 const hit={event:{kind:'hit',from:{column:3,row:2},to:{column:4,row:2},token:'combat'},progress:.3};
 const combatPose=puppetPose(hit,{column:3,row:2});
 assert.equal(combatPose.kind,'attack');
 for(const id of CLOTH_IDENTITIES){
  const still=clothShape(id,null),moving=clothShape(id,combatPose),before=JSON.stringify(combatPose);
  assert.notDeepEqual(still,moving,id+' must have a visible action fold');
  assert.equal(JSON.stringify(combatPose),before);
  assert.ok(Object.isFrozen(moving)&&moving.every(Object.isFrozen));
  assert.ok(Math.abs(still[0][0]-moving[0][0])<1,'shoulder seam should be anchored');
  for(const kind of ['attack','ward','recoil','stagger','move']){
   const pose={kind,progress:.5},back=clothShape(id,pose),front=clothShape(id,pose,'front');
   assert.ok(back&&front&&back.length>=6&&front.length>=4);
   for(const [x,y] of [...back,...front,...clothShape(id,pose,'seam')]){
    assert.ok(x>=4&&x<=96&&y>=4&&y<=96,id+' flutter leaves miniature tile');
   }
  }
  assert.deepEqual(clothPose(id,{kind:'attack',progress:0}),clothPose(id));
  assert.deepEqual(clothPose(id,{kind:'attack',progress:1}),clothPose(id));
 }
});
test('both relief layers are deterministic, visible at real narrow phone tiles, and save canvas state',()=>{
 for(const size of [31,38,44,51,69])for(const id of CLOTH_IDENTITIES){
  for(const layer of ['back','front']){
   const a=mk(),b=mk(),pose={kind:'attack',progress:.5},snapshot=JSON.stringify(pose);
   assert.equal(paintArticulatedCloth(a,id,pose,layer),true);
   assert.equal(paintArticulatedCloth(b,id,pose,layer),true);
   assert.deepEqual(a.calls,b.calls);
   assert.ok(a.calls.filter(c=>c[0]==='fill').length>=1);
   for(const c of a.calls.filter(c=>['moveTo','lineTo','arc'].includes(c[0]))){
    assert.ok(c[1]>=0&&c[1]<=100&&c[2]>=0&&c[2]<=100,id+' source detail bounds');
   }
   ok(a);assert.equal(JSON.stringify(pose),snapshot);
  }
  const ctx=mk(),rect={x:9,y:13,width:size,height:size};
  if(['briar','shade'].includes(id))drawFoe(ctx,rect,{id,hp:7,maxHp:13},null,{kind:'stagger',progress:.55});
  else drawHero(ctx,rect,id,false,{kind:'attack',progress:.5});
  ok(ctx);
 }
 assert.equal(paintArticulatedCloth(mk(),'unknown'),false);
 assert.equal(clothShape('unknown'),null);
 assert.equal(clothShape('captain',null,'invalid'),null);
});
test('cloth remains rendering-only and avoids unsafe ambient motion or extra touch layers',()=>{
 const src=fs.readFileSync('src/board/articulated-cloth.js','utf8');
 assert.doesNotMatch(src,/requestAnimationFrame|setInterval|Math\.random|document\.|addEventListener|fetch\(/);
 assert.match(src,/paintArticulatedCloth/);
});
