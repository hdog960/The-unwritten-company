import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {measureBoard,cellRect,getTile} from '../src/board/geometry.js';
import {WALK_COST,shortestPath} from '../src/movement/pathfinding.js';
import {routeTicketPlan,paintRouteTickets,ROUTE_COST_MATERIALS,ROUTE_TICKET_PALETTES} from '../src/board/route-tickets.js';
import {paintTravelEngraving} from '../src/board/battle-engraving.js';
import {renderBoard} from '../src/board/scene.js';
import {setMovementBoard,createCommandState,chooseMove,chooseTarget,confirmPreview,remainingAp,remainingMove,changeActor} from '../src/commands/engine.js';
const board=measureBoard(440,290),logical={columns:8,rows:6},p=(column,row)=>({column,row});
function context(){const calls=[],c={calls,globalAlpha:1};
 for(const op of ['save','restore','beginPath','closePath','moveTo','lineTo','arc','rect','clip','fill','stroke','fillRect','strokeRect','ellipse','translate','scale','rotate','setLineDash','quadraticCurveTo','bezierCurveTo'])c[op]=(...args)=>calls.push([op,...args]);
 c.createLinearGradient=()=>({addColorStop(){}});c.createRadialGradient=()=>({addColorStop(){}});return c;}
const balanced=c=>assert.equal(c.calls.filter(x=>x[0]==='save').length,c.calls.filter(x=>x[0]==='restore').length);
const route=(path,cost,valid=true)=>({mode:'movement',origin:path[0],target:path.at(-1),evaluation:{path,cost,valid}});
test('all four genuine passable terrain materials have original paint patterns and engine costs',()=>{
 assert.deepEqual(ROUTE_COST_MATERIALS,['stone','moss','water','glyph']);
 assert.deepEqual(ROUTE_COST_MATERIALS.map(id=>WALK_COST[id]),[1,1,2,1]);
 assert.equal(new Set(Object.values(ROUTE_TICKET_PALETTES).map(x=>x.sheet)).size,4);
 assert.ok(Object.values(ROUTE_TICKET_PALETTES).every(Object.isFrozen));
});
test('real water entry is two physical tick-stamps, onward stone is exactly one',()=>{
 const path=[p(4,1),p(5,1),p(6,1)],o=route(path,3);
 const before=JSON.stringify(o),plan=routeTicketPlan(board,o);
 assert.equal(plan.length,2);assert.equal(plan[0].material,'water');
 assert.deepEqual(plan.map(x=>[x.kind,x.cost,x.total,x.available]),[['double',2,2,true],['single',1,3,true]]);
 assert.equal(JSON.stringify(o),before);assert.ok(Object.isFrozen(plan)&&plan.every(Object.isFrozen));
 assert.equal(getTile(1,5),'water');assert.equal(getTile(1,6),'stone');
});
test('moss and glyph entries are one movement; ticket direction remains actual orthogonal bearing',()=>{
 const moss=routeTicketPlan(board,route([p(0,1),p(1,1),p(2,1)],2));
 assert.deepEqual(moss.map(x=>x.material),['moss','moss']);
 assert.deepEqual(moss.map(x=>x.bearing),[{dx:1,dy:0},{dx:1,dy:0}]);
 const glyph=routeTicketPlan(board,route([p(2,0),p(3,0)],1));
 assert.equal(glyph.length,1);assert.equal(glyph[0].material,'glyph');
 assert.equal(glyph[0].cost,1);assert.equal(glyph[0].kind,'single');
});
test('no fabricated tickets for idle, no preview, malformed route, rubble, diagonal, outside board or cost mismatch',()=>{
 const malformed=[
 null,{}, {mode:'ability'}, {mode:'movement'},route([p(0,0)],0),
 route([p(0,0),p(1,1)],1),route([p(0,2),p(1,2)],1),
 route([p(4,1),p(5,1)],1),route([p(4,1),p(5,1)],3),
 route([p(7,0),p(8,0)],1),
 {...route([p(4,1),p(5,1)],2),origin:p(3,1)},
 {...route([p(4,1),p(5,1)],2),target:p(4,0)}
 ];
 for(const bad of malformed)assert.deepEqual(routeTicketPlan(board,bad),[]);
 assert.deepEqual(routeTicketPlan(null,route([p(0,0),p(1,0)],1)),[]);
});
test('over-budget true route keeps honest cost but changes physical ticket shapes, never falsely signals valid',()=>{
 const good=route([p(4,1),p(5,1),p(6,1)],3,true);
 const bad=route([p(4,1),p(5,1),p(6,1)],3,false);
 assert.deepEqual(routeTicketPlan(board,bad).map(x=>x.available),[false,false]);
 const a=context(),b=context();
 assert.equal(paintRouteTickets(a,board,good),2);assert.equal(paintRouteTickets(b,board,bad),2);
 assert.notDeepEqual(a.calls,b.calls);balanced(a);balanced(b);
});
test('one- and two-cost original ink drawing are different at every native phone cell size',()=>{
 for(const size of [38,44,51,70]){
  const b={...board,tile:size,mapWidth:size*board.columns,mapHeight:size*board.rows};
  const one=route([p(1,0),p(2,0)],1);
  const two=route([p(4,1),p(5,1)],2);
  const a=context(),a2=context(),water=context();
  assert.equal(paintRouteTickets(a,b,one),1);
  assert.equal(paintRouteTickets(a2,b,one),1);
  assert.equal(paintRouteTickets(water,b,two),1);
  assert.deepEqual(a.calls,a2.calls);assert.notDeepEqual(a.calls,water.calls);
  assert.ok(water.calls.filter(x=>x[0]==='stroke').length>a.calls.filter(x=>x[0]==='stroke').length);
  for(const ink of [a,water]){
   balanced(ink);assert.equal(ink.calls.filter(x=>x[0]==='clip').length,1);
   assert.equal(ink.calls.filter(x=>x[0]==='rect').length,1);
  }
 }
});
test('cost ticket footprint remains inside genuine tile at 38, 44, 51, 70 px, away from legal corners',()=>{
 for(const size of [38,44,51,70]){
  const b={...board,tile:size,mapWidth:size*board.columns,mapHeight:size*board.rows};
  const target=p(5,1),rect=cellRect(b,target.column,target.row),c=context();
  paintRouteTickets(c,b,route([p(4,1),target],2));
  const minX=rect.x+size*.10,maxX=rect.x+size*.43;
  const minY=rect.y+size*.64,maxY=rect.y+size*.95;
  for(const command of c.calls.filter(x=>['moveTo','lineTo'].includes(x[0]))){
   assert.ok(command[1]>=minX-1e-6&&command[1]<=maxX+1e-6);
   assert.ok(command[2]>=minY-1e-6&&command[2]<=maxY+1e-6);
  }
  balanced(c);
 }
});
test('source painter uses only authoritative movement path, and original route costs remain unchanged',()=>{
 let state=setMovementBoard(createCommandState(),logical);
 state=changeActor(state,'kess');const from=state.positions.kess,target=p(5,1);
 assert.deepEqual(from,p(6,1));const preview=chooseTarget(chooseMove(state),target,logical);
 assert.equal(preview.preview.valid,true);assert.equal(preview.preview.cost,2);
 const binding=routeTicketPlan(board,{mode:'movement',origin:from,target,evaluation:preview.preview});
 assert.equal(binding.length,1);assert.equal(binding[0].cost,2);
 const stateBefore=JSON.stringify(state),previewBefore=JSON.stringify(preview),ap=remainingAp(state);
 const ink=context();assert.equal(paintTravelEngraving(ink,board,{mode:'movement',origin:from,target,evaluation:preview.preview}),true);
 assert.equal(JSON.stringify(state),stateBefore);assert.equal(JSON.stringify(preview),previewBefore);assert.equal(remainingAp(state),ap);
 const moved=confirmPreview(preview,logical);
 assert.equal(remainingAp(moved),ap);assert.equal(remainingMove(moved),3);
 assert.deepEqual(moved.positions.kess,target);
});
test('painting never depends on true random timing, DOM, extra controls, fetch or saves',()=>{
 const source=fs.readFileSync('src/board/route-tickets.js','utf8');
 for(const x of ['Math.random','fetch(','window.','document.','setTimeout','setInterval','requestAnimationFrame','localStorage','AudioContext','addEventListener'])assert.ok(!source.includes(x),x);
 const worker=fs.readFileSync('service-worker.js','utf8');
 assert.ok(worker.includes('v0.09-gate-a31-r1'));
 assert.equal(worker.split("'./src/board/route-tickets.js'").length-1,1);
 assert.ok(!worker.includes('skipWaiting('));
});
test('all tickets render beneath native characters, legal target corners and live combat without a gameplay mutation',()=>{
 const source=fs.readFileSync('src/board/battle-engraving.js','utf8'),scene=fs.readFileSync('src/board/scene.js','utf8');
 assert.ok(source.includes('paintRouteTickets(ctx,board,overlay)'));
 assert.ok(scene.indexOf('paintTravelEngraving(ctx,board,overlay)')<scene.indexOf('drawHero(ctx,rect,id'));
 assert.ok(scene.indexOf('paintTravelEngraving(ctx,board,overlay)')<scene.indexOf('drawFoe(ctx,rect,foe'));
 const battle=setMovementBoard(createCommandState(),logical),before=JSON.stringify(battle),ink=context();
 const r=route([p(4,1),p(5,1),p(6,1)],3);
 renderBoard(ink,board,null,{mode:'movement',origin:r.origin,target:r.target,evaluation:r.evaluation,actorId:battle.actorId,positions:battle.positions,targets:battle.targets,partyHp:battle.partyHp,guards:battle.guards,intents:[]});
 balanced(ink);assert.equal(JSON.stringify(battle),before);
});
