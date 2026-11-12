import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {getTile,cellRect,measureBoard} from '../src/board/geometry.js';
import {WALK_COST,isWalkable,shortestPath} from '../src/movement/pathfinding.js';
import {glyphFolioPlan,paintGlyphFolio,paintGlyphFolios,
 GLYPH_FOLIO_STYLES,GLYPH_FOLIO_PALETTES} from '../src/board/glyph-folios.js';
import {computeTargetIndicators} from '../src/board/targeting.js';
import {createCommandState,setMovementBoard,chooseMove,chooseAbility,chooseTarget,
 remainingAp,remainingMove,changeActor} from '../src/commands/engine.js';
import {renderBoard} from '../src/board/scene.js';
import {startBattle} from '../src/battle/engine.js';
const board=measureBoard(435,286),logical={columns:8,rows:6};
const point=(column,row)=>({column,row});
const calls=()=>{
 const trace=[],ctx={calls:trace,globalAlpha:1};
 for(const op of ['save','restore','beginPath','closePath','moveTo','lineTo',
 'arc','ellipse','rect','clip','fill','stroke','fillRect','strokeRect',
 'translate','scale','rotate','setLineDash','quadraticCurveTo','bezierCurveTo'])
  ctx[op]=(...args)=>trace.push([op,...args]);
 ctx.createLinearGradient=()=>({addColorStop(){}});
 ctx.createRadialGradient=()=>({addColorStop(){}});
 return ctx;
};
const balanced=c=>assert.equal(c.calls.filter(a=>a[0]==='save').length,
 c.calls.filter(a=>a[0]==='restore').length);
