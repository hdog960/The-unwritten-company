import test from 'node:test';
import assert from 'node:assert/strict';
import {FIGURE_AURAS,paintLanternPools,paintMiniatureBackdrop,paintMiniatureFootlights} from '../src/board/illumination.js';
import {measureBoard,cellRect,getTile} from '../src/board/geometry.js';
import {renderBoard} from '../src/board/scene.js';
import {createCommandState,setMovementBoard} from '../src/commands/engine.js';
const board=measureBoard(435,286);
function ink(){
  const calls=[],gradients=[];
  const ctx={calls,gradients,globalAlpha:1};
  const fn=k=>(...args)=>{calls.push([k,...args])};
  for(const key of ['save','restore','beginPath','closePath','moveTo','lineTo','arc','ellipse','rect','clip','fill','stroke','fillRect','strokeRect','bezierCurveTo','quadraticCurveTo','translate','scale','setLineDash'])
    ctx[key]=fn(key);
  const gradient=kind=>(...p)=>{
    const stops=[];
    gradients.push({kind,p,stops});
    return {addColorStop:(at,color)=>stops.push([at,color])};
  };
  ctx.createRadialGradient=gradient('radial');
  ctx.createLinearGradient=gradient('linear');
  return ctx;
}
const balanced=ctx=>assert.equal(ctx.calls.filter(c=>c[0]==='save').length,ctx.calls.filter(c=>c[0]==='restore').length);
test('original lantern/cold-water washes draw deterministic broad map-clipped light sources',()=>{
  const a=ink(),b=ink(),source=(row,col)=>getTile(row,col);
  const n=paintLanternPools(a,board,source),m=paintLanternPools(b,board,source);
  assert.ok(n>=1,'authored lantern glyph must illuminate the playfield');
  assert.equal(n,m);assert.deepEqual(a.calls,b.calls);assert.deepEqual(a.gradients,b.gradients);
  assert.ok(a.calls.some(c=>c[0]==='clip'));
  assert.ok(a.gradients.some(g=>g.kind==='radial'&&g.stops.length>=3));
  balanced(a);
  assert.equal(paintLanternPools(null,board,source),0);
});
test('six distinct source-ink auras preserve mini geometry at small phone tiles',()=>{
  const names=Object.keys(FIGURE_AURAS);
  assert.deepEqual(names,['captain','brunna','kess','mirelle','briar','shade']);
  for(const size of [34,38,54,69]){
    for(const id of names){
      const ctx=ink(),rect={x:10,y:12,width:size,height:size},copy=JSON.stringify(rect);
      assert.equal(paintMiniatureBackdrop(ctx,rect,id,{active:id==='captain',hp:7,maxHp:20}),true);
      assert.equal(paintMiniatureFootlights(ctx,rect,id,{active:id==='captain'}),true);
      assert.equal(JSON.stringify(rect),copy);
      assert.ok(ctx.calls.some(c=>c[0]==='ellipse'),'grounded pedestal shadow required '+id);
      assert.ok(ctx.gradients.length>=1,'paper silhouette backdrop should be illuminated');
      balanced(ctx);
    }
  }
});
test('injured, fallen and warded painter states never change original combat state or add UI overlays',()=>{
  const states=[{hp:4,maxHp:20,active:true},{hp:0,maxHp:20,fallen:true},{hp:20,maxHp:20}];
  const rect=cellRect(board,1,1);
  const signatures=[];
  for(const state of states){
    const a=ink(),before=JSON.stringify(state);
    assert.equal(paintMiniatureBackdrop(a,rect,'captain',state),true);
    assert.equal(paintMiniatureFootlights(a,rect,'captain',state),true);
    assert.equal(JSON.stringify(state),before);
    balanced(a);
    signatures.push(a.calls);
  }
  assert.notDeepEqual(signatures[0],signatures[1],'dead heroes have no bright painted aureole');
  assert.equal(paintMiniatureBackdrop(ink(),rect,'bad-id'),false);
});
test('the illuminated battlefield still composes with real hero/foe targets and clipped world effects',()=>{
  const game=setMovementBoard(createCommandState(),{columns:8,rows:6}),ctx=ink();
  const before=JSON.stringify(game);
  renderBoard(ctx,board,null,{actorId:'captain',positions:game.positions,targets:game.targets,
    partyHp:game.partyHp,guards:game.guards,intents:[]});
  assert.equal(JSON.stringify(game),before);
  assert.ok(ctx.calls.length>1400,'detail must enrich rather than replace board rendering');
  assert.ok(ctx.calls.some(c=>c[0]==='clip'));
  balanced(ctx);
});
