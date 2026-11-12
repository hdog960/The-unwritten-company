import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {COMBAT_SCRIPT_STYLES,combatScriptStyle,combatScriptGeometry,paintCombatScript} from '../src/board/combat-script.js';
import {MATTE_IDS,MATTE_MATERIALS,miniatureMattePlan,paintMiniatureMatte} from '../src/board/miniature-matte.js';
import {drawWorldEffect} from '../src/board/effects.js';
import {renderBoard} from '../src/board/scene.js';
import {measureBoard,cellRect,getTile} from '../src/board/geometry.js';
import {createCommandState,setMovementBoard,changeActor,chooseAbility,chooseTarget,confirmPreview} from '../src/commands/engine.js';
import {startBattle} from '../src/battle/engine.js';
function ink(){
 const calls=[],ctx={calls,globalAlpha:1,lineWidth:1,strokeStyle:'',fillStyle:''};
 for(const m of ['save','restore','beginPath','closePath','moveTo','lineTo','arc','rect','clip',
  'fillRect','strokeRect','ellipse','translate','scale','setLineDash','quadraticCurveTo','bezierCurveTo'])
  ctx[m]=(...args)=>calls.push([m,...args]);
 ctx.fill=()=>calls.push(['fill',ctx.fillStyle]);
 ctx.stroke=()=>calls.push(['stroke',ctx.lineWidth,ctx.strokeStyle]);
 ctx.createLinearGradient=()=>({addColorStop(){}});
 ctx.createRadialGradient=()=>({addColorStop(){}});
 return ctx;
}
const balanced=c=>assert.equal(c.calls.filter(x=>x[0]==='save').length,c.calls.filter(x=>x[0]==='restore').length);
const P=(column,row)=>({column,row});
const mark=(skillId,kind='hit')=>({kind,skillId,from:P(1,4),to:P(5,1),token:'real-event'});
test('all four distinct source-authored cut-ink combat styles derive only from real combat kind and skill',()=>{
 assert.deepEqual(COMBAT_SCRIPT_STYLES,['strike','spark','sigil','foe']);
 for(const style of ['strike','spark','sigil']){
  assert.equal(combatScriptStyle(mark(style)),style);
 }
 assert.equal(combatScriptStyle(mark(null)),'foe');
 assert.equal(combatScriptStyle(mark('unknown')),'foe');
 for(const bad of [null,{}, {kind:'ward',skillId:'strike'},{kind:'move',skillId:'spark'}])
  assert.equal(combatScriptStyle(bad),null);
 const originals=COMBAT_SCRIPT_STYLES.map(s=>combatScriptGeometry(mark(s),'flight','flight'));
 assert.equal(new Set(originals.map(v=>JSON.stringify(v.strokes))).size,4);
});
test('real skill timing separates readable strike, forked spark, fourfold sigil and enemy thorn',()=>{
 const count=new Map();
 for(const style of COMBAT_SCRIPT_STYLES){
  const flight=combatScriptGeometry(mark(style),.42,'flight');
  const impact=combatScriptGeometry(mark(style),.65,'impact');
  assert.equal(flight.style,style);assert.equal(impact.style,style);
  assert.ok(Object.isFrozen(flight)&&Object.isFrozen(flight.strokes));
  assert.notDeepEqual(flight.strokes,impact.strokes);
  assert.ok(flight.strokes.length>=2&&impact.shapes.length>=1);
  count.set(style,flight.strokes.length);
  for(const s of [...flight.strokes,...impact.strokes,...flight.shapes,...impact.shapes])
   for(const [x,y] of s)assert.ok(Math.abs(x)<=38&&Math.abs(y)<=38,
    'ink must not cover neighboring tile or external rail');
 }
 assert.equal(new Set(count.values()).size>=2,true);
 assert.equal(combatScriptGeometry(mark('strike'),.5,'invalid'),null);
});
test('a true miss paints broken light ink and never an impact seal or critical shards',()=>{
 for(const style of COMBAT_SCRIPT_STYLES){
  const missed=combatScriptGeometry(mark(style,'miss'),.8,'impact');
  const hit=combatScriptGeometry(mark(style,'hit'),.8,'impact');
  const critical=combatScriptGeometry(mark(style,'critical'),.8,'impact');
  assert.equal(missed.shapes.length,0);
  assert.ok(missed.strokes.length<=2);
  assert.ok(hit.shapes.length>=1);
  assert.ok(critical.strokes.length>=hit.strokes.length+2);
  assert.notDeepEqual(missed,hit);
 }
});
test('impact manuscript seal is small and confined below the target face, with no false HUD square',()=>{
 for(const style of COMBAT_SCRIPT_STYLES){
  const markSource=mark(style,'critical'),geometry=combatScriptGeometry(markSource,.65,'impact');
  for(const size of [38,44,51,70]){
   const center={x:100,y:120,s:size},ctx=ink();
   assert.equal(paintCombatScript(ctx,center,markSource,.65,'impact'),true);
   const move=ctx.calls.find(x=>x[0]==='translate');
   assert.ok(move);
   assert.equal(move[1],center.x+size*.16);
   assert.equal(move[2],center.y+size*.18);
   for(const piece of [...geometry.strokes,...geometry.shapes])for(const [x,y] of piece){
    const worldX=move[1]+x*size/100,worldY=move[2]+y*size/100;
    assert.ok(worldX>=center.x-.02*size&&worldX<=center.x+.4*size);
    assert.ok(worldY>=center.y-.02*size&&worldY<=center.y+.4*size,
     'no original impact ink should paint through the face above tile center');
   }
   balanced(ctx);
  }
 }
});
test('four skill materials draw deterministic local Canvas art at every phone tile size',()=>{
 for(const size of [38,44,51,70]){
  for(const style of COMBAT_SCRIPT_STYLES){
   for(const kind of ['hit','miss','critical']){
    const source=mark(style,kind),copy=JSON.stringify(source);
    const focal={x:60,y:70,s:size},a=ink(),b=ink();
    assert.equal(paintCombatScript(a,focal,source,.56,'flight'),true);
    assert.equal(paintCombatScript(b,focal,source,.56,'flight'),true);
    assert.deepEqual(a.calls,b.calls);
    assert.equal(JSON.stringify(source),copy);
    balanced(a);
    const shapes=a.calls.filter(x=>x[0]==='rect');
    assert.equal(shapes.length,1);
    assert.ok(shapes[0][1]>=focal.x-size*.5&&shapes[0][2]>=focal.y-size*.5);
    assert.ok(shapes[0][1]+shapes[0][3]<=focal.x+size*.5);
    assert.ok(shapes[0][2]+shapes[0][4]<=focal.y+size*.5);
    assert.ok(a.calls.some(x=>x[0]==='clip'));
    const impact=ink();
    assert.equal(paintCombatScript(impact,focal,source,.5,'impact'),true);
    balanced(impact);
   }
  }
 }
 assert.equal(paintCombatScript(null,{x:10,y:10,s:44},mark('spark'),.5),false);
 assert.equal(paintCombatScript(ink(),{x:10,y:10,s:0},mark('spark'),.5),false);
 assert.equal(paintCombatScript(ink(),{x:10,y:10,s:44},{kind:'ward'},.5),false);
});
test('six material-specific physical matte pieces protect figures without new target/HP semantics',()=>{
 assert.deepEqual(MATTE_IDS,['captain','brunna','kess','mirelle','briar','shade']);
 assert.deepEqual(MATTE_MATERIALS,['stone','moss','water','rubble','glyph']);
 const signatures=[];
 for(const id of MATTE_IDS){
  const plan=miniatureMattePlan(id,'water');
  assert.equal(plan.id,id);assert.equal(plan.quiet,true);
  assert.equal(miniatureMattePlan(id,'moss').quiet,false);
  assert.equal(miniatureMattePlan(id,'stone',{fallen:true}),null);
  assert.equal(plan.contours.length,2);
  assert.ok(Object.isFrozen(plan)&&Object.isFrozen(plan.contours));
  for(const path of plan.contours)for(const [x,y] of path)
   assert.ok(x>=17&&x<=81&&y>=25&&y<=80,
    'matte must leave outer target corners uncovered');
  signatures.push(JSON.stringify(plan.color));
 }
 assert.equal(new Set(signatures).size,6);
 assert.equal(miniatureMattePlan('foreign','stone'),null);
 assert.equal(miniatureMattePlan('captain','unknown'),null);
});
test('true occupied matte artwork remains bounded and deterministic from 38 to 70px',()=>{
 for(const size of [38,44,51,70])for(const id of MATTE_IDS)
 for(const material of ['stone','water','moss','glyph']){
  const box={x:11,y:15,width:size,height:size},before=JSON.stringify(box);
  const a=ink(),b=ink();
  assert.equal(paintMiniatureMatte(a,box,id,material),true);
  assert.equal(paintMiniatureMatte(b,box,id,material),true);
  assert.deepEqual(a.calls,b.calls);
  balanced(a);assert.equal(JSON.stringify(box),before);
  assert.equal(a.calls.filter(x=>x[0]==='clip').length,1);
  const r=a.calls.find(x=>x[0]==='rect');
  assert.ok(r[1]>=box.x&&r[2]>=box.y&&r[1]+r[3]<=box.x+size&&r[2]+r[4]<=box.y+size);
  assert.equal(paintMiniatureMatte(ink(),box,id,material,{fallen:true}),false);
 }
});
test('actual battle effects use four separate real skill artworks and not nonexistent damage',()=>{
 const board=measureBoard(440,290);
 for(const kind of ['hit','miss','critical'])for(const skillId of COMBAT_SCRIPT_STYLES){
  const ctx=ink(),event=mark(skillId,kind),before=JSON.stringify(event);
  assert.equal(drawWorldEffect(ctx,board,{event,progress:.8}),true);
  assert.ok(ctx.calls.some(x=>x[0]==='clip'));
  assert.ok(ctx.calls.filter(x=>x[0]==='clip').length>=2);
  balanced(ctx);
  assert.equal(JSON.stringify(event),before);
 }
 // The actual command reducer supplies canonical skill ids in a true hit/miss.
 let state=setMovementBoard(createCommandState(),{columns:8,rows:6});
 state=changeActor(state,'kess');
 const target=state.targets.briar.position;
 state=confirmPreview(chooseTarget(chooseAbility(state,'spark'),target,{columns:8,rows:6}),{columns:8,rows:6});
 assert.ok(['hit','miss','critical'].includes(state.visualEvent.kind));
 assert.equal(state.visualEvent.skillId,'spark');
 assert.equal(combatScriptStyle(state.visualEvent),'spark');
});
test('full existing gameplay renders paper mattes under target indicators and miniatures unchanged',()=>{
 const board=measureBoard(440,290);
 const state=startBattle(setMovementBoard(createCommandState(),{columns:8,rows:6}),{columns:8,rows:6});
 const before=JSON.stringify(state),ctx=ink();
 renderBoard(ctx,board,null,{actorId:state.actorId,positions:state.positions,
  targets:state.targets,partyHp:state.partyHp,guards:state.guards,ended:state.ended,intents:[]});
 balanced(ctx);assert.equal(JSON.stringify(state),before);
 const scene=fs.readFileSync('src/board/scene.js','utf8');
 assert.ok(scene.indexOf('paintMiniatureMatte(ctx,rect,id')<scene.indexOf('paintTargetIndicators(ctx,board,'));
 assert.ok(scene.indexOf('paintMiniatureMatte(ctx,rect,foe.id')<scene.indexOf('paintTargetIndicators(ctx,board,'));
 assert.ok(scene.indexOf('paintMiniatureMatte(ctx,rect,id')<scene.indexOf('drawHero(ctx,rect,id,'));
 assert.ok(scene.indexOf('paintMiniatureMatte(ctx,rect,foe.id')<scene.indexOf('drawFoe(ctx,rect,foe,'));
});
test('new original renderers preserve worker-safe offline graph, zero input and zero clock',()=>{
 for(const file of ['src/board/combat-script.js','src/board/miniature-matte.js']){
  const source=fs.readFileSync(file,'utf8');
  assert.doesNotMatch(source,/\bfetch\(|Math\.random|setInterval\(|setTimeout\(|requestAnimationFrame|localStorage|window\.|document\.|addEventListener|<img|new Audio/);
 }
 const sw=fs.readFileSync('service-worker.js','utf8');
 assert.ok(sw.includes('v0.09-gate-a29-r1'));
 for(const url of ['./src/board/combat-script.js','./src/board/miniature-matte.js']){
  assert.equal(sw.split("'"+url+"'").length-1,1);
 }
 assert.doesNotMatch(sw,/skipWaiting\(/);
});
