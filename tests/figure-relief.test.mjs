import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {FIGURE_RELIEFS,RELIEF_LAYERS,reliefGeometry,paintFigureRelief} from '../src/board/figure-relief.js';
import {TILE_RELIEF_MATERIALS,tileReliefPlan,paintTileRelief} from '../src/board/tile-relief.js';
import {drawHero,drawFoe} from '../src/board/miniatures.js';
import {getTile,measureBoard,cellRect} from '../src/board/geometry.js';
import {renderBoard} from '../src/board/scene.js';
import {createCommandState,setMovementBoard} from '../src/commands/engine.js';
function ink(){
 const calls=[],ctx={calls,globalAlpha:1};
 for(const name of ['save','restore','beginPath','closePath','moveTo','lineTo','arc','ellipse','rect',
  'clip','fill','stroke','fillRect','strokeRect','translate','scale','setLineDash','quadraticCurveTo','bezierCurveTo'])
  ctx[name]=(...args)=>calls.push([name,...args]);
 ctx.createLinearGradient=()=>({addColorStop(){}});
 ctx.createRadialGradient=()=>({addColorStop(){}});
 return ctx;
}
const balanced=ctx=>assert.equal(ctx.calls.filter(x=>x[0]==='save').length,ctx.calls.filter(x=>x[0]==='restore').length);
const party=['captain','brunna','kess','mirelle'],foes=['briar','shade'];
test('six authored paper silhouettes have distinct geometry, materials, underlayers and relief facets',()=>{
 const ids=[...party,...foes];
 assert.deepEqual(Object.keys(FIGURE_RELIEFS),ids);
 assert.deepEqual(RELIEF_LAYERS,['rear','finish']);
 for(const key of ['contour','facets','etch'])
  assert.equal(new Set(ids.map(id=>JSON.stringify(FIGURE_RELIEFS[id][key]))).size,6,key+' unique per character');
 for(const id of ids){
  const design=FIGURE_RELIEFS[id],rear=reliefGeometry(id),finish=reliefGeometry(id,'finish');
  assert.ok(rear.length===3&&finish.length===4);
  assert.ok(Object.isFrozen(rear)&&rear.every(Object.isFrozen));
  assert.ok(design.contour.length>=10&&design.facets.length===2);
  for(const layer of RELIEF_LAYERS)for(const shape of reliefGeometry(id,layer))for(const [x,y] of shape)
   assert.ok(x>=2&&x<=97&&y>=2&&y<=97,id+' shape outside its cut-paper frame');
 }
 assert.equal(reliefGeometry('fake'),null);
 assert.equal(reliefGeometry('captain','bad'),null);
});
test('real figure relief has separate rear edge and surface facets, no faux fallen highlights',()=>{
 for(const id of [...party,...foes]){
  const back=ink(),shine=ink(),pose={kind:'attack',progress:.46},original=JSON.stringify(pose);
  assert.equal(paintFigureRelief(back,id,pose,'rear'),true);
  assert.equal(paintFigureRelief(shine,id,pose,'finish'),true);
  assert.ok(back.calls.filter(x=>x[0]==='fill').length>=3);
  assert.ok(shine.calls.filter(x=>x[0]==='fill').length>=3);
  assert.notDeepEqual(back.calls,shine.calls);
  balanced(back);balanced(shine);
  assert.equal(JSON.stringify(pose),original);
  assert.equal(paintFigureRelief(ink(),id,pose,'rear',true),false);
  const a=ink(),b=ink();
  paintFigureRelief(a,id,pose,'finish');paintFigureRelief(b,id,pose,'finish');
  assert.deepEqual(a.calls,b.calls,'no random material and no unsynchronized animation');
 }
 assert.equal(paintFigureRelief(null,'captain'),false);
 assert.equal(paintFigureRelief(ink(),'unknown'),false);
});
test('different material bevels all stay inside authentic square cell bounds',()=>{
 assert.deepEqual(TILE_RELIEF_MATERIALS,['stone','moss','water','rubble','glyph']);
 for(const size of [38,44,51,70])for(const kind of TILE_RELIEF_MATERIALS){
  const box={x:12,y:18,width:size,height:size},plan=tileReliefPlan(box,kind,3,4);
  assert.ok(plan&&plan.base.length===2&&plan.inset.length===2);
  const ctx=ink(),other=ink();
  assert.equal(paintTileRelief(ctx,box,kind,3,4),true);
  assert.equal(paintTileRelief(other,box,kind,3,4),true);
  assert.deepEqual(ctx.calls,other.calls,'terrain relief may not flicker frame to frame');
  for(const segments of [...plan.base,...plan.inset,plan.notch]){
   const pts=typeof segments[0]==='number'?[segments]:segments;
   for(const [x,y] of pts)assert.ok(x>=box.x+1&&x<=box.x+size-1&&y>=box.y+1&&y<=box.y+size-1,
    kind+' bevel crosses a tile boundary');
  }
  balanced(ctx);
 }
 assert.equal(tileReliefPlan(null,'stone'),null);
 assert.equal(paintTileRelief(ink(),{x:0,y:0,width:48,height:48},'unknown',2,3),false);
});
test('five tile materials use distinct geometries, not a uniform translucent ring',()=>{
 const rect={x:4,y:8,width:60,height:60};
 const plots=TILE_RELIEF_MATERIALS.map(kind=>{
  const ctx=ink();paintTileRelief(ctx,rect,kind,2,3);return JSON.stringify(ctx.calls);
 });
 assert.equal(new Set(plots).size,5);
 const first=tileReliefPlan(rect,'moss',2,3),next=tileReliefPlan(rect,'moss',2,3);
 assert.deepEqual(first,next);
 assert.ok(Object.isFrozen(first)&&Object.isFrozen(first.base));
});
test('all six illustrated miniatures render on 38-70 px phone tiles without changing caller state',()=>{
 for(const size of [38,44,51,70]){
  const rect={x:6,y:7,width:size,height:size};
  for(const id of party){
   const ctx=ink(),pose={kind:'recoil',progress:.52},snapshot=JSON.stringify(pose);
   drawHero(ctx,rect,id,false,pose,{hp:7,maxHp:20,guard:2});
   drawHero(ctx,rect,id,true,null,{hp:0,maxHp:20});
   balanced(ctx);
   assert.equal(JSON.stringify(pose),snapshot);
   assert.ok(ctx.calls.length>100);
  }
  for(const id of foes){
   const ctx=ink(),foe={id,hp:8,maxHp:16},before=JSON.stringify(foe);
   drawFoe(ctx,rect,foe,null,{kind:'stagger',progress:.5});
   drawFoe(ctx,rect,{...foe,hp:0},null);
   balanced(ctx);assert.equal(JSON.stringify(foe),before);
  }
 }
});
test('genuine 8x6 battlefield paints 48 native relief tiles before hero/foe, without changing game state',()=>{
 const board=measureBoard(440,290);
 const state=setMovementBoard(createCommandState(),{columns:board.columns,rows:board.rows});
 const before=JSON.stringify(state),ctx=ink();
 renderBoard(ctx,board,null,{actorId:state.actorId,positions:state.positions,
  partyHp:state.partyHp,guards:state.guards,targets:state.targets,ended:state.ended,intents:[]});
 balanced(ctx);assert.equal(JSON.stringify(state),before);
 const source=fs.readFileSync('src/board/scene.js','utf8'),mini=fs.readFileSync('src/board/miniatures.js','utf8');
 assert.ok(source.indexOf('paintTileRelief(ctx,rect,terrain,row,col)')<source.indexOf('paintTargetIndicators(ctx,board'));
 assert.ok(source.indexOf('paintTileRelief(ctx,rect,terrain,row,col)')<source.indexOf('paintThreatEngravings(ctx,board'));
 assert.ok(mini.indexOf("paintFigureRelief(ctx,id,pose,'rear'")<mini.indexOf("paintArticulatedCloth(ctx,id,pose,'back')"));
 assert.ok(mini.indexOf("paintFigureRelief(ctx,id,pose,'finish'")<mini.indexOf("paintWeaponRig(ctx,id,pose)"));
 for(let row=0;row<board.rows;row++)for(let col=0;col<board.columns;col++){
  const rect=cellRect(board,col,row),material=getTile(row,col);
  if(!TILE_RELIEF_MATERIALS.includes(material))continue;
  assert.equal(paintTileRelief(ink(),rect,material,row,col),true);
 }
});
test('art remains in the Canvas, with no independent input, sound, storage, timer or network paths',()=>{
 for(const path of ['src/board/figure-relief.js','src/board/tile-relief.js']){
  const src=fs.readFileSync(path,'utf8');
  assert.doesNotMatch(src,/fetch\(|document\.|window\.|Math\.random\(|requestAnimationFrame|setInterval|localStorage|addEventListener|AudioContext/);
 }
 const sw=fs.readFileSync('service-worker.js','utf8');
 assert.match(sw,/v0\.09-gate-a18-r1/);
 assert.ok(sw.includes("'./src/board/visages.js'"),'character face art must be offline');
 assert.ok(sw.includes("'./src/board/figure-relief.js'"));
 assert.ok(sw.includes("'./src/board/tile-relief.js'"));
});
