import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {FOOTFALL_IDS,FOOTFALL_MATERIALS,movementDirection,footfallPlan,paintFootfall,paintRealFootfalls} from '../src/board/paper-footfalls.js';
import {miniaturePose,renderBoard} from '../src/board/scene.js';
import {figureBeat} from '../src/board/combat-beats.js';
import {foldedShadowProfile} from '../src/board/paper-puppets.js';
import {animatedHeroRect} from '../src/board/motion.js';
import {measureBoard,cellRect} from '../src/board/geometry.js';
import {createCommandState,setMovementBoard,chooseMove,chooseTarget,confirmPreview,changeActor} from '../src/commands/engine.js';
import {startBattle} from '../src/battle/engine.js';

const board=measureBoard(440,290);
const pt=(column,row)=>({column,row});
const actual=pt(3,2);
const path=[pt(1,1),pt(2,1),pt(2,2),actual];
const move=(progress,actorId='kess',route=path)=>({event:{kind:'move',actorId,from:route[0],to:route.at(-1),path:route,token:'committed-action'},progress});
function ctx(){
 const calls=[],c={calls,globalAlpha:1};
 for(const k of ['save','restore','beginPath','closePath','moveTo','lineTo','arc',
  'rect','clip','fill','stroke','fillRect','strokeRect','ellipse','translate','scale','rotate','setLineDash','quadraticCurveTo','bezierCurveTo'])c[k]=(...x)=>calls.push([k,...x]);
 c.createLinearGradient=()=>({addColorStop(){}});
 c.createRadialGradient=()=>({addColorStop(){}});
 return c;
}
const balanced=c=>assert.equal(c.calls.filter(v=>v[0]==='save').length,c.calls.filter(v=>v[0]==='restore').length);

