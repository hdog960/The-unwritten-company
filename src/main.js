import { createInitialState, reduce } from './engine/state.js';
import { VERSION } from './content/catalog.js';

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
