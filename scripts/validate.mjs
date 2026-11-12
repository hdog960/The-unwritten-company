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

for(const name of ['relief','quill']){
 const art=fs.readFileSync('src/board/'+name+'.js','utf8');
 assert.ok(art.length>900,'Original source art is missing: '+name);
}

const engraving=fs.readFileSync('src/board/battle-engraving.js','utf8');
assert.match(engraving,/paintThreatEngravings/);
assert.match(engraving,/paintTravelEngraving/);

const fragments=fs.readFileSync('src/board/impact-fragments.js','utf8');
assert.match(fragments,/paintImpactFragments/);

const pressRuins=fs.readFileSync('src/board/press-ruins.js','utf8');
const paperPuppets=fs.readFileSync('src/board/paper-puppets.js','utf8');
assert.match(pressRuins,/paintPressRelics/);
assert.match(paperPuppets,/paintPuppetShadow/);

const articulated=fs.readFileSync('src/board/weapon-rigs.js','utf8');
assert.match(articulated,/paintWeaponRig/);
assert.match(miniature,/paintWeaponRig/);

const clothSource=fs.readFileSync('src/board/articulated-cloth.js','utf8');
assert.match(clothSource,/paintArticulatedCloth/);
assert.match(miniature,/paintArticulatedCloth/);

const rhythm=fs.readFileSync('src/board/combat-beats.js','utf8');
const joints=fs.readFileSync('src/board/pose-gestures.js','utf8');
assert.match(rhythm,/attackBeat/);
assert.match(joints,/paintGestureJoints/);
assert.match(miniature,/paintGestureJoints/);

const actionSeals=fs.readFileSync('src/board/action-seals.js','utf8');
assert.match(actionSeals,/paintActionSeal/);
assert.match(fs.readFileSync('src/board/scene.js','utf8'),/paintActionSeal/);

const conditionArt=fs.readFileSync('src/board/figure-condition.js','utf8');
assert.match(conditionArt,/paintFigureCondition/);
assert.match(miniature,/paintFigureCondition/);

const sculpturalInk=fs.readFileSync('src/board/figure-relief.js','utf8');
const tileBevelInk=fs.readFileSync('src/board/tile-relief.js','utf8');
assert.match(sculpturalInk,/paintFigureRelief/);
assert.match(tileBevelInk,/paintTileRelief/);
assert.match(miniature,/paintFigureRelief/);
assert.match(fs.readFileSync('src/board/scene.js','utf8'),/paintTileRelief/);

const visageSource=fs.readFileSync('src/board/visages.js','utf8');
assert.match(visageSource,/paintVisage/);
assert.match(miniature,/paintVisage/);

const bearingInk=fs.readFileSync('src/board/bearings.js','utf8');
assert.match(bearingInk,/combatBearing/);
assert.match(fs.readFileSync('src/board/scene.js','utf8'),/bearingPose/);

const habitatInk=fs.readFileSync('src/board/paper-habitat.js','utf8');
assert.match(habitatInk,/paintPaperHabitat/);
assert.match(fs.readFileSync('src/board/scene.js','utf8'),/paintPaperHabitat/);

const figureEdgeSource=fs.readFileSync('src/board/figure-edge-ink.js','utf8');
assert.match(figureEdgeSource,/paintFigureEdgeInk/);
assert.match(miniature,/paintFigureEdgeInk/);
