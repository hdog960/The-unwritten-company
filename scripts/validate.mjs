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

const miniature=readFile('src/board/miniatures.js');
const effects=readFile('src/board/effects.js');
assert.match(miniature,/drawCaptain/);
assert.match(miniature,/drawBrunna/);
assert.match(miniature,/drawKess/);
assert.match(miniature,/drawMirelle/);
assert.match(effects,/EFFECT_DURATION_MS/);