test('four physically distinct boot, plate, leaf and scholar-footfall illustrations exist',()=>{
 assert.deepEqual(FOOTFALL_IDS,['captain','brunna','kess','mirelle']);
 assert.deepEqual(FOOTFALL_IDS.map(id=>FOOTFALL_MATERIALS[id].type),['boot','plate','leaf','folio']);
 assert.equal(new Set(FOOTFALL_IDS.map(id=>FOOTFALL_MATERIALS[id].ink)).size,4);
 for(const id of FOOTFALL_IDS)assert.ok(Object.isFrozen(FOOTFALL_MATERIALS[id]));
});
test('no footprints for preview, idle, attacks, invalid or inconsistent uncommitted routes',()=>{
 const examples=[
  null,{}, {event:{kind:'hit',actorId:'kess',path},progress:.5},
  {event:{kind:'move',actorId:'kess',path},progress:0},
  {event:{kind:'move',actorId:'kess',path},progress:1},
  move(.4,'unknown'),move(.4,'kess',[pt(1,1),pt(3,1),actual]),
  move(.4,'kess',[pt(1,1),pt(-1,1),actual])
 ];
 for(const frame of examples)assert.deepEqual(footfallPlan(board,frame,actual,'kess'),[]);
 assert.deepEqual(footfallPlan(board,move(.5),pt(6,5),'kess'),[]);
 assert.deepEqual(footfallPlan(board,move(.5),actual,'captain'),[]);
 assert.deepEqual(footfallPlan(null,move(.5),actual,'kess'),[]);
 assert.equal(movementDirection(board,move(.5),pt(0,0),'kess'),null);
});
test('footsteps track only already visited cells and never imply a future/unreachable move',()=>{
 const a=footfallPlan(board,move(.25),actual,'kess');
 const b=footfallPlan(board,move(.5),actual,'kess');
 const c=footfallPlan(board,move(.85),actual,'kess');
 assert.equal(a.length,1);
 assert.equal(b.length,2);
 assert.equal(c.length,3);
 assert.deepEqual(c.map(x=>x.position),path.slice(0,3));
 assert.ok(c.every(e=>e.position.column!==actual.column||e.position.row!==actual.row));
 assert.ok(c.every(e=>e.alpha<=.55&&e.alpha>=.04&&e.age>=0));
 assert.ok(Object.isFrozen(c)&&c.every(Object.isFrozen));
 assert.ok(c[0].alpha<c[2].alpha,'older marks fade farther behind the walker');
});
test('direction changes genuinely per cardinal segment, synced with existing easing',()=>{
 assert.deepEqual(movementDirection(board,move(.15),actual,'kess'),{x:1,y:0,role:'move'});
 assert.deepEqual(movementDirection(board,move(.5),actual,'kess'),{x:0,y:1,role:'move'});
 assert.deepEqual(movementDirection(board,move(.8),actual,'kess'),{x:1,y:0,role:'move'});
 const frame=move(.5),pose=miniaturePose(frame,actual,false,board);
 assert.equal(pose.kind,'move');
 assert.deepEqual(pose.bearing,{x:0,y:1,role:'move'});
 assert.ok(Object.isFrozen(pose));
 assert.notDeepEqual(figureBeat('kess',miniaturePose(move(.15),actual,false,board)),
                     figureBeat('kess',miniaturePose(move(.5),actual,false,board)));
 assert.notDeepEqual(foldedShadowProfile('kess',miniaturePose(move(.15),actual,false,board)),
                     foldedShadowProfile('kess',miniaturePose(move(.5),actual,false,board)));
 assert.equal(miniaturePose(frame,pt(1,1),false,board),null);
});
test('all four footfall patterns are deterministic within each real cell at phone sizes',()=>{
 const signatures=[];
 for(const id of FOOTFALL_IDS){
  const image=ctx(),plan=footfallPlan(board,move(.45,id),actual,id);
  assert.ok(plan.length>0);
  assert.equal(paintFootfall(image,board,plan[0]),true);
  signatures.push(JSON.stringify(image.calls));
 }
 assert.equal(new Set(signatures).size,4);
 for(const size of [38,44,51,70])for(const id of FOOTFALL_IDS){
  const b={...board,tile:size,mapWidth:8*size,mapHeight:6*size};
  const plan=footfallPlan(b,move(.45,id),actual,id),snapshot=JSON.stringify(plan);
  const a=ctx(),other=ctx();
  assert.equal(paintFootfall(a,b,plan[0]),true);
  assert.equal(paintFootfall(other,b,plan[0]),true);
  assert.deepEqual(a.calls,other.calls);balanced(a);
  assert.equal(a.calls.filter(x=>x[0]==='clip').length,1);
  const r=a.calls.find(x=>x[0]==='rect');
  assert.ok(r[1]>=plan[0].rect.x&&r[2]>=plan[0].rect.y);
  assert.ok(r[1]+r[3]<=plan[0].rect.x+size);
  assert.ok(r[2]+r[4]<=plan[0].rect.y+size);
  assert.equal(JSON.stringify(plan),snapshot);
 }
});
test('actual confirmed legal movement is the ONLY origin of printed movement ink',()=>{
 let state=setMovementBoard(createCommandState(),{columns:8,rows:6});
 state=changeActor(state,'mirelle');
 const origin=state.positions.mirelle,destination=pt(origin.column,origin.row-1);
 const proposed=chooseTarget(chooseMove(state),destination,{columns:8,rows:6});
 assert.equal(proposed.preview.valid,true);
 assert.equal(paintRealFootfalls(ctx(),board,{event:proposed.preview,progress:.45},state.positions),0);
 const moved=confirmPreview(proposed,{columns:8,rows:6});
 assert.equal(moved.visualEvent.kind,'move');
 assert.equal(moved.visualEvent.actorId,'mirelle');
 const f={event:moved.visualEvent,progress:.48},before=JSON.stringify(moved);
 assert.ok(paintRealFootfalls(ctx(),board,f,moved.positions)>=1);
 assert.equal(JSON.stringify(moved),before);
 assert.equal(paintRealFootfalls(ctx(),board,null,moved.positions),0);
});
test('paper matte visibly follows real interpolated actor; never stays at destination during walk',()=>{
 const source=fs.readFileSync('src/board/scene.js','utf8');
 assert.match(source,/const rect=animatedHeroRect\(board,point,id,frame\)/);
 const moving=animatedHeroRect(board,actual,'kess',move(.45));
 const final=cellRect(board,actual.column,actual.row);
 assert.notDeepEqual(moving,final);
 assert.ok(moving.x<final.x,'backing must physically trail with the miniature on approach');
 assert.ok(source.indexOf('paintRealFootfalls(ctx,board,frame,overlay?.positions)')<
           source.indexOf('paintTargetIndicators(ctx,board'));
 assert.ok(source.indexOf('paintMiniatureMatte(ctx,rect,id')<source.indexOf('drawHero(ctx,rect,id'));
});
test('full state gameplay, unchanged movement cost and canvas stack, no external inputs',()=>{
 const logical={columns:8,rows:6};
 let s=startBattle(setMovementBoard(createCommandState(),logical),logical);
 const old=JSON.stringify(s),paint=ctx();
 renderBoard(paint,board,null,{actorId:s.actorId,positions:s.positions,targets:s.targets,
  partyHp:s.partyHp,guards:s.guards,ended:s.ended,intents:[]},move(.52,'kess'));
 balanced(paint);
 assert.equal(JSON.stringify(s),old);
 const footsteps=ctx();
 assert.ok(paintRealFootfalls(footsteps,board,move(.52),{kess:actual})>0);
 assert.ok(footsteps.calls.some(x=>x[0]==='rotate'),'physical footfalls are orientated to real route');
 balanced(footsteps);
 const source=fs.readFileSync('src/board/paper-footfalls.js','utf8');
 assert.doesNotMatch(source,/\bfetch\(|Math\.random|setInterval|setTimeout|requestAnimationFrame|window\.|document\.|addEventListener|localStorage/);
 const sw=fs.readFileSync('service-worker.js','utf8');
 assert.match(sw,/v0\\.09-gate-a22-r1/);
 assert.equal(sw.split("'./src/board/paper-footfalls.js'").length-1,1);
});
