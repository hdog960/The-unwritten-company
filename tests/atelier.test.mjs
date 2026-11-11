import test from 'node:test';
import assert from 'node:assert/strict';
import {ATELIER_TERRAINS,TEAM_INKS,paintAtelierTile,paintBoardLighting,paintUnitStand} from '../src/board/atelier.js';
import {miniaturePose,renderBoard} from '../src/board/scene.js';
import {drawHero,drawFoe} from '../src/board/miniatures.js';
import {drawWorldEffect,EFFECT_DURATION_MS} from '../src/board/effects.js';
import {measureBoard,cellRect} from '../src/board/geometry.js';
import {createCommandState,setMovementBoard,chooseMove,chooseTarget,chooseAbility,confirmPreview,changeActor,remainingAp,remainingMove} from '../src/commands/engine.js';
const board=measureBoard(435,286);
const p=(column,row)=>({column,row});
function ink(){
  const calls=[];
  const colors=[];
  const ctx={calls,colors};
  const action=(name)=>(...args)=>{calls.push([name,...args]);};
  for(const name of ['save','restore','beginPath','closePath','moveTo','lineTo','quadraticCurveTo','arc','ellipse','rect','clip','fill','stroke','fillRect','strokeRect','translate','scale','setLineDash','bezierCurveTo'])ctx[name]=action(name);
  const gradient=(label)=>(...args)=>({label,args,addColorStop:(at,color)=>colors.push([label,at,color])});
  ctx.createLinearGradient=gradient('linear');ctx.createRadialGradient=gradient('radial');
  return ctx;
}
test('five terrain families use hand-authored, repeatable canvas layers at touch-sized cells',()=>{
  assert.deepEqual(ATELIER_TERRAINS,['stone','moss','water','rubble','glyph']);
  for(const s of [38,44,58,69]){
    for(const [i,kind] of ATELIER_TERRAINS.entries()){
      const rect={x:10,y:20,width:s,height:s};
      const first=ink(),second=ink();
      assert.equal(paintAtelierTile(first,rect,kind,i,2),true);
      assert.equal(paintAtelierTile(second,rect,kind,i,2),true);
      assert.deepEqual(first.calls,second.calls,'terrain geometry must be deterministic '+kind);
      assert.deepEqual(first.colors,second.colors,'terrain ink/material must be deterministic '+kind);
      assert.ok(first.calls.length>14,'each tile needs meaningful illustrated detail '+kind);
      assert.equal(first.calls.filter(c=>c[0]==='save').length,first.calls.filter(c=>c[0]==='restore').length,'ctx leak '+kind);
    }
  }
  assert.equal(paintAtelierTile(ink(),{x:0,y:0,width:40,height:40},'unknown',0,0),false);
});
test('world lighting is clipped to map rectangle, not side controls',()=>{
  const ctx=ink();
  assert.equal(paintBoardLighting(ctx,board),true);
  assert.ok(ctx.calls.some(c=>c[0]==='clip'));
  const rect=ctx.calls.find(c=>c[0]==='rect');
  assert.deepEqual(rect.slice(1),[board.x,board.y,board.mapWidth,board.mapHeight]);
  assert.equal(ctx.calls.filter(c=>c[0]==='save').length,ctx.calls.filter(c=>c[0]==='restore').length);
});
test('four original party pedestal tones, threat-low HP and Ward states paint without mutating inputs',()=>{
  assert.deepEqual(Object.keys(TEAM_INKS).sort(),['brunna','captain','kess','mirelle']);
  for(const id of Object.keys(TEAM_INKS)){
    for(const options of [{active:false,hp:17,maxHp:24,ward:false},{active:true,hp:4,maxHp:24,ward:true}]){
      const ctx=ink(),box={x:4,y:5,width:42,height:42},before=JSON.stringify(options);
      assert.equal(paintUnitStand(ctx,box,id,options),true);
      assert.equal(JSON.stringify(options),before,'paint is pure');
      assert.equal(ctx.calls.filter(c=>c[0]==='save').length,ctx.calls.filter(c=>c[0]==='restore').length);
      assert.ok(ctx.calls.some(c=>c[0]==='ellipse'),'pedestal should be grounded in terrain');
    }
  }
});
test('poses wait for windup, correct impact timing and grouped foe sequence',()=>{
  const from=p(1,1),to=p(2,1),third=p(3,1);
  const attack=(kind,progress)=>({event:{kind,from,to,token:kind},progress});
  assert.equal(miniaturePose(attack('hit',.22),from).kind,'attack');
  assert.equal(miniaturePose(attack('hit',.22),to),null,'target cannot recoil before projectile arrives');
  assert.equal(miniaturePose(attack('hit',.72),to).kind,'recoil');
  assert.equal(miniaturePose(attack('critical',.72),to).kind,'stagger');
  assert.equal(miniaturePose(attack('miss',.72),to),null,'an untouched target never recoils');
  assert.equal(miniaturePose(attack('hit',.72),third),null);
  assert.equal(miniaturePose(attack('hit',1),to),null,'finite visual reactions must end');
  const ward={event:{kind:'ward',from,to:from,token:'b'},progress:.4};
  assert.equal(miniaturePose(ward,from).kind,'ward');
  const travel={event:{kind:'move',from,to,token:'c',path:[from,to]},progress:.7};
  assert.deepEqual(miniaturePose(travel,to),{kind:'move',progress:.7});
  const phase=(progress)=>({event:{kind:'enemy-phase',token:'d',marks:[
    {kind:'miss',from,to},{kind:'hit',from:third,to:from}]},progress});
  assert.equal(miniaturePose(phase(.1),third),null,'second foe cannot act before its cue');
  assert.equal(miniaturePose(phase(.28),third).kind,'attack','second foe windup is staggered');
  assert.equal(miniaturePose(phase(.65),from).kind,'recoil','second foe impacts when its projectile arrives');
  assert.equal(miniaturePose(null,from),null);
});
test('sculpted figures and source-drawn FX are safe at 38px and 70px with poses',()=>{
  for(const size of [38,70]){
    const rect={x:1,y:1,width:size,height:size};
    for(const id of Object.keys(TEAM_INKS)){
      const ctx=ink();drawHero(ctx,rect,id,false,{kind:'attack',progress:.5});
      drawHero(ctx,rect,id,true,{kind:'recoil',progress:.25});
      assert.equal(ctx.calls.filter(c=>c[0]==='save').length,ctx.calls.filter(c=>c[0]==='restore').length);
    }
    for(const id of ['briar','shade']){
      const ctx=ink();drawFoe(ctx,rect,{id,hp:8,maxHp:13},null,{kind:'recoil',progress:.5});
      assert.equal(ctx.calls.filter(c=>c[0]==='save').length,ctx.calls.filter(c=>c[0]==='restore').length);
    }
  }
  assert.ok(EFFECT_DURATION_MS<=600&&EFFECT_DURATION_MS>=400);
  const ctx=ink();assert.equal(drawWorldEffect(ctx,board,{event:{kind:'hit',skillId:'spark',from:p(1,1),to:p(2,1),token:'a'},progress:.7}),true);
  assert.ok(ctx.calls.length>20);
  assert.equal(ctx.calls.filter(c=>c[0]==='save').length,ctx.calls.filter(c=>c[0]==='restore').length);
});
test('movement effect uses the proven legal route, not a cosmetic straight shortcut',()=>{
  let state=setMovementBoard(createCommandState(),{columns:8,rows:6});
  state=changeActor(state,'mirelle');
  const origin=state.positions.mirelle;
  const target=p(origin.column,origin.row-1);
  state=chooseTarget(chooseMove(state),target,{columns:8,rows:6});
  assert.equal(state.preview.valid,true);
  const expected=state.preview.path;
  state=confirmPreview(state,{columns:8,rows:6});
  assert.equal(state.visualEvent.kind,'move');
  assert.deepEqual(state.visualEvent.path,expected);
  assert.equal(remainingAp(state),2);
  assert.equal(remainingMove(state),4);
  const ctx=ink();assert.equal(drawWorldEffect(ctx,board,{event:state.visualEvent,progress:.43}),true);
});
test('source-drawn scene still clips lighting and renders real units, terrain and arrows',()=>{
  const ctx=ink();
  const s=setMovementBoard(createCommandState(),{columns:8,rows:6});
  renderBoard(ctx,board,p(1,1),{actorId:s.actorId,positions:s.positions,targets:s.targets,partyHp:s.partyHp,guards:s.guards,intents:[]});
  assert.ok(ctx.calls.length>300,'board composition should include painted tiles, figures and physical stands');
  assert.ok(ctx.calls.some(c=>c[0]==='fillRect'),'painted surfaces required');
  assert.equal(ctx.calls.filter(c=>c[0]==='save').length,ctx.calls.filter(c=>c[0]==='restore').length);
});
