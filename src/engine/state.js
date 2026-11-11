import { REGIONS, CONTRACTS } from '../content/catalog.js';
import { chooseDeterministic } from './random.js';

export function normalizeSeed(input) {
  return String(input ?? '').replace(/[^A-Za-z0-9 _-]/g, '').trim().slice(0, 32) || 'Lantern-001';
}
export function buildPreview(seedInput) {
  const seed = normalizeSeed(seedInput);
  const region = chooseDeterministic(REGIONS, seed, 'region');
  const contract = chooseDeterministic(CONTRACTS, seed, 'premise');
  return Object.freeze({
    seed,region:region.name,landscape:region.tag,title:contract.title,crisis:contract.crisis,
    dilemma:contract.choice, playable:false
  });
}
export function createInitialState() {
  return Object.freeze({ seed:'Lantern-001',preview:null,version:'0.08',isPlayable:false });
}
export function reduce(state,action) {
  if (action.type === 'SEED_CHANGED') return Object.freeze({ ...state,seed:normalizeSeed(action.seed),preview:null });
  if (action.type === 'PREVIEW_REQUESTED') return Object.freeze({ ...state,preview:buildPreview(state.seed) });
  if (action.type === 'RESET') return createInitialState();
  return state;
}