test('three exact ACTUAL glyph sites each receive a different authored folio, not a loot ring',()=>{
 assert.deepEqual(GLYPH_FOLIO_STYLES,
  ['broken-astral-register','binder-tally','root-cipher']);
 const before=JSON.stringify(board),a=glyphFolioPlan(board,getTile),b=glyphFolioPlan(board,getTile);
 assert.deepEqual(a,b);assert.equal(JSON.stringify(board),before);assert.equal(a.length,3);
 assert.deepEqual(a.map(m=>[m.row,m.column]),[[0,3],[3,6],[5,0]]);
 assert.equal(new Set(a.map(m=>m.style)).size,3);
 assert.ok(a.every(m=>getTile(m.row,m.column)==='glyph'&&m.cost===1));
 assert.ok(Object.isFrozen(a)&&a.every(m=>Object.isFrozen(m)&&Object.isFrozen(m.rect)));
});
test('only authoritative material glyph generates art, never rubble, water, moss or fake preview',()=>{
 assert.deepEqual(glyphFolioPlan(null,getTile),[]);
 assert.deepEqual(glyphFolioPlan({...board,tile:0},getTile),[]);
 assert.deepEqual(glyphFolioPlan(board,null),[]);
 assert.deepEqual(glyphFolioPlan(board,()=> 'stone'),[]);
 const custom=(row,col)=>row===1&&col===2?'glyph':row===2&&col===2?'rubble':'stone';
 const a=glyphFolioPlan(board,custom);
 assert.equal(a.length,1);assert.deepEqual([a[0].row,a[0].column],[1,2]);
 assert.equal(a[0].style,'broken-astral-register');
});
test('three physical bookish objects have truly distinctive author-drawn geometries, not palette swaps',()=>{
 const signatures=[],paints=GLYPH_FOLIO_PALETTES;
 assert.equal(new Set(Object.values(paints).map(x=>x.lip)).size>=2,true);
 assert.ok(Object.values(paints).every(Object.isFrozen));
 for(const mark of glyphFolioPlan(board,getTile)){
  const a=calls(),b=calls(),before=JSON.stringify(mark);
  assert.equal(paintGlyphFolio(a,mark),true);
  assert.equal(paintGlyphFolio(b,mark),true);
  assert.deepEqual(a.calls,b.calls);assert.equal(JSON.stringify(mark),before);
  signatures.push(a.calls.filter(c=>['moveTo','lineTo','fill','stroke'].includes(c[0])));
  assert.ok(a.calls.filter(c=>c[0]==='fill').length>=4);
  assert.equal(a.calls.filter(c=>c[0]==='clip').length,1);
  assert.equal(a.calls.filter(c=>c[0]==='arc').length,0,'zero circular targeting marks');
  balanced(a);
 }
 assert.equal(new Set(signatures.map(JSON.stringify)).size,3);
 assert.equal(paintGlyphFolio(calls(),{style:'invented',rect:cellRect(board,3,0)}),false);
 assert.equal(paintGlyphFolio(null,glyphFolioPlan(board,getTile)[0]),false);
});
test('all original glyph strokes remain well WITHIN a tile, away from selectable cell corners',()=>{
 for(const size of [38,44,51,70]){
  const b={...board,tile:size,mapWidth:size*board.columns,mapHeight:size*board.rows};
  for(const mark of glyphFolioPlan(b,getTile)){
   const c=calls();assert.equal(paintGlyphFolio(c,mark),true);balanced(c);
   const {x,y,width:s}=mark.rect;
   for(const stroke of c.calls.filter(a=>a[0]==='moveTo'||a[0]==='lineTo')){
    const px=(stroke[1]-x)/s,py=(stroke[2]-y)/s;
    assert.ok(px>=.119&&px<=.881,'x marker crosses native glyph body margin');
    assert.ok(py>=.119&&py<=.881,'y marker crosses native glyph body margin');
   }
   assert.equal(c.calls.filter(a=>a[0]==='arc').length,0);
  }
 }
});
test('full original glyph source Canvas is deterministic at the three phone board cell sizes',()=>{
 for(const [w,h] of [[328,270],[435,286],[483,326]]){
  const b=measureBoard(w,h),a=calls(),repeat=calls();
  // Narrow 667px stage exposes only five rows at >=44px tap targets,
  // therefore row-five's third glyph is not on the REAL visible board.
  // The painter must render exactly the glyphs in visible whole cells.
  const expected=[[0,3],[3,6],[5,0]].filter(([row,col])=>
    row<b.rows&&col<b.columns);
  const count=glyphFolioPlan(b,getTile).length;
  assert.equal(count,expected.length);
  assert.deepEqual(glyphFolioPlan(b,getTile).map(p=>[p.row,p.column]),expected);
  assert.equal(paintGlyphFolios(a,b,getTile),count);
  assert.equal(paintGlyphFolios(repeat,b,getTile),count);
  assert.deepEqual(a.calls,repeat.calls);
  assert.ok(a.calls.length>45);balanced(a);
 }
 assert.equal(paintGlyphFolios(null,board,getTile),0);
 assert.equal(paintGlyphFolios(calls(),board,()=> 'stone'),0);
});
test('gold target-looking circle is removed in ALL THREE former terrain artists',()=>{
 const scene=fs.readFileSync('src/board/scene.js','utf8');
 const atelier=fs.readFileSync('src/board/atelier.js','utf8');
 const relief=fs.readFileSync('src/board/relief.js','utf8');
 assert.ok(!scene.includes('function drawGlyph('));
 assert.ok(!scene.includes("else if(kind==='glyph')drawGlyph("));
 assert.ok(!scene.includes("if(kind==='glyph'){"));
 const tileGlyph=atelier.slice(atelier.indexOf('function glyph('),atelier.indexOf('export function paintAtelierTile'));
 assert.ok(tileGlyph.includes('outline('));
 assert.ok(!tileGlyph.includes('arc('));
 assert.ok(!tileGlyph.includes('Math.PI'));
 const reliefGlyph=relief.slice(relief.indexOf("if(kind==='glyph')"),relief.indexOf("if(kind==='glyph')")+400);
 assert.ok(reliefGlyph.includes('stroke('));
 assert.ok(!reliefGlyph.includes('arc('));
});
test('genuine struck terrain still costs one movement, and no world geometry changed',()=>{
 assert.equal(WALK_COST.glyph,1);
 const candidates=[point(3,0),point(6,3),point(0,5)];
 for(const p of candidates){
  assert.equal(getTile(p.row,p.column),'glyph');
  assert.equal(isWalkable(logical,p),true);
  assert.ok(cellRect(board,p.column,p.row));
 }
 const route=shortestPath(logical,point(2,0),point(3,0),{},'captain');
 assert.equal(route.found,true);assert.equal(route.cost,1);
 const game=setMovementBoard(createCommandState(),logical),before=JSON.stringify(game);
 const actor=changeActor(game,'mirelle'),preview=chooseTarget(chooseMove(actor),point(6,3),logical);
 assert.equal(remainingAp(actor),2);assert.equal(remainingMove(actor),5);
 assert.equal(JSON.stringify(game),before);assert.ok(preview.preview);
});
test('only ability/attack logic makes gold legal-target corners, manuscript art never does',()=>{
 const start=startBattle(setMovementBoard(createCommandState(),logical),logical);
 const ability=chooseAbility(changeActor(start,'kess'),'spark');
 const before=JSON.stringify(ability),legal=computeTargetIndicators(ability,logical);
 assert.ok(legal.length>0&&legal.every(m=>m.kind==='enemy'));
 const glow=calls(),folio=calls();
 assert.equal(paintGlyphFolios(folio,board,getTile),3);
 assert.equal(folio.calls.filter(x=>x[0]==='arc').length,0);
 assert.equal(JSON.stringify(ability),before);
 assert.ok(legal.some(x=>x.point.column===ability.targets.briar.position.column));
});
test('new source art lives after world relief yet below all actual legal marks and both parties',()=>{
 const scene=fs.readFileSync('src/board/scene.js','utf8');
 const at=scene.indexOf('paintGlyphFolios(ctx,board,getTile)');
 assert.ok(at>0);
 assert.ok(scene.indexOf('paintWorldRelief(ctx,board,getTile)')<at);
 for(const owner of ['paintTargetIndicators(ctx,board','paintTravelEngraving(ctx,board',
  'drawHero(ctx,rect,id','drawFoe(ctx,rect,foe'])
  assert.ok(at<scene.indexOf(owner),owner);
 assert.ok(scene.includes("import {paintGlyphFolios} from './glyph-folios.js';"));
});
test('real full 4v2 scene, state and painter stacks are unchanged by invented glyph history',()=>{
 const state=startBattle(setMovementBoard(createCommandState(),logical),logical),before=JSON.stringify(state);
 const ink=calls();
 renderBoard(ink,board,null,{actorId:state.actorId,positions:state.positions,targets:state.targets,
  partyHp:state.partyHp,guards:state.guards,intents:[]});
 assert.equal(JSON.stringify(state),before);
 assert.ok(ink.calls.length>1400);
 balanced(ink);
});
test('safe offline cache includes the new pure file exactly once; no new clocks, input or network',()=>{
 const source=fs.readFileSync('src/board/glyph-folios.js','utf8'),sw=fs.readFileSync('service-worker.js','utf8');
 for(const banned of ['Math.random','setTimeout','setInterval','fetch(','requestAnimationFrame',
  'document.','window.','localStorage','AudioContext','addEventListener'])
  assert.ok(!source.includes(banned),banned);
 assert.ok(sw.includes('v0.09-gate-a30-r1'));
 assert.equal(sw.split("'./src/board/glyph-folios.js'").length-1,1);
 assert.ok(!sw.includes('skipWaiting('));
});
