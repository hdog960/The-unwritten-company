import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {FIGURE_INK_EDGES,paintFigureEdgeInk} from '../src/board/figure-edge-ink.js';
import {drawHero,drawFoe} from '../src/board/miniatures.js';
import {renderBoard} from '../src/board/scene.js';
import {measureBoard} from '../src/board/geometry.js';
import {createCommandState,setMovementBoard} from '../src/commands/engine.js';

const names=['captain','brunna','kess','mirelle','briar','shade'];
const heroes=names.slice(0,4),foes=names.slice(4);
function ink(){
 const calls=[],ctx={calls,globalAlpha:1};
 for(const method of ['save','restore','beginPath','closePath','moveTo','lineTo','arc','ellipse',
 'rect','clip','fill','stroke','fillRect','strokeRect','strokeRect','translate','scale',
 'setLineDash','quadraticCurveTo','bezierCurveTo'])
  ctx[method]=(...args)=>calls.push([method,...args]);
 // Capture actual ink weight and color so a real painted flash is measured.
 ctx.stroke=()=>calls.push(['stroke',ctx.lineWidth,ctx.strokeStyle]);
 ctx.createRadialGradient=()=>({addColorStop(){}});
 ctx.createLinearGradient=()=>({addColorStop(){}});
 return ctx;
}
const balanced=c=>assert.equal(c.calls.filter(x=>x[0]==='save').length,c.calls.filter(x=>x[0]==='restore').length);

