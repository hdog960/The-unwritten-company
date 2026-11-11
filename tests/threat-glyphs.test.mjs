import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {threatGlyphs,paintThreatEngravings} from '../src/board/battle-engraving.js';
import {measureBoard} from '../src/board/geometry.js';
const board=measureBoard(435,286),positions={kess:{column:1,row:3},captain:{column:2,row:4}};
function ink(){
 const calls=[],ctx={calls};
 for(const name of ['save','restore','beginPath','closePath','moveTo','lineTo','arc','stroke','fill',
  'rect','clip','setLineDash','bezierCurveTo'])ctx[name]=(...args)=>calls.push([name,...args]);
 return ctx;
}
test('threat icons aggregate each hero once and imminent attacks outrank approach',()=>{
 const intents=[{foeId:'shade',from:{column:5,row:1},victimId:'kess',attack:false},
  {foeId:'briar',from:{column:6,row:2},victimId:'kess',attack:true},
  {foeId:'other',from:{column:1,row:0},victimId:'captain',attack:false}];
 const original=JSON.stringify(intents),glyphs=threatGlyphs(intents,positions);
 assert.equal(glyphs.length,2);
 assert.deepEqual(glyphs.map(x=>[x.victimId,x.attack]),[['kess',true],['captain',false]]);
 assert.ok(Object.isFrozen(glyphs)&&glyphs.every(Object.isFrozen));
 assert.equal(JSON.stringify(intents),original);
 assert.deepEqual(threatGlyphs(intents.toReversed(),positions).find(x=>x.victimId==='kess').attack,true);
 assert.deepEqual(threatGlyphs(null,positions),[]);
 assert.deepEqual(threatGlyphs([{victimId:'missing',attack:true}],positions),[]);
 const ctx=ink();
 assert.equal(paintThreatEngravings(ctx,board,intents,positions),3);
 assert.equal(ctx.calls.filter(x=>x[0]==='arc').length,2,'one rim per hero');
 assert.equal(ctx.calls.filter(x=>x[0]==='save').length,ctx.calls.filter(x=>x[0]==='restore').length);
});
test('scene draws only aggregated threat glyphs; does not install canvas-overlaid controls',()=>{
 const s=fs.readFileSync('src/board/scene.js','utf8');
 assert.match(s,/for\(const glyph of threatGlyphs/);
 assert.doesNotMatch(s,/for\(const intent of overlay\?\.intents\?\?\[\]\)/);
 assert.ok(s.indexOf('paintThreatEngravings(')<s.indexOf('drawHero('));
});
