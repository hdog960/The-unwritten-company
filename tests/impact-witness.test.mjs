import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {measureBoard} from '../src/board/geometry.js';
import {impactWitnessPlan,paintImpactWitness,WITNESS_INKS,WITNESS_OUTCOMES,WITNESS_STYLES} from '../src/board/impact-witness.js';
import {drawWorldEffect} from '../src/board/effects.js';
import {renderBoard} from '../src/board/scene.js';
import {createCommandState,setMovementBoard,chooseAbility,chooseTarget,confirmPreview,changeActor} from '../src/commands/engine.js';
import {startBattle} from '../src/battle/engine.js';

const board=measureBoard(440,290),P=(column,row)=>({column,row});
const real=(kind='hit',skillId='strike',from=P(2,3),to=P(5,2))=>({kind,skillId,from,to,token:'confirmed-action'});
function ink(){
 const calls=[],ctx={calls,globalAlpha:1,strokeStyle:'',fillStyle:'',lineWidth:1};
 for(const method of ['save','restore','beginPath','closePath','moveTo','lineTo','arc','rect','clip',
  'translate','scale','fillRect','strokeRect','ellipse','rotate','setLineDash','quadraticCurveTo','bezierCurveTo'])
  ctx[method]=(...v)=>calls.push([method,...v]);
 ctx.stroke=()=>calls.push(['stroke',ctx.strokeStyle,ctx.lineWidth]);
 ctx.fill=()=>calls.push(['fill',ctx.fillStyle]);
 ctx.createLinearGradient=()=>({addColorStop(){}});
 ctx.createRadialGradient=()=>({addColorStop(){}});
 return ctx;
}
const balanced=ctx=>assert.equal(ctx.calls.filter(c=>c[0]==='save').length,ctx.calls.filter(c=>c[0]==='restore').length);
test('three honest outcome silhouettes, four distinct handcrafted skill witnesses',()=>{
 assert.deepEqual(WITNESS_OUTCOMES,['hit','critical','miss']);
 assert.deepEqual(WITNESS_STYLES,['strike','spark','sigil','foe']);
 assert.equal(new Set(WITNESS_STYLES.map(s=>WITNESS_INKS[s].type)).size,4);
 assert.ok(WITNESS_STYLES.every(s=>Object.isFrozen(WITNESS_INKS[s])));
 const sig=WITNESS_STYLES.map(skillId=>impactWitnessPlan(board,real('hit',skillId),.7).signature);
 assert.equal(new Set(sig).size,4);
});
test('misses are NEVER contact cuts, criticals have two cuts, hits one',()=>{
 const plans=WITNESS_OUTCOMES.map(k=>impactWitnessPlan(board,real(k),.75));
 assert.deepEqual(plans.map(p=>p.contact),[true,true,false]);
 assert.deepEqual(plans.map(p=>p.doubleCut),[false,true,false]);
 const marks=WITNESS_OUTCOMES.map(kind=>{const c=ink();assert.equal(paintImpactWitness(c,board,real(kind),.75),true);balanced(c);return c;});
 assert.equal(marks[2].calls.filter(c=>c[0]==='fill').length,0);
 assert.ok(marks[0].calls.some(c=>c[0]==='fill'));
 assert.ok(marks[1].calls.filter(c=>c[0]==='stroke').length>marks[0].calls.filter(c=>c[0]==='stroke').length);
});
test('do not paint pre-impact, finished, invalid, outside, or preview-only results',()=>{
 for(const p of [NaN,Infinity,-1,0,.3,.53,1,2])assert.equal(impactWitnessPlan(board,real(),p),null);
 for(const event of [null,{}, {kind:'ward'}, {kind:'move',from:P(1,1),to:P(2,1)},
  real('hit','strike',P(-1,1)),real('hit','spark',P(1,1),P(99,99))])
   assert.equal(impactWitnessPlan(board,event,.7),null);
 assert.equal(impactWitnessPlan(null,real(),.7),null);
 assert.equal(paintImpactWitness(ink(),null,real(),.7),false);
});
test('incoming direction only changes physical engraving orientation, not target position or AP',()=>{
 const left=impactWitnessPlan(board,real('hit','spark',P(7,2),P(4,2)),.75);
 const right=impactWitnessPlan(board,real('hit','spark',P(1,2),P(4,2)),.75);
 assert.equal(left.shift,-right.shift);
 assert.deepEqual(left.rect,right.rect);
 assert.equal(left.rect.width,board.tile);
 assert.ok(Object.isFrozen(left)&&Object.isFrozen(left.palette));
});
test('every 38/44/51/70px impression clips twice: native target tile AND safe lower facial apron',()=>{
 for(const size of [38,44,51,70])for(const style of WITNESS_STYLES)for(const kind of WITNESS_OUTCOMES){
   const b={...board,tile:size,mapWidth:8*size,mapHeight:6*size};
   const m=real(kind,style),copy=JSON.stringify(m),a=ink(),c=ink();
   assert.equal(paintImpactWitness(a,b,m,.76),true);
   assert.equal(paintImpactWitness(c,b,m,.76),true);
   assert.deepEqual(a.calls,c.calls);balanced(a);
   assert.equal(JSON.stringify(m),copy);
   const clips=a.calls.filter(q=>q[0]==='rect');
   assert.equal(clips.length,2);
   assert.equal(clips[0][3],size-2);
   assert.deepEqual(clips[1],['rect',16,66,68,17]);
   // The only painter coordinates are in a nested 66..83% height clip.
   assert.ok(a.calls.filter(q=>q[0]==='moveTo').every(q=>q[2]>=65&&q[2]<=84));
 }
});
test('genuine confirmed skill result feeds a true action event, never edits reducer',()=>{
 const dims={columns:8,rows:6};
 let s=setMovementBoard(createCommandState(),dims);
 s=changeActor(s,'kess');
 const opponent=s.targets.briar.position;
 s=confirmPreview(chooseTarget(chooseAbility(s,'spark'),opponent,dims),dims);
 assert.ok(['hit','miss','critical'].includes(s.visualEvent.kind));
 assert.equal(s.visualEvent.skillId,'spark');
 const snapshot=JSON.stringify(s),ctx=ink();
 assert.equal(paintImpactWitness(ctx,board,s.visualEvent,.72),true);
 assert.equal(JSON.stringify(s),snapshot);balanced(ctx);
});
test('actual full battle scene and all real enemy phases keep source state unmodified',()=>{
 const dims={columns:8,rows:6},s=startBattle(setMovementBoard(createCommandState(),dims),dims);
 const frozen=JSON.stringify(s),ctx=ink();
 renderBoard(ctx,board,null,{positions:s.positions,partyHp:s.partyHp,guards:s.guards,
  targets:s.targets,actorId:s.actorId,intents:[]},{event:real('critical','spark'),progress:.75});
 balanced(ctx);assert.equal(JSON.stringify(s),frozen);
 const enemy={kind:'enemy-phase',token:'phase',marks:[
  {kind:'miss',from:P(6,2),to:P(1,2)}, {kind:'hit',from:P(5,1),to:P(2,2)}]};
 const before=JSON.stringify(enemy),fx=ink();
 assert.equal(drawWorldEffect(fx,board,{event:enemy,progress:.84}),true);
 balanced(fx);assert.equal(JSON.stringify(enemy),before);
});
test('no torso-sized centered result flash, giant foe hit ring, or lingering fake impact',()=>{
 const fx=fs.readFileSync('src/board/effects.js','utf8');
 const foe=fs.readFileSync('src/board/miniatures.js','utf8');
 assert.ok(fx.includes('paintImpactWitness(ctx,board,mark,p)'));
 assert.ok(!fx.includes('flash(ctx,dest.x,dest.y'));
 assert.ok(!fx.includes("glyph(ctx,dest.x,dest.y,s*(.19+.18*impact)"));
 assert.ok(!foe.includes('ctx.arc(50,45,34'));
 const shards=fs.readFileSync('src/board/impact-fragments.js','utf8');
 assert.ok(shards.includes('s*.74'));
});
test('new actor-specific hit feedback has no browser APIs or independent timeline and is cached exactly once',()=>{
 const src=fs.readFileSync('src/board/impact-witness.js','utf8');
 for(const forbidden of ['fetch(', 'Math.random', 'setInterval', 'setTimeout', 'requestAnimationFrame',
  'addEventListener', 'localStorage', 'document.', 'window.', 'AudioContext'])
  assert.ok(!src.includes(forbidden),'unexpected input dependency: '+forbidden);
 const sw=fs.readFileSync('service-worker.js','utf8');
 assert.ok(sw.includes('v0.09-gate-a27-r1'));
 assert.equal(sw.split("'./src/board/impact-witness.js'").length-1,1);
 assert.ok(!sw.includes('skipWaiting('));
});
