import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {CHASED_IDS,CHASED_STYLES,chasedReliefPlan,paintChasedRelief} from '../src/board/chased-relief.js';
import {drawHero,drawFoe} from '../src/board/miniatures.js';
import {renderBoard} from '../src/board/scene.js';
import {measureBoard,cellRect} from '../src/board/geometry.js';
import {startBattle} from '../src/battle/engine.js';
import {createCommandState,setMovementBoard} from '../src/commands/engine.js';
const logical={rows:6,columns:8},board=measureBoard(440,290);
function canvas(){const calls=[],c={calls,globalAlpha:1};
 for(const op of ['save','restore','beginPath','closePath','moveTo','lineTo','arc','rect','clip','fill','stroke','fillRect','strokeRect','translate','scale','ellipse','setLineDash','quadraticCurveTo','bezierCurveTo','rotate'])c[op]=(...args)=>calls.push([op,...args]);
 c.createLinearGradient=()=>({addColorStop(){}});
 c.createRadialGradient=()=>({addColorStop(){}});
 return c;
}
const balanced=c=>assert.equal(c.calls.filter(x=>x[0]==='save').length,c.calls.filter(x=>x[0]==='restore').length);
test('six genuinely different physically painted torso materials and die-cut shapes',()=>{
 assert.deepEqual(CHASED_IDS,['captain','brunna','kess','mirelle','briar','shade']);
 assert.equal(new Set(CHASED_IDS.map(id=>CHASED_STYLES[id].material)).size,6);
 for(const id of CHASED_IDS){const p=chasedReliefPlan(id);assert.ok(Object.isFrozen(CHASED_STYLES[id])&&Object.isFrozen(p));
 assert.ok(Object.isFrozen(p.outline)&&Object.isFrozen(p.colors)&&Object.isFrozen(p.outline[0]));
 assert.ok(p.outline.length>=7&&p.facet.length>=5);}
});
test('every new body painting remains below the authored faces and inside its figure bounds',()=>{
 for(const id of CHASED_IDS){
 const p=chasedReliefPlan(id);
 for(const arr of [p.outline,p.facet,p.stitch,p.shoulder,p.rivet])for(const [x,y] of arr){
 assert.ok(x>=24&&x<=76,'no body painting beyond the native figure footprint');
 assert.ok(y>=45&&y<=76,'do not paint across the actual upper face or reach next unit');
 }
 }
 assert.equal(chasedReliefPlan('foreign'),null);
 assert.equal(chasedReliefPlan('shade',null,{fallen:true}),null);
});
test('only native real attack and ward puppet phases can illuminate the raised enamel',()=>{
 const idle=chasedReliefPlan('captain'),swing=chasedReliefPlan('captain',{kind:'attack',progress:.5}),
 recover=chasedReliefPlan('captain',{kind:'attack',progress:1}),
 move=chasedReliefPlan('captain',{kind:'move',progress:.5}),
 recoil=chasedReliefPlan('captain',{kind:'recoil',progress:.5});
 assert.equal(idle.energy,0);assert.ok(swing.energy>.99);
 assert.ok(Math.abs(recover.energy)<1e-10);
 assert.equal(move.energy,0);assert.equal(recoil.energy,0);
 assert.ok(chasedReliefPlan('mirelle',{kind:'ward',progress:.5}).energy>.99);
 assert.equal(chasedReliefPlan('mirelle',{kind:'attack',progress:-10}).energy,0);
});
test('each miniature has visibly distinct source Canvas painting and deterministic drawing',()=>{
 const signatures=[];
 for(const id of CHASED_IDS){const a=canvas(),b=canvas();
 assert.equal(paintChasedRelief(a,id),true);assert.equal(paintChasedRelief(b,id),true);
 assert.deepEqual(a.calls,b.calls);balanced(a);signatures.push(JSON.stringify(a.calls));
 }
 assert.equal(new Set(signatures).size,6);
 assert.equal(paintChasedRelief(canvas(),'not-a-character'),false);
 assert.equal(paintChasedRelief(canvas(),'briar',null,{fallen:true}),false);
 assert.equal(paintChasedRelief(null,'briar'),false);
});
test('authored inlays are drawn within REAL six miniature figures at 38, 44, 51, 70 px',()=>{
 const snapshot=JSON.stringify(CHASED_STYLES);
 for(const size of [38,44,51,70])for(const id of CHASED_IDS){
 const rect={x:9,y:13,width:size,height:size},c=canvas();
 if(['briar','shade'].includes(id)){drawFoe(c,rect,{id,hp:9,maxHp:12},null,{kind:'attack',progress:.5});}
 else drawHero(c,rect,id,false,{kind:'attack',progress:.5},{hp:10,maxHp:12});
 balanced(c);
 assert.ok(c.calls.some(x=>x[0]==='scale'&&Math.abs(x[1]-size/100)<1e-6));
 assert.ok(c.calls.length>40);
 }
 assert.equal(JSON.stringify(CHASED_STYLES),snapshot);
});
test('inlays are placed after bespoke face/cloth but beneath damage etches and weapons',()=>{
 const src=fs.readFileSync('src/board/miniatures.js','utf8');
 const hero=src.slice(src.indexOf('export function drawHero'),src.indexOf('function briar(ctx)'));
 const foe=src.slice(src.indexOf('export function drawFoe'));
 for(const v of [hero,foe]){
 assert.ok(v.indexOf('paintVisage(')<v.indexOf('paintChasedRelief('));
 assert.ok(v.indexOf('paintChasedRelief(')<v.indexOf('paintFigureCondition('));
 assert.ok(v.indexOf('paintChasedRelief(')<v.indexOf('paintWeaponRig('));
 }
});
test('one true 4v2 skirmish still renders without changing deterministic battle state',()=>{
 const state=startBattle(setMovementBoard(createCommandState(),logical),logical);
 const before=JSON.stringify(state),ctx=canvas();
 renderBoard(ctx,board,null,{actorId:state.actorId,positions:state.positions,targets:state.targets,partyHp:state.partyHp,guards:state.guards,ended:state.ended,intents:[]});
 balanced(ctx);assert.equal(JSON.stringify(state),before);
});
test('no DOM, storage, RNG, network, independent timing or new target layer in sculpture source',()=>{
 const src=fs.readFileSync('src/board/chased-relief.js','utf8');
 for(const token of ['fetch(','Math.random','setInterval','setTimeout','requestAnimationFrame','window.','document.','addEventListener','localStorage','AudioContext'])assert.ok(!src.includes(token),token);
 const sw=fs.readFileSync('service-worker.js','utf8');
 assert.ok(sw.includes('v0.09-gate-a26-r1'));
 assert.equal(sw.split("'./src/board/chased-relief.js'").length-1,1);
 assert.ok(!sw.includes('skipWaiting('));
});
