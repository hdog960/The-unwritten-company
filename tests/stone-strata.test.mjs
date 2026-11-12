import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {measureBoard,cellRect,getTile} from '../src/board/geometry.js';
import {STONE_STRATA_STYLES,stoneStrataPlan,paintStoneStrata} from '../src/board/stone-strata.js';
import {renderBoard} from '../src/board/scene.js';

const b=measureBoard(440,290);
function canvas(){
 const calls=[],ctx={calls};
 for(const name of ['beginPath','closePath','moveTo','lineTo','rect','clip','stroke','fill',
   'fillRect','strokeRect','arc','ellipse','save','restore','setLineDash',
   'bezierCurveTo','quadraticCurveTo','translate','scale','rotate'])
  ctx[name]=(...args)=>calls.push([name,...args]);
 ctx.createLinearGradient=()=>({addColorStop(){}});
 ctx.createRadialGradient=()=>({addColorStop(){}});
 return ctx;
}
test('four physically distinct native stone cuts, not a single repeated V-shaped icon',()=>{
 assert.equal(STONE_STRATA_STYLES.length,4);
 assert.equal(new Set(STONE_STRATA_STYLES).size,4);
 const stone=[];
 for(let r=0;r<b.rows;r++)for(let c=0;c<b.columns;c++){
  if(getTile(r,c)==='stone')stone.push(stoneStrataPlan(cellRect(b,c,r),r,c));
 }
 assert.ok(stone.length>15);
 assert.deepEqual(new Set(stone.map(p=>p.style)),new Set(STONE_STRATA_STYLES));
 assert.ok(stone.every(p=>p.seam.length===5&&p.short.length===3&&p.chip.length===4));
});
test('deterministic and deeply immutable ink; no dependence on live state or time',()=>{
 const rect=cellRect(b,0,0),a=stoneStrataPlan(rect,0,0);
 assert.deepEqual(a,stoneStrataPlan(rect,0,0));
 assert.ok(Object.isFrozen(a)&&Object.isFrozen(a.material)&&Object.isFrozen(a.seam));
 assert.ok(Object.isFrozen(a.seam[0])&&Object.isFrozen(a.chip[0])&&Object.isFrozen(a.grains[0]));
 assert.equal(stoneStrataPlan(null,0,0),null);
 assert.equal(stoneStrataPlan({...rect,width:0},0,0),null);
 assert.equal(stoneStrataPlan(rect,-1,0),null);
 assert.equal(stoneStrataPlan(rect,0,1.5),null);
 assert.equal(stoneStrataPlan({...rect,x:NaN},0,0),null);
});
test('all authentic cut/chip coordinates stay within actual miniature-safe stone margins',()=>{
 for(const size of [38,44,51,70]){
  for(let r=0;r<6;r++)for(let c=0;c<8;c++){
   const rect={x:23+c*size,y:19+r*size,width:size,height:size};
   const p=stoneStrataPlan(rect,r,c);
   for(const point of [...p.seam,...p.short,...p.chip,...p.notch,...p.grains]){
    const x=(point[0]-rect.x)/size,y=(point[1]-rect.y)/size;
    assert.ok(x>=.099&&x<=.901&&y>=.099&&y<=.901);
   }
  }
 }
});
test('four actual source geometries paint uniquely, consistently and without fake target rings',()=>{
 const signatures=[];
 for(let c=0;c<4;c++){
  const rect={x:0,y:0,width:44,height:44},a=canvas(),again=canvas();
  assert.equal(paintStoneStrata(a,rect,0,c),true);
  assert.equal(paintStoneStrata(again,rect,0,c),true);
  assert.deepEqual(a.calls,again.calls);
  assert.equal(a.calls.filter(v=>v[0]==='arc').length,0);
  assert.equal(a.calls.filter(v=>v[0]==='clip').length,1);
  assert.ok(a.calls.filter(v=>v[0]==='stroke').length>=4);
  assert.ok(a.calls.filter(v=>v[0]==='fill').length>=2);
  assert.equal(a.calls.filter(v=>v[0]==='save').length,1);
  assert.equal(a.calls.filter(v=>v[0]==='restore').length,1);
  signatures.push(JSON.stringify(a.calls));
 }
 assert.equal(new Set(signatures).size,4);
 assert.equal(paintStoneStrata(null,{x:0,y:0,width:44},0,0),false);
});
test('all real board stone cells render; non-stone terrain is never turned to stone',()=>{
 const scene=fs.readFileSync('src/board/scene.js','utf8');
 assert.ok(scene.includes("if(terrain==='stone')paintStoneStrata(ctx,rect,row,col);"));
 assert.ok(scene.indexOf("paintStoneStrata(ctx,rect,row,col)")<
   scene.indexOf("paintTileRelief(ctx,rect,terrain,row,col)"));
 assert.ok(scene.indexOf("paintStoneStrata(ctx,rect,row,col)")<
   scene.indexOf("paintTargetIndicators(ctx,board,overlay?.targetIndicators)"));
 assert.ok(scene.indexOf("paintStoneStrata(ctx,rect,row,col)")<
   scene.indexOf("drawHero(ctx,rect,id"));
 assert.equal(getTile(0,3),'glyph');
 assert.equal(getTile(2,1),'rubble');
 assert.equal(getTile(1,5),'water');
 assert.equal(getTile(1,1),'moss');
});
test('the repeated old dark stone chevron is eliminated only on stone, preserving other materials',()=>{
 const scene=fs.readFileSync('src/board/scene.js','utf8');
 assert.ok(scene.includes("if(kind!=='stone')line(ctx,"));
 assert.ok(scene.includes("drawStone(ctx,x,y,s,row,column,kind);"));
});
test('visual-only source renders the original full 4v2 scene without mutating board geometry',()=>{
 const before=JSON.stringify(b),ctx=canvas();
 renderBoard(ctx,b,null,{
  actorId:'captain',
  positions:{captain:{column:1,row:4},brunna:{column:2,row:5},
   kess:{column:1,row:1},mirelle:{column:5,row:4}},
  partyHp:{captain:20,brunna:24,kess:16,mirelle:14},
  guards:{},targets:{
   briar:{id:'briar',position:{column:7,row:0},hp:13,maxHp:13},
   shade:{id:'shade',position:{column:0,row:1},hp:12,maxHp:12}
  }
 });
 assert.equal(JSON.stringify(b),before);
 assert.ok(ctx.calls.filter(v=>v[0]==='clip').length>4);
 assert.equal(ctx.calls.filter(v=>v[0]==='save').length,
   ctx.calls.filter(v=>v[0]==='restore').length);
});
test('local original art is PWA cached exactly once with strict worker scope',()=>{
 const source=fs.readFileSync('src/board/stone-strata.js','utf8');
 const sw=fs.readFileSync('service-worker.js','utf8');
 for(const banned of ['Math.random','fetch(','window.','document.','setTimeout','setInterval',
  'requestAnimationFrame','localStorage','AudioContext','addEventListener'])
  assert.ok(!source.includes(banned),banned);
 assert.ok(sw.includes('v0.09-gate-a31-r1'));
 assert.equal(sw.split("'./src/board/stone-strata.js'").length-1,1);
 assert.ok(!sw.includes('skipWaiting('));
});
