import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {HERO_SILHOUETTES,FOE_SILHOUETTES,drawHero,drawFoe} from '../src/board/miniatures.js';
import {EFFECT_KINDS,EFFECT_DURATION_MS,isValidEffect,drawWorldEffect} from '../src/board/effects.js';
import {measureBoard,cellRect} from '../src/board/geometry.js';
import {createCommandState,setMovementBoard,chooseAbility,chooseTarget,confirmPreview,changeActor,chooseMove,endStudyTurn} from '../src/commands/engine.js';
import {startBattle,endBattleTurn} from '../src/battle/engine.js';
const board=measureBoard(435,286);
const p=(column,row)=>({column,row});
function mockCanvas(){
  const ctx={calls:[],createLinearGradient(){return{addColorStop(){}}},createRadialGradient(){return{addColorStop(){}}},
    save(){this.calls.push('save')},restore(){this.calls.push('restore')},
    translate(){},scale(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},quadraticCurveTo(){},
    ellipse(){},arc(){},stroke(){},fill(){},rect(){},clip(){},fillRect(){},strokeRect(){},
    setLineDash(){},getLineDash(){return []}};
  return ctx;
}
test('six original source-authored miniature silhouettes remain distinct',()=>{
  assert.deepEqual(HERO_SILHOUETTES,['captain','brunna','kess','mirelle']);
  assert.deepEqual(FOE_SILHOUETTES,['briar','shade']);
  const source=fs.readFileSync('src/board/miniatures.js','utf8');
  for(const label of ['Captain','Brunna','Kess','Mirelle'])assert.ok(source.includes('function draw'+label+'('),'missing '+label+' artwork');
  assert.ok(source.includes('function briar('));
  assert.ok(source.includes('function shade('));
  assert.ok(!source.includes('fetch(')&&!source.includes('https://'));

});
test('real art renderer paints all six figure variants at minimum 38px tile',()=>{
  for(const s of [38,44,58,68]){
    for(const id of HERO_SILHOUETTES){
      const ctx=mockCanvas(),box={x:10,y:10,width:s,height:s};
      drawHero(ctx,box,id);
      drawHero(ctx,box,id,true);
      assert.equal(ctx.calls.filter(x=>x==='save').length,ctx.calls.filter(x=>x==='restore').length,'save/restore leak in '+id);
    }
    for(const id of FOE_SILHOUETTES){
      const ctx=mockCanvas(),box={x:0,y:0,width:s,height:s};
      const enemy={id,hp:5,maxHp:13};
      drawFoe(ctx,box,enemy,null);
      drawFoe(ctx,box,{...enemy,hp:0},null);
      assert.equal(ctx.calls.filter(x=>x==='save').length,ctx.calls.filter(x=>x==='restore').length);
    }
  }
});
test('effects reject invalid frames and have a bounded subsecond duration',()=>{
  assert.equal(EFFECT_KINDS.length,6);
  assert.ok(EFFECT_DURATION_MS>=220&&EFFECT_DURATION_MS<=600);
  for(const invalid of [null,{}, {kind:'nope',token:'1'},{kind:'hit',token:''}])assert.equal(isValidEffect(invalid),false);
  for(const kind of EFFECT_KINDS)assert.equal(isValidEffect({kind,token:'art-1'}),true);
  const ctx=mockCanvas();
  assert.equal(drawWorldEffect(ctx,board,{event:null,progress:.5}),false);
});
test('hit, critical, miss, ward, move and grouped enemy FX paint without touching gameplay',()=>{
  const source=p(2,1),target=p(3,1);
  const cases=['hit','critical','miss','ward','move'].map(kind=>({kind,from:source,to:target,token:'fx-1'}));
  cases.push({kind:'enemy-phase',token:'fx-2',marks:[{kind:'hit',from:source,to:target},{kind:'miss',from:target,to:source}]});
  const ctx=mockCanvas();
  for(const event of cases){
    const before=JSON.stringify(event);
    for(const progress of [0,.25,.8,1]){
      assert.equal(drawWorldEffect(ctx,board,{event,progress}),true);
    }
    assert.equal(JSON.stringify(event),before,'FX must not mutate battle state');
  }
  assert.equal(ctx.calls.filter(x=>x==='save').length,ctx.calls.filter(x=>x==='restore').length);
});
test('actual AP and enemy state remain deterministic when visual events are attached',()=>{
  let state=setMovementBoard(createCommandState(),{columns:8,rows:6});
  state=changeActor(state,'kess');
  state=confirmPreview(chooseTarget(chooseAbility(state,'spark'),state.targets.briar.position,{columns:8,rows:6}),{columns:8,rows:6});
  assert.ok(['miss','hit','critical'].includes(state.visualEvent.kind));
  assert.equal(state.visualEvent.token,'action-1');
  const before=state.ap.kess;
  const target=state.visualEvent.to;
  assert.deepEqual(target,state.targets.briar.position);
  state=confirmPreview(chooseTarget(chooseAbility(state,'ward'),state.positions.kess,{columns:8,rows:6}),{columns:8,rows:6});
  assert.equal(state.visualEvent.kind,'ward');
  assert.equal(state.ap.kess,before-1);
  const battled=startBattle(state,{columns:8,rows:6});
  assert.equal(battled.visualEvent,null,'replay must clear stale VFX');
  let next=battled;
  for(let i=0;i<4;i++)next=endBattleTurn(next,{columns:8,rows:6});
  assert.equal(next.visualEvent.kind,'enemy-phase');
  assert.equal(next.visualEvent.marks.length,2);
});

test('enemy event brush marks are hidden until their own scheduled phase begins',()=>{
  const first={kind:'move',from:null,to:null}; // deliberately invisible mark
  const second={kind:'critical',from:p(3,1),to:p(4,1)};
  const event={kind:'enemy-phase',token:'stage-check',marks:[first,second]};
  const early=mockCanvas();
  assert.equal(drawWorldEffect(early,board,{event,progress:.12}),true);
  assert.ok(!early.calls.includes('arc'),'second enemy must not shoot before its .2 phase offset');
  const later=mockCanvas();
  assert.equal(drawWorldEffect(later,board,{event,progress:.7}),true);
  assert.ok(later.calls.includes('arc'),'second enemy shot arrives after its scheduled windup');
  const finished=mockCanvas();
  assert.equal(drawWorldEffect(finished,board,{event,progress:1}),true);
  assert.equal(finished.calls.filter(c=>c==='save').length,finished.calls.filter(c=>c==='restore').length);
});
