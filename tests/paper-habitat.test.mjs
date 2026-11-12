import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {HABITAT_KINDS,HABITAT_EDGES,habitatPlan,paintPaperHabitat} from '../src/board/paper-habitat.js';
import {getTile,measureBoard} from '../src/board/geometry.js';
import {renderBoard} from '../src/board/scene.js';
import {startBattle} from '../src/battle/engine.js';
import {createCommandState,setMovementBoard} from '../src/commands/engine.js';

const board=measureBoard(440,290);
function ink(){
 const calls=[],ctx={calls,globalAlpha:1};
 for(const m of ['save','restore','beginPath','closePath','moveTo','lineTo','arc','rect',
  'clip','fill','stroke','fillRect','strokeRect','ellipse','translate','scale',
  'quadraticCurveTo','bezierCurveTo','setLineDash'])
  ctx[m]=(...a)=>calls.push([m,...a]);
 ctx.createLinearGradient=()=>({addColorStop(){}});
 ctx.createRadialGradient=()=>({addColorStop(){}});
 return ctx;
}
const balanced=ctx=>assert.equal(ctx.calls.filter(x=>x[0]==='save').length,ctx.calls.filter(x=>x[0]==='restore').length);
const p=(column,row)=>({column,row});
test('genuine water channels and moss clusters are fixed to terrain, never artificial targets',()=>{
 assert.deepEqual(HABITAT_KINDS,['water','moss']);
 assert.deepEqual(HABITAT_EDGES,['north','east','south','west']);
 const plan=habitatPlan(board,getTile);
 assert.equal(plan.length,9);
 assert.equal(plan.filter(x=>x.kind==='water').length,2);
 assert.equal(plan.filter(x=>x.kind==='moss').length,7);
 assert.ok(Object.isFrozen(plan)&&plan.every(Object.isFrozen));
 assert.deepEqual(plan,habitatPlan(board,getTile));
 assert.ok(plan.every(({row,column,kind})=>getTile(row,column)===kind));
 const unique=new Set(plan.map(x=>x.row+':'+x.column));
 assert.equal(unique.size,plan.length);
});
test('two stacked river cells form one physical cut-paper stream with continuous open ends',()=>{
 const p1=habitatPlan(board,getTile).find(x=>x.kind==='water'&&x.row===1);
 const p2=habitatPlan(board,getTile).find(x=>x.kind==='water'&&x.row===2);
 assert.equal(p1.column,5);assert.equal(p2.column,5);
 assert.deepEqual(p1.linked,['south']);
 assert.deepEqual(p2.linked,['north']);
 assert.ok(!p1.linked.includes('east')&&!p2.linked.includes('west'));
 assert.equal(p1.rect.y+p1.rect.height,p2.rect.y);
 assert.deepEqual(habitatPlan(null,getTile),[]);
 assert.deepEqual(habitatPlan(board,null),[]);
});
test('truly adjacent moss tiles connect their foliage through shared stems',()=>{
 const plan=habitatPlan(board,getTile);
 const first=plan.find(x=>x.row===1&&x.column===1);
 const next=plan.find(x=>x.row===1&&x.column===2);
 assert.ok(first.linked.includes('east')&&next.linked.includes('west'));
 assert.ok(plan.some(x=>x.kind==='moss'&&!x.linked.length),'isolated moss retains its unique foliage');
 assert.equal(first.quiet,false);
 assert.equal(next.quiet,false);
});
test('a real party miniature or living foe suppresses dense foliage without altering tiles',()=>{
 const occupied=[p(1,1),p(2,1),p(4,5),p(5,2)];
 const before=JSON.stringify(occupied),plan=habitatPlan(board,getTile,occupied);
 assert.equal(plan.filter(x=>x.quiet).length,3);
 assert.equal(plan.filter(x=>x.kind==='water'&&x.quiet).length,0,'water always remains continuous');
 assert.equal(getTile(1,1),'moss');
 assert.equal(paintPaperHabitat(ink(),board,getTile,occupied),6);
 assert.equal(paintPaperHabitat(ink(),board,getTile,[]),9);
 assert.equal(JSON.stringify(occupied),before);
 // The same blocked terrain and target-rule lookup stays unmodified.
 assert.equal(getTile(2,1),'rubble');
});
test('native paper painting is deterministic and balanced from 38px to 70px battlefield cells',()=>{
 for(const size of [38,44,52,70]){
  const b={...board,x:2,y:3,tile:size,mapWidth:8*size,mapHeight:6*size};
  for(const occupied of [[],[p(1,1),p(4,5)]]){
   const a=ink(),c=ink(),snapshot=JSON.stringify(occupied);
   assert.equal(paintPaperHabitat(a,b,getTile,occupied),occupied.length?7:9);
   assert.equal(paintPaperHabitat(c,b,getTile,occupied),occupied.length?7:9);
   assert.deepEqual(a.calls,c.calls);
   balanced(a);
   assert.ok(a.calls.some(x=>x[0]==='clip'));
   for(const cmd of a.calls.filter(x=>['moveTo','lineTo','arc'].includes(x[0]))){
    assert.ok(cmd[1]>=b.x&&cmd[1]<=b.x+b.mapWidth&&cmd[2]>=b.y&&cmd[2]<=b.y+b.mapHeight,
     'paper cutout escaped the stage '+size+' '+JSON.stringify(cmd));
   }
   assert.equal(JSON.stringify(occupied),snapshot);
  }
 }
});
test('each water and moss rendering plan stays strictly within its own logical cell',()=>{
 for(const kind of HABITAT_KINDS){
  const only=(row,col)=>row===1&&col===3?kind:'stone';
  const b=measureBoard(440,290),plan=habitatPlan(b,only);
  assert.equal(plan.length,1);
  const r=plan[0].rect,ctx=ink();
  assert.equal(paintPaperHabitat(ctx,b,only),1);
  for(const c of ctx.calls.filter(c=>['moveTo','lineTo','arc'].includes(c[0]))){
   assert.ok(c[1]>=r.x&&c[1]<=r.x+r.width&&c[2]>=r.y&&c[2]<=r.y+r.height,
    kind+' ink escaped one true tile');
  }
  balanced(ctx);
 }
});
test('real battle scene preserves game state and draws habitat before target/units',()=>{
 const state=startBattle(setMovementBoard(createCommandState(),{columns:board.columns,rows:board.rows}),
  {columns:board.columns,rows:board.rows});
 const original=JSON.stringify(state),ctx=ink();
 renderBoard(ctx,board,null,{actorId:state.actorId,positions:state.positions,targets:state.targets,
  partyHp:state.partyHp,guards:state.guards,intents:[],ended:state.ended},null);
 assert.ok(ctx.calls.length>800);balanced(ctx);
 assert.equal(JSON.stringify(state),original);
 const scene=fs.readFileSync('src/board/scene.js','utf8');
 const habitat=scene.indexOf('paintPaperHabitat(ctx,board,getTile,occupiedHabitat)');
 assert.ok(habitat>0);
 assert.ok(habitat<scene.indexOf('paintTargetIndicators(ctx,board'));
 assert.ok(habitat<scene.indexOf('drawHero(ctx,rect,id'));
 assert.ok(habitat<scene.indexOf('drawFoe(ctx,rect,foe'));
 assert.match(scene,/Object\.values\(overlay\?\.positions\?\?\{\}\)/);
});
test('new habitat art has no networking, interaction or independent animation clock',()=>{
 const source=fs.readFileSync('src/board/paper-habitat.js','utf8');
 assert.doesNotMatch(source,/window\.|document\.|fetch\(|Math\.random|requestAnimationFrame|setInterval|setTimeout|localStorage|addEventListener/);
 assert.equal(paintPaperHabitat(null,board,getTile),0);
 assert.equal(paintPaperHabitat(ink(),null,getTile),0);
 const worker=fs.readFileSync('service-worker.js','utf8');
 assert.ok(worker.includes('v0.09-gate-a22-r1'));
 assert.ok(worker.includes("'./src/board/paper-habitat.js'"));
 assert.equal(worker.split("'./src/board/paper-habitat.js'").length-1,1);
});
