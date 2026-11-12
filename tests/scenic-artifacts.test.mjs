import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {measureBoard,getTile} from '../src/board/geometry.js';
import {SCENERY_DESIGNS,SCENERY_MATERIALS,scenicAnchors,scenicArtifactPlan,
 paintScenicArtifact,paintFloorVignettes} from '../src/board/scenery.js';
import {physicalHabitatCells} from '../src/board/paper-habitat.js';
import {renderBoard} from '../src/board/scene.js';
import {setMovementBoard,createCommandState,chooseMove,chooseTarget,confirmPreview,remainingAp,remainingMove,changeActor} from '../src/commands/engine.js';

const board=measureBoard(440,290),logical={columns:8,rows:6},p=(column,row)=>({column,row});
const key=o=>o.row+':'+o.column;
function ink(){
 const calls=[],ctx={calls,globalAlpha:1};
 for(const name of ['beginPath','closePath','moveTo','lineTo','arc','ellipse','rect','clip',
 'fill','stroke','save','restore','fillRect','strokeRect','translate','scale','rotate',
 'setLineDash','quadraticCurveTo','bezierCurveTo'])ctx[name]=(...args)=>calls.push([name,...args]);
 ctx.createLinearGradient=()=>({addColorStop(){}});
 ctx.createRadialGradient=()=>({addColorStop(){}});
 return ctx;
}
const balanced=ctx=>assert.equal(ctx.calls.filter(c=>c[0]==='save').length,
 ctx.calls.filter(c=>c[0]==='restore').length);
const move=t=>({event:{kind:'move',actorId:'captain',path:[p(2,0),p(3,0)],
 from:p(2,0),to:p(3,0),token:'actual-committed'},progress:t});
