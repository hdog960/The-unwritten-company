import test from 'node:test';
import assert from 'node:assert/strict';
import {paintJoinedTerrain,paintGutterFiligree,paintUnitEmblem,paintThreatSymbol} from '../src/board/diorama.js';
import {drawHero,drawFoe} from '../src/board/miniatures.js';
import {renderBoard} from '../src/board/scene.js';
import {measureBoard} from '../src/board/geometry.js';
import {createCommandState,setMovementBoard} from '../src/commands/engine.js';

function ink(){
  const calls=[],pigments=[];
  const ctx={calls,pigments};
  const method=key=>(...args)=>calls.push([key,...args]);
  for(const name of ['save','restore','beginPath','closePath','moveTo','lineTo','quadraticCurveTo','bezierCurveTo',
    'arc','ellipse','rect','clip','fill','stroke','fillRect','strokeRect','translate','scale','setLineDash'])
    ctx[name]=method(name);
  const gradient=label=>(...params)=>({addColorStop:(p,c)=>pigments.push([label,p,c]),params});
  ctx.createLinearGradient=gradient('linear');
  ctx.createRadialGradient=gradient('radial');
  return ctx;
}
const board=measureBoard(440,290);
const box=(s=42)=>({x:10,y:12,width:s,height:s});
const paired=()=>{
  const land=Array.from({length:board.rows},()=>Array(board.columns).fill('stone'));
  land[0][0]='water';land[0][1]='water';land[1][0]='water';land[1][1]='water';
  land[2][2]='moss';land[2][3]='moss';land[3][2]='moss';land[3][3]='moss';
  return (r,c)=>land[r]?.[c]??'stone';
};
test('connected streams and ivy bridge only adjacent matching terrain and are fully deterministic',()=>{
  const f=paired(),first=ink(),second=ink();
  const count=paintJoinedTerrain(first,board,f),next=paintJoinedTerrain(second,board,f);
  assert.ok(count>=8,'multiple adjacent water/moss seams must join visibly');
  assert.equal(next,count);
  assert.deepEqual(first.calls,second.calls);
  assert.deepEqual(first.pigments,second.pigments);
  assert.ok(first.calls.some(c=>c[0]==='bezierCurveTo'),'connected water needs continuous curves');
  assert.equal(first.calls.filter(c=>c[0]==='save').length,first.calls.filter(c=>c[0]==='restore').length);
});
test('terrain joiner never changes terrain types, positions or geometry',()=>{
  const f=paired(),original=JSON.stringify(board),before=Array.from({length:board.rows},(_,r)=>Array.from({length:board.columns},(_,c)=>f(r,c)));
  const painter=ink();
  paintJoinedTerrain(painter,board,f);
  assert.equal(JSON.stringify(board),original);
  assert.deepEqual(Array.from({length:board.rows},(_,r)=>Array.from({length:board.columns},(_,c)=>f(r,c))),before);
  assert.ok(painter.calls.some(c=>c[0]==='clip'),'paint must be clipped to the battlefield');
});
test('storybook filigree is allowed in gutters and avoids boards with zero rim space',()=>{
  const normal=ink();
  assert.equal(paintGutterFiligree(normal,board),true);
  assert.ok(normal.calls.length>=20);
  assert.equal(normal.calls.filter(c=>c[0]==='save').length,normal.calls.filter(c=>c[0]==='restore').length);
  const noRoom={...board,x:1,y:1};
  assert.equal(paintGutterFiligree(ink(),noRoom),false);
});
test('each hero has a geometrically distinct, contrast-safe in-world sigil',()=>{
  const ids=['captain','brunna','kess','mirelle'],signatures=[];
  for(const id of ids){
    const ctx=ink();const rect=box(38);
    assert.equal(paintUnitEmblem(ctx,rect,id,true),true);
    assert.equal(paintUnitEmblem(ctx,rect,id,false),true);
    signatures.push(JSON.stringify(ctx.calls.filter(x=>['moveTo','lineTo','quadraticCurveTo'].includes(x[0]))));
    assert.equal(ctx.calls.filter(c=>c[0]==='save').length,ctx.calls.filter(c=>c[0]==='restore').length);
  }
  assert.equal(new Set(signatures).size,4,'four ink symbols must be distinguishable by shape, not just color');
  assert.equal(paintUnitEmblem(ink(),box(),'unknown',true),false);
});
test('enemy threat and approach icons use different geometries, not just different ink colors',()=>{
  const attack=ink(),approach=ink();
  assert.equal(paintThreatSymbol(attack,box(39),true),true);
  assert.equal(paintThreatSymbol(approach,box(39),false),true);
  assert.notDeepEqual(attack.calls,approach.calls);
  assert.ok(attack.calls.length>approach.calls.length,'an explicit attack exclamation distinguishes danger');
  assert.equal(attack.calls.filter(c=>c[0]==='save').length,attack.calls.filter(c=>c[0]==='restore').length);
});
test('six figure enamel and stitching passes render at all three phone tile sizes and recoil poses',()=>{
  for(const size of [38,42,62]){
    for(const id of ['captain','brunna','kess','mirelle']){
      const ctx=ink();
      drawHero(ctx,box(size),id,false,{kind:'attack',progress:.5});
      drawHero(ctx,box(size),id,false,{kind:'ward',progress:.2});
      assert.ok(ctx.calls.length>85,'rich silhouette '+id+' at '+size+'px');
      assert.equal(ctx.calls.filter(c=>c[0]==='save').length,ctx.calls.filter(c=>c[0]==='restore').length);
    }
    for(const id of ['briar','shade']){
      const ctx=ink();
      drawFoe(ctx,box(size),{id,hp:10,maxHp:13},null,{kind:'recoil',progress:.5});
      assert.ok(ctx.calls.length>55,'readable enemy miniature '+id);
      assert.equal(ctx.calls.filter(c=>c[0]==='save').length,ctx.calls.filter(c=>c[0]==='restore').length);
    }
  }
});
test('complete diorama still draws with original game party and foe positions',()=>{
  const s=setMovementBoard(createCommandState(),{columns:8,rows:6}),ctx=ink();
  renderBoard(ctx,board,null,{actorId:s.actorId,positions:s.positions,targets:s.targets,partyHp:s.partyHp,
    guards:s.guards,intents:[{from:s.targets.briar.position,victimId:'kess',attack:true}]});
  assert.ok(ctx.calls.length>1600,'actual rendered scene includes tile grain, continuities, characters and threats');
  assert.equal(ctx.calls.filter(c=>c[0]==='save').length,ctx.calls.filter(c=>c[0]==='restore').length);
});