test('all four canonical party portraits receive distinct original material atelier painting',()=>{
 const portraits=heroes.map(id=>{
  const svg=fs.readFileSync('art/portraits/'+id+'.svg','utf8');
  assert.match(svg,/<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  assert.match(svg,/viewBox="0 0 120 144"/);
  assert.match(svg,new RegExp('<title id="title">[^<]+<\\/title>'));
  assert.equal((svg.match(/id="atelier-portrait"/g)||[]).length,1);
  assert.ok(svg.length>3000,id+' must retain the prior painted identity and add detailed art');
  assert.ok((svg.match(/<path /g)||[]).length>=29,id+' requires many authored ink shapes');
  assert.ok((svg.match(/stroke=/g)||[]).length>11,id+' needs legible stitched material contrast');
  assert.doesNotMatch(svg,/<script|<foreignObject|http(s)?:\/\/(?!www\.w3\.org\/2000\/svg)|onload=|filter=|<image/i);
  assert.equal((svg.match(/<svg\b/g)||[]).length,1);
  assert.equal((svg.match(/<\/svg>/g)||[]).length,1);
  assert.equal((svg.match(/<g\b/g)||[]).length,(svg.match(/<\/g>/g)||[]).length);
  return svg.match(/<g id="atelier-portrait"[\s\S]*?<\/g>/)?.[0];
 });
 assert.ok(portraits.every(Boolean));
 assert.equal(new Set(portraits).size,4,'portraits require individual artwork, not recoloring one drawing');
});

test('Kess pale elf and Mirelle dark scholar identity preserved in upgraded portraits and game sprites',()=>{
 const k=fs.readFileSync('art/portraits/kess.svg','utf8');
 const m=fs.readFileSync('art/portraits/mirelle.svg','utf8');
 const mini=fs.readFileSync('src/board/miniatures.js','utf8');
 assert.match(k,/#d6d6bd/);assert.match(k,/#f5edca/);
 assert.match(m,/#222337/);assert.match(m,/#1c243b/);
 assert.match(mini,/#d2d8c6/);
 assert.match(mini,/#2e334f/);
 assert.doesNotMatch(mini,/\[52,3\]/,'the old Mirelle cone hat must remain absent');
});

test('six genuine raised paper miniature edge plans have distinct silhouettes and material highlights',()=>{
 assert.deepEqual(Object.keys(FIGURE_INK_EDGES),names);
 for(const key of ['left','right','creases','rivets'])
  assert.equal(new Set(names.map(id=>JSON.stringify(FIGURE_INK_EDGES[id][key]))).size,6,key+' must be individual');
 for(const id of names){
  const ink=FIGURE_INK_EDGES[id];
  for(const side of [ink.left,ink.right]){
   assert.ok(side.length>=5);
   for(const [x,y] of side)assert.ok(x>=3&&x<=96&&y>=3&&y<=96,id+' edge escaped miniature source');
  }
  assert.equal(ink.creases.length,2);
  assert.equal(ink.rivets.length,3);
  for(const pt of [...ink.creases.flat(),...ink.rivets])
   assert.ok(pt[0]>=3&&pt[0]<=96&&pt[1]>=3&&pt[1]<=96,id+' material ink outside source');
 }
});

test('six small-size physical figure edges preserve Canvas state, determinism, and actual fight pose',()=>{
 for(const size of [38,44,51,70]){
  for(const id of names){
   const pos={kind:'attack',progress:.4,bearing:{role:'attack',x:-1,y:0}};
   const old=JSON.stringify(pos),a=ink(),b=ink();
   assert.equal(paintFigureEdgeInk(a,id,pos),true);
   assert.equal(paintFigureEdgeInk(b,id,pos),true);
   assert.deepEqual(a.calls,b.calls);
   assert.ok(a.calls.filter(x=>x[0]==='stroke').length>=10);
   balanced(a);assert.equal(JSON.stringify(pos),old);
   for(const point of a.calls.filter(c=>['moveTo','lineTo','arc'].includes(c[0])))
    assert.ok(point[1]>=3&&point[1]<=96&&point[2]>=3&&point[2]<=96,id+' edge escaped source art');
   const ctx=ink(),rect={x:4,y:5,width:size,height:size};
   if(heroes.includes(id))drawHero(ctx,rect,id,false,pos,{hp:6,maxHp:20,guard:1});
   else drawFoe(ctx,rect,{id,hp:6,maxHp:20},null,pos);
   balanced(ctx);
  }
 }
});

test('fallen miniatures never paint living enamel edges; visual attack brighter than idle',()=>{
 for(const id of names){
  assert.equal(paintFigureEdgeInk(ink(),id,null,{fallen:true}),false);
  assert.equal(paintFigureEdgeInk(ink(),'unknown'),false);
  const rest=ink(),action=ink();
  assert.equal(paintFigureEdgeInk(rest,id),true);
  assert.equal(paintFigureEdgeInk(action,id,{kind:'attack',progress:.5}),true);
  assert.notDeepEqual(rest.calls,action.calls,'active authentic attack should brighten painted seam');
  balanced(rest);balanced(action);
 }
 assert.equal(paintFigureEdgeInk(null,'captain'),false);
});

test('new contour painter remains below damage, real wrists and held weapons in actual figures',()=>{
 const src=fs.readFileSync('src/board/miniatures.js','utf8');
 const heroSrc=src.slice(src.indexOf('export function drawHero'),src.indexOf('export function drawFoe'));
 assert.ok(heroSrc.includes('paintFigureEdgeInk(ctx,id,pose,{fallen})'));
 assert.ok(heroSrc.indexOf('paintFigureEdgeInk(ctx,id,pose,{fallen})')<
  heroSrc.indexOf('paintFigureCondition(ctx,id,'));
 assert.ok(heroSrc.indexOf('paintFigureEdgeInk(ctx,id,pose,{fallen})')<
  heroSrc.indexOf('paintWeaponRig(ctx,id,'));
 const foeSrc=src.slice(src.indexOf('export function drawFoe'));
 assert.ok(foeSrc.indexOf('paintFigureEdgeInk(ctx,foe.id')<foeSrc.indexOf('paintFigureCondition(ctx,foe.id'));
});

test('full battle remains pure with new character art, offline assets, untouched controls',()=>{
 const s=setMovementBoard(createCommandState(),{columns:8,rows:6});
 const before=JSON.stringify(s),ctx=ink();
 renderBoard(ctx,measureBoard(440,290),null,{actorId:s.actorId,positions:s.positions,
  targets:s.targets,partyHp:s.partyHp,guards:s.guards,ended:s.ended,intents:[]});
 balanced(ctx);assert.equal(JSON.stringify(s),before);
 const art=fs.readFileSync('src/board/figure-edge-ink.js','utf8');
 assert.doesNotMatch(art,/Math\.random|setInterval|setTimeout|fetch\(|window\.|document\.|localStorage|addEventListener|requestAnimationFrame/);
 const worker=fs.readFileSync('service-worker.js','utf8');
 assert.ok(worker.includes('v0.09-gate-a24-r1'));
 assert.equal(worker.split("'./src/board/figure-edge-ink.js'").length-1,1);
 for(const id of heroes)assert.equal(worker.split("'./art/portraits/"+id+".svg'").length-1,1);
});
