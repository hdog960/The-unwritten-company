import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {getTile,cellRect,measureBoard} from '../src/board/geometry.js';
import {habitatPlan,paintPaperHabitat,physicalHabitatCells} from '../src/board/paper-habitat.js';
import {renderBoard} from '../src/board/scene.js';
import {createCommandState,setMovementBoard,chooseMove,chooseTarget,confirmPreview,changeActor,remainingAp} from '../src/commands/engine.js';
const board=measureBoard(440,290),p=(column,row)=>({column,row});
const walk=t=>({event:{kind:'move',actorId:'kess',path:[p(1,1),p(2,1)],from:p(1,1),to:p(2,1)},progress:t});
const cells=t=>physicalHabitatCells(board,{kess:p(2,1)},{},walk(t));
const tags=list=>list.map(({column,row})=>row+':'+column);
function ink(){const calls=[],ctx={calls,globalAlpha:1};for(const op of ['save','restore','beginPath','closePath','moveTo','lineTo','arc','rect','clip','fill','stroke','fillRect','strokeRect','ellipse','translate','scale','rotate','setLineDash','quadraticCurveTo','bezierCurveTo'])ctx[op]=(...args)=>calls.push([op,...args]);ctx.createLinearGradient=()=>({addColorStop(){}});ctx.createRadialGradient=()=>({addColorStop(){}});return ctx;}
const balanced=ctx=>assert.equal(ctx.calls.filter(c=>c[0]==='save').length,ctx.calls.filter(c=>c[0]==='restore').length);
test('the occupancy computation is immutable, deterministic and rejects invalid positions',()=>{
 assert.deepEqual(physicalHabitatCells(null,{}),[]);
 assert.deepEqual(physicalHabitatCells({...board,tile:0},{}),[]);
 const src={captain:p(1,1),unknown:p(-8,2),bad:{column:1.2,row:2}},before=JSON.stringify(src);
 const a=physicalHabitatCells(board,src),b=physicalHabitatCells(board,src);
 assert.deepEqual(a,[p(1,1)]);assert.deepEqual(a,b);
 assert.ok(Object.isFrozen(a)&&a.every(Object.isFrozen));
 assert.equal(JSON.stringify(src),before);
});
test('a real moving figure parts the TRUE current moss rather than future confirmed destination',()=>{
 assert.deepEqual(cells(0),[p(1,1)]);
 assert.deepEqual(new Set(tags(cells(.5))),new Set(['1:1','1:2']));
 assert.deepEqual(cells(1),[p(2,1)]);
 assert.equal(tags(cells(0)).includes('1:2'),false);
});
test('idle movement preview, miss, unrelated actor motion cannot clear false route cells',()=>{
 const goal={kess:p(2,1)},preview={mode:'movement',progress:.5,preview:{path:[p(1,1),p(2,1)]}};
 assert.deepEqual(physicalHabitatCells(board,goal,{},preview),[p(2,1)]);
 assert.deepEqual(physicalHabitatCells(board,goal,{}, {event:{kind:'miss'},progress:.5}),[p(2,1)]);
 assert.deepEqual(physicalHabitatCells(board,goal,{}, {event:{kind:'move',actorId:'captain',path:[p(1,1),p(2,1)]},progress:.5}),[p(2,1)]);
});
test('true multi-step movement follows actual elbows and never cuts a diagonal',()=>{
 const path=[p(1,1),p(2,1),p(2,2)],frame=t=>({event:{kind:'move',actorId:'captain',path},progress:t});
 const occupied=t=>physicalHabitatCells(board,{captain:p(2,2)},{},frame(t));
 assert.deepEqual(occupied(0),[p(1,1)]);assert.deepEqual(occupied(.5),[p(2,1)]);
 assert.ok(occupied(.25).every(x=>x.row===1));
 assert.ok(occupied(.75).every(x=>x.column===2));
 assert.deepEqual(occupied(1),[p(2,2)]);
});
test('living enemies part moss, dead foes do not; occupied positions never duplicate',()=>{
 const enemies={briar:{hp:10,position:p(1,1)},shade:{hp:0,position:p(2,1)}};
 assert.deepEqual(physicalHabitatCells(board,{captain:p(1,1)},enemies),[p(1,1)]);
 assert.deepEqual(physicalHabitatCells(board,{},enemies),[p(1,1)]);
 assert.deepEqual(physicalHabitatCells(board,{}, {shade:{hp:-1,position:p(1,1)}}),[]);
});
test('actual frame changes the rendered moss parting without removing genuine water',()=>{
 const at=t=>habitatPlan(board,getTile,cells(t));
 const quiet=t=>at(t).filter(x=>x.kind==='moss'&&x.quiet).map(x=>x.row+':'+x.column);
 assert.deepEqual(quiet(0),['1:1']);assert.deepEqual(quiet(.5),['1:1','1:2']);assert.deepEqual(quiet(1),['1:2']);
 assert.equal(at(.5).filter(x=>x.kind==='water'&&x.quiet).length,0);
});
test('occupied moss retains physically folded edge-paint but the inner figure stays uncluttered',()=>{
 const only=(row,col)=>row===1&&col===1?'moss':'stone';
 const r=cellRect(board,1,1),occupied=ink(),full=ink();
 assert.equal(paintPaperHabitat(occupied,board,only,[p(1,1)]),0);
 assert.equal(paintPaperHabitat(full,board,only,[]),1);
 assert.ok(occupied.calls.length>15&&occupied.calls.length<full.calls.length);
 for(const c of occupied.calls.filter(x=>x[0]==='moveTo'||x[0]==='lineTo')){
  const x=(c[1]-r.x)/r.width,y=(c[2]-r.y)/r.width;
  assert.ok(x>=0&&x<=1&&y>=0&&y<=1);
  assert.ok(x<=.24||x>=.76||y<=.24||y>=.76,'central physical figure space must be clear');
 }
 balanced(occupied);balanced(full);
});
test('premium moss relief is deterministic with correct dense-vs-parted counts at 38–70px',()=>{
 for(const size of [38,44,51,70]){
  const b={...board,tile:size,mapWidth:board.columns*size,mapHeight:board.rows*size};
  const a=ink(),repeat=ink(),parted=ink();
  assert.equal(paintPaperHabitat(a,b,getTile),9);
  assert.equal(paintPaperHabitat(repeat,b,getTile),9);
  assert.deepEqual(a.calls,repeat.calls);
  assert.equal(paintPaperHabitat(parted,b,getTile,[p(1,1),p(2,1)]),7);
  assert.ok(a.calls.length>parted.calls.length);
  balanced(a);balanced(parted);
 }
});
test('real reducer move preserves AP, targets and complete battle state while plants part',()=>{
 const logical={columns:8,rows:6};let s=changeActor(setMovementBoard(createCommandState(),logical),'mirelle');
 const from=s.positions.mirelle,to=p(from.column,from.row-1);
 const planned=chooseTarget(chooseMove(s),to,logical);assert.equal(planned.preview.valid,true);
 s=confirmPreview(planned,logical);assert.equal(s.visualEvent.kind,'move');
 const before=JSON.stringify(s),ap=remainingAp(s);
 for(const progress of [0,.25,.5,.75,1]){
  const points=physicalHabitatCells(board,s.positions,s.targets,{event:s.visualEvent,progress});
  assert.ok(points.length>=4);
 }
 assert.equal(JSON.stringify(s),before);assert.equal(remainingAp(s),ap);
});
test('real scene composes physical foliage before authoritative marks and miniatures',()=>{
 const s=setMovementBoard(createCommandState(),{columns:8,rows:6});
 const before=JSON.stringify(s),ctx=ink(),source=fs.readFileSync('src/board/scene.js','utf8');
 renderBoard(ctx,board,null,{actorId:s.actorId,positions:s.positions,targets:s.targets,partyHp:s.partyHp,guards:s.guards,intents:[]});
 balanced(ctx);assert.equal(JSON.stringify(s),before);
 assert.ok(source.indexOf('physicalHabitatCells(')<source.indexOf('paintPaperHabitat(ctx,board,getTile,occupiedHabitat)'));
 assert.ok(source.indexOf('paintPaperHabitat(ctx,board,getTile,occupiedHabitat)')<source.indexOf('paintTargetIndicators(ctx,board'));
 assert.ok(source.indexOf('paintPaperHabitat(ctx,board,getTile,occupiedHabitat)')<source.indexOf('drawHero(ctx,rect,id'));
});
test('all physical art remains offline with zero new network, input, storage or clock',()=>{
 const source=fs.readFileSync('src/board/paper-habitat.js','utf8'),sw=fs.readFileSync('service-worker.js','utf8');
 for(const term of ['fetch(','Math.random','setTimeout','setInterval','requestAnimationFrame','localStorage','window.','document.','addEventListener'])assert.ok(!source.includes(term),term);
 assert.ok(sw.includes('v0.09-gate-a29-r1'));
 assert.equal(sw.split("'./src/board/paper-habitat.js'").length-1,1);
 assert.equal(sw.split("'./src/board/motion.js'").length-1,1);
 assert.ok(!sw.includes('skipWaiting('));
});
