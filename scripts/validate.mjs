import fs from 'node:fs';
import assert from 'node:assert/strict';

const html=fs.readFileSync('index.html','utf8');
const css=fs.readFileSync('styles.css','utf8');
const roadmap=fs.readFileSync('docs/ROADMAP.md','utf8');
assert.match(html,/src\/main\.js/);
assert.match(html,/styles\.css/);
assert.match(html,/No campaign playable yet/);
assert.match(html,/viewport-fit=cover/);
assert.match(html,/rel="manifest" href="\.\/manifest\.webmanifest"/);
assert.match(html,/apple-touch-icon/);
assert.match(html,/v0\.09/);
assert.match(html,/id="start-skirmish"/);
assert.match(html,/id="combat-summary"/);
assert.match(html,/id="command-move"/);
assert.match(html,/class="command-bottom"/);
assert.match(html,/id="command-view"/);
assert.match(html,/id="command-end-turn"/);
assert.match(html,/id="command-confirm"/);
assert.match(html,/id="party-roster"/);
assert.match(html,/id="party-readout"/);
assert.match(html,/id="chronicle-view"/);
assert.match(html,/<canvas id="battle-canvas"/);
assert.match(html,/id="battle-toggle"/);
assert.match(css,/\.stage\.board-mode:before\{display:none\}/);
assert.match(css,/grid-template-columns/);
assert.match(css,/safe-area-inset/);
assert.equal((roadmap.match(/^### v0\.\d{2} —/gm)??[]).length,99);
assert.equal((roadmap.match(/^### v1\.00 —/gm)??[]).length,1);
for (const file of ['README_START_HERE.md','DESIGN_BIBLE.md','UI_CONTROLS_AND_ART_DIRECTION.md','HANDHELD_CONTROLLER_LAYOUT.md','ROADMAP.md','NEW_CHAT_HANDOFF_PROMPT.txt','RELEASE_STATUS_TEMPLATE.md','RELEASE_STATUS.md']) {
  assert.ok(fs.statSync('docs/'+file).size>500,file+' must have meaningful content');
}
console.log('Foundation/PWA validation: 100 milestones, docs, icons, asset paths, responsive CSS — OK');

const miniature=fs.readFileSync('src/board/miniatures.js','utf8');
const effects=fs.readFileSync('src/board/effects.js','utf8');
assert.match(miniature,/drawCaptain/);
assert.match(miniature,/drawBrunna/);
assert.match(miniature,/drawKess/);
assert.match(miniature,/drawMirelle/);
assert.match(effects,/EFFECT_DURATION_MS/);

const atelier=fs.readFileSync('src/board/atelier.js','utf8');
assert.match(atelier,/paintAtelierTile/);
assert.match(atelier,/paintBoardLighting/);
assert.match(atelier,/paintUnitStand/);


const diorama=fs.readFileSync('src/board/diorama.js','utf8');
assert.match(diorama,/paintJoinedTerrain/);
assert.match(diorama,/paintGutterFiligree/);
assert.match(diorama,/paintUnitEmblem/);
assert.match(diorama,/paintThreatSymbol/);

for(const path of ['src/board/targeting.js','src/board/scenery.js','src/board/motion.js']){
  const contents=fs.readFileSync(path,'utf8');
  assert.ok(contents.length>200,'Missing Gate A module '+path);
}

const choreography=fs.readFileSync('src/board/choreography.js','utf8');
const shoreInk=fs.readFileSync('src/board/shoreline.js','utf8');
assert.match(choreography,/puppetPose/);
assert.match(shoreInk,/paintMaterialTransitions/);

const illumination=fs.readFileSync('src/board/illumination.js','utf8');
assert.match(illumination,/paintLanternPools/);
assert.match(illumination,/paintMiniatureBackdrop/);
assert.match(illumination,/paintMiniatureFootlights/);

const quill=fs.readFileSync('src/board/quill.js','utf8');
assert.match(quill,/paintQuillPreview/);
const relief=fs.readFileSync('src/board/relief.js','utf8');
assert.match(relief,/paintHeroEnamelStatus/);
