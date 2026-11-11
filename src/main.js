import { createInitialState, reduce } from './engine/state.js';
import { VERSION } from './content/catalog.js';
import { initPwa } from './platform/pwa.js';
import { createBoardPreview } from './board/scene.js';
import { createPartyRail } from './party/ui.js';
import { createCommandRail } from './commands/ui.js';

const form = document.getElementById('preview-form');
const input = document.getElementById('seed');
const preview = document.getElementById('preview');
let state = createInitialState();

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}
function render() {
  input.value = state.seed;
  preview.replaceChildren();
  if (!state.preview) {
    preview.append(element('p','Awaiting a seed','preview-label'));
    preview.append(element('p','A thousand possible troubles await your signature.','preview-empty'));
    return;
  }
  const p=state.preview;
  preview.append(element('p','CONTRACT GLIMPSE · NOT GAMEPLAY','preview-label'));
  preview.append(element('strong',p.title));
  const description=element('p','In ' + p.region + ', among ' + p.landscape + '.','preview-details');
  preview.append(description);
  const details=element('dl');
  [['The trouble',p.crisis],['The question',p.dilemma]].forEach(([title,body])=>{
    details.append(element('dt',title));
    details.append(element('dd',body));
  });
  preview.append(details);
}
form.addEventListener('submit',event=>{
  event.preventDefault();
  state=reduce(state,{type:'SEED_CHANGED',seed:input.value});
  state=reduce(state,{type:'PREVIEW_REQUESTED'});
  render();
});
document.documentElement.dataset.release=VERSION;
render();

initPwa({online:document.getElementById('network-status'),offline:document.getElementById('offline-status')});

let commandRail;
const partyRail=createPartyRail({
  chronicle:document.getElementById('chronicle-view'),
  party:document.getElementById('party-view'),
  roster:document.getElementById('party-roster'),
  readout:document.getElementById('party-readout'),
  onSelect:id=>commandRail?.selectActor(id)
});

const boardPreview=createBoardPreview({
  stage:document.querySelector('.stage'),
  story:document.getElementById('story-view'),
  container:document.getElementById('battle-surface'),
  canvas:document.getElementById('battle-canvas'),
  toggle:document.getElementById('battle-toggle'),
  status:document.getElementById('battle-status'),
  onModeChange:isBoard=>{
    partyRail.setMode(isBoard);
    if(isBoard)commandRail?.setSeed(document.getElementById('seed')?.value);
    commandRail?.setMode(isBoard);
  },
  onCellSelect:(cell,board)=>commandRail?.targetCell(cell,board),
  onEscape:()=>commandRail?.cancelPending(),
  onBoardReady:board=>commandRail?.setBoard(board)
});


commandRail=createCommandRail({
  rail:document.querySelector('.right-rail'),
  story:document.getElementById('right-story'),
  view:document.getElementById('command-view'),
  toggle:document.getElementById('battle-toggle'),
  apValue:document.getElementById('command-ap'),
  turnValue:document.getElementById('command-turn'),
  combatSummary:document.getElementById('combat-summary'),
  onPartyChange:partyRail.updateBattle,
  skillGrid:document.getElementById('command-skills'),
  readout:document.getElementById('command-readout'),
  confirm:document.getElementById('command-confirm'),
  cancel:document.getElementById('command-cancel'),
  endTurn:document.getElementById('command-end-turn'),
  move:document.getElementById('command-move'),
  onOverlayChange:preview=>boardPreview?.setCommandOverlay(preview)
});

document.getElementById('start-skirmish').addEventListener('click',()=>{
  const seed=document.getElementById('seed').value;
  if(document.getElementById('battle-surface').hidden){
    document.getElementById('battle-toggle').click();
    // Opening the board measures its live rectangle on the next animation frame.
    // The skirmish must start only after that measurement has finished.
    requestAnimationFrame(()=>commandRail?.beginSkirmish(seed));
  }else commandRail?.beginSkirmish(seed);
});