test('four ACTUAL native original Inkfall relics have unrelated shapes and materials, no fake loot/targets',()=>{
 assert.deepEqual(SCENERY_DESIGNS,['inkfall-seal','map-fragment','candlemark','vine-crest']);
 assert.equal(new Set(Object.values(SCENERY_MATERIALS).map(m=>m.kind)).size,4);
 assert.ok(Object.values(SCENERY_MATERIALS).every(Object.isFrozen));
 const anchors=scenicAnchors(board);
 assert.equal(anchors.length,4);
 assert.deepEqual(anchors.map(x=>[x.type,x.column,x.row]),[
  ['inkfall-seal',3,0],['map-fragment',0,3],['candlemark',7,5],['vine-crest',4,5]]);
 assert.ok(anchors.every(x=>getTile(x.row,x.column)!=='rubble'));
});
test('pure original physical artifact plan is immutable, deterministic and safely validates unusual boards',()=>{
 const plain=scenicArtifactPlan(board),again=scenicArtifactPlan(board),before=JSON.stringify(board);
 assert.deepEqual(plain,again);assert.equal(plain.length,4);
 assert.equal(JSON.stringify(board),before);
 assert.ok(Object.isFrozen(plain)&&plain.every(Object.isFrozen)&&plain.every(x=>Object.isFrozen(x.rect)));
 assert.equal(new Set(plain.map(x=>x.kind)).size,4);
 assert.deepEqual(scenicArtifactPlan(null),[]);
 assert.deepEqual(scenicArtifactPlan({...board,tile:0}),[]);
 assert.deepEqual(scenicAnchors(null),[]);
 assert.equal(scenicAnchors({...board,columns:4,rows:3}).length>=2,true);
});
test('world artwork is suppressed only by true occupied tiles, using both list and legacy actor maps',()=>{
 const anchors=scenicAnchors(board);
 const occupied=[anchors[0],anchors[2],{column:-1,row:2},{column:3.5,row:0},null];
 const list=scenicArtifactPlan(board,occupied),legacy=scenicArtifactPlan(board,{captain:anchors[0],briar:anchors[2]});
 assert.deepEqual(list,legacy);assert.equal(list.length,2);
 assert.ok(list.every(a=>a.type==='map-fragment'||a.type==='vine-crest'));
 assert.equal(paintFloorVignettes(ink(),board,Object.fromEntries(anchors.map((x,i)=>['a'+i,x]))),0);
});
test('floor relief remains visible on origin, clears only physical moving body and not future destination',()=>{
 const at=t=>physicalHabitatCells(board,{captain:p(3,0)},{},move(t));
 const relics=t=>scenicArtifactPlan(board,at(t));
 assert.ok(relics(0).some(x=>x.type==='inkfall-seal'));
 assert.ok(relics(.5).every(x=>x.type!=='inkfall-seal'));
 assert.ok(relics(1).every(x=>x.type!=='inkfall-seal'));
 assert.equal(at(0).some(x=>key(x)==='0:3'),false);
 assert.equal(at(.5).some(x=>key(x)==='0:3'),true);
});
test('a bare/canceled preview cannot physically suppress an otherwise walkable site',()=>{
 const claimed={captain:p(3,0)};
 const noEvent=physicalHabitatCells(board,claimed,{},null);
 const phantom=physicalHabitatCells(board,claimed,{}, {mode:'movement',
 preview:{valid:true,path:[p(2,0),p(3,0)]},progress:0});
 assert.deepEqual(noEvent,phantom);
 assert.equal(scenicArtifactPlan(board,phantom).some(x=>x.type==='inkfall-seal'),false);
 const atStart=physicalHabitatCells(board,claimed,{},move(0));
 assert.equal(scenicArtifactPlan(board,atStart).some(x=>x.type==='inkfall-seal'),true);
});
test('living foes hide world artifacts on actual occupied cells; dead foes reveal art',()=>{
 const target={briar:{id:'briar',hp:12,position:p(7,5)}};
 const present=physicalHabitatCells(board,{},target);
 assert.equal(scenicArtifactPlan(board,present).some(x=>x.type==='candlemark'),false);
 const dead=physicalHabitatCells(board,{}, {briar:{...target.briar,hp:0}});
 assert.equal(scenicArtifactPlan(board,dead).some(x=>x.type==='candlemark'),true);
});
test('all four original cutouts paint DIFFERENT physically stacked source patterns',()=>{
 const signatures=[];
 for(const a of scenicArtifactPlan(board)){
  const c=ink(),d=ink();assert.equal(paintScenicArtifact(c,a),true);
  assert.equal(paintScenicArtifact(d,a),true);
  balanced(c);assert.deepEqual(c.calls,d.calls);signatures.push(JSON.stringify(c.calls));
  assert.ok(c.calls.filter(x=>x[0]==='fill').length>=3);
  assert.equal(c.calls.filter(x=>x[0]==='clip').length,1);
  const r=a.rect;
  for(const line of c.calls.filter(x=>x[0]==='moveTo'||x[0]==='lineTo')){
   const x=(line[1]-r.x)/r.width,y=(line[2]-r.y)/r.width;
   assert.ok(x>=.10-1e-5&&x<=.90+1e-5,'art stays inside actual tile margins');
   assert.ok(y>=.10-1e-5&&y<=.90+1e-5,'art stays inside actual tile margins');
  }
 }
 assert.equal(new Set(signatures).size,4);
 assert.equal(paintScenicArtifact(null,scenicArtifactPlan(board)[0]),false);
});
test('source Canvas at 38, 44, 51, 70px stays deterministic and inside real mini-cell clips',()=>{
 for(const size of [38,44,51,70]){
  const b={...board,tile:size,mapWidth:board.columns*size,mapHeight:board.rows*size};
  const a=ink(),c=ink(),quiet=ink();
  assert.equal(paintFloorVignettes(a,b),4);
  assert.equal(paintFloorVignettes(c,b),4);
  assert.deepEqual(a.calls,c.calls);
  assert.equal(paintFloorVignettes(quiet,b,[p(3,0)]),3);
  assert.ok(a.calls.length>quiet.calls.length);balanced(a);balanced(quiet);
 }
});
test('inlays are non-interactive world paint below ALL genuine target selection and miniatures',()=>{
 const src=fs.readFileSync('src/board/scene.js','utf8');
 const index=src.indexOf('paintFloorVignettes(ctx,board,occupiedHabitat)');
 assert.ok(index>0);
 assert.ok(src.indexOf('physicalHabitatCells(')<index);
 assert.ok(index<src.indexOf('paintTargetIndicators(ctx,board'));
 assert.ok(index<src.indexOf('paintThreatEngravings(ctx,board'));
 assert.ok(index<src.indexOf('drawHero(ctx,rect,id'));
 assert.ok(index<src.indexOf('drawFoe(ctx,rect,foe'));
 assert.ok(!src.includes('vignetteOccupants='));
});
test('source image can NOT mutate actual 4v2 positions, AP/MP, targeting or battle state',()=>{
 const state=setMovementBoard(createCommandState(),logical);
 const before=JSON.stringify(state),c=ink();
 renderBoard(c,board,null,{actorId:state.actorId,positions:state.positions,
  targets:state.targets,partyHp:state.partyHp,guards:state.guards,intents:[]});
 assert.equal(JSON.stringify(state),before);balanced(c);
 const initial=changeActor(state,'mirelle'),from=initial.positions.mirelle;
 const goal=p(from.column,from.row-1),preview=chooseTarget(chooseMove(initial),goal,logical);
 assert.equal(preview.preview.valid,true);
 const moved=confirmPreview(preview,logical),ap=remainingAp(moved),mp=remainingMove(moved);
 const frozen=JSON.stringify(moved);
 for(const t of [0,.25,.5,.75,1]){
  const cells=physicalHabitatCells(board,moved.positions,moved.targets,
    {event:moved.visualEvent,progress:t});
  scenicArtifactPlan(board,cells);
 }
 assert.equal(remainingAp(moved),ap);assert.equal(remainingMove(moved),mp);
 assert.equal(JSON.stringify(moved),frozen);
});
test('all four assets are offline pure drawing with no timers, random, network, event handlers or fake actionable rings',()=>{
 const source=fs.readFileSync('src/board/scenery.js','utf8'),sw=fs.readFileSync('service-worker.js','utf8');
 for(const s of ['Math.random','fetch(','window.','document.','setTimeout','setInterval',
  'requestAnimationFrame','localStorage','AudioContext','addEventListener'])assert.ok(!source.includes(s),s);
 assert.ok(!source.includes('strokeRect('));
 assert.ok(!source.includes('targetIndicators'));
 assert.ok(sw.includes('v0.09-gate-a30-r1'));
 assert.equal(sw.split("'./src/board/scenery.js'").length-1,1);
 assert.ok(!sw.includes('skipWaiting('));
});
