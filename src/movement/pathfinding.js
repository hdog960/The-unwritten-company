/** v0.06 — deterministic orthogonal Dijkstra movement, no combat/damage or persistence. */
import {getTile} from '../board/geometry.js';
import {PARTY_SLOTS} from '../party/model.js';

export const MAX_MOVEMENT = 5;
export const WALK_COST = Object.freeze({stone:1,moss:1,water:2,glyph:1});
export const BLOCKED_TERRAIN = Object.freeze(['rubble']);
const NEIGHBORS = Object.freeze([[0,-1],[1,0],[0,1],[-1,0]]);

export const tileKey = ({column,row}) => row+':'+column;
export const isOnBoard = (board,p)=>!!board&&Number.isInteger(board.columns)&&Number.isInteger(board.rows)&&Number.isInteger(p?.column)&&Number.isInteger(p?.row)&&p.column>=0&&p.row>=0&&p.column<board.columns&&p.row<board.rows;
export const isWalkable = (board,p)=>isOnBoard(board,p)&&Object.hasOwn(WALK_COST,getTile(p.row,p.column));
function same(a,b){return !!a&&!!b&&a.column===b.column&&a.row===b.row}
function freezePoint(p){return Object.freeze({column:p.column,row:p.row})}
function preferred(board,id){
  const spots={
    captain:{column:1,row:board.rows-2},
    brunna:{column:2,row:board.rows-1},
    kess:{column:board.columns-2,row:1},
    mirelle:{column:board.columns-2,row:board.rows-2}
  };
  return spots[id]??spots.captain;
}
/** Spawns are safe even on 4x3 boards, where preferred party positions collide. */
export function placeParty(board,previous=null){
  if(!board||!Number.isInteger(board.columns)||!Number.isInteger(board.rows)||board.columns<4||board.rows<3)throw new RangeError('Invalid playable board');
  const positions={},used=new Set();
  for(const member of PARTY_SLOTS){
    const wanted=previous?.[member.id]??preferred(board,member.id);
    let candidates=[];
    for(let row=0;row<board.rows;row++)for(let column=0;column<board.columns;column++){
      const candidate={column,row};
      if(!isWalkable(board,candidate)||used.has(tileKey(candidate)))continue;
      const distance=Math.abs(wanted.column-column)+Math.abs(wanted.row-row);
      candidates.push({candidate,distance});
    }
    candidates.sort((a,b)=>a.distance-b.distance||a.candidate.row-b.candidate.row||a.candidate.column-b.candidate.column);
    if(!candidates.length)throw new Error('No room for the company on this board');
    const pos=freezePoint(candidates[0].candidate);
    positions[member.id]=pos;used.add(tileKey(pos));
  }
  return Object.freeze(positions);
}
/** Same board + party state always yields same minimal-cost route; no diagonal cuts or ally phasing. */
export function shortestPath(board,from,to,positions={},movingId='captain'){
  if(!isOnBoard(board,from)||!isOnBoard(board,to))return Object.freeze({found:false,path:Object.freeze([]),cost:null,reason:'Tile is outside the map.'});
  if(!isWalkable(board,to))return Object.freeze({found:false,path:Object.freeze([]),cost:null,reason:'Rubble blocks this tile.'});
  const occupants=new Set(Object.entries(positions).filter(([id])=>id!==movingId).map(([,p])=>tileKey(p)));
  if(occupants.has(tileKey(to)))return Object.freeze({found:false,path:Object.freeze([]),cost:null,reason:'Another company member occupies that tile.'});
  if(same(from,to))return Object.freeze({found:false,path:Object.freeze([]),cost:0,reason:'Already standing here.'});
  const dist=new Map([[tileKey(from),0]]);
  const previous=new Map(),pending=[{p:from,cost:0}],settled=new Set();
  while(pending.length){
    pending.sort((a,b)=>a.cost-b.cost||a.p.row-b.p.row||a.p.column-b.p.column);
    const current=pending.shift(),key=tileKey(current.p);
    if(settled.has(key))continue;
    settled.add(key);
    if(same(current.p,to))break;
    for(const [dx,dy] of NEIGHBORS){
      const next={column:current.p.column+dx,row:current.p.row+dy};
      if(!isWalkable(board,next)||occupants.has(tileKey(next)))continue;
      const id=tileKey(next),cost=current.cost+WALK_COST[getTile(next.row,next.column)];
      if(cost<(dist.get(id)??Infinity)){
        dist.set(id,cost);previous.set(id,current.p);pending.push({p:next,cost});
      }
    }
  }
  const end=tileKey(to);
  if(!dist.has(end))return Object.freeze({found:false,path:Object.freeze([]),cost:null,reason:'No unblocked route reaches this tile.'});
  const path=[];let cursor=to;
  while(cursor){
    path.push(freezePoint(cursor));if(same(cursor,from))break;
    cursor=previous.get(tileKey(cursor));
  }
  path.reverse();
  if(!same(path[0],from))throw new Error('Broken route reconstruction');
  return Object.freeze({found:true,path:Object.freeze(path),cost:dist.get(end),reason:'Route found.'});
}
export function previewMovement(board,positions,actorId,target,remaining){
  const from=positions?.[actorId];
  if(!from||!isOnBoard(board,target))return Object.freeze({valid:false,cost:null,path:Object.freeze([]),reason:'Choose a tile on the board.'});
  const result=shortestPath(board,from,target,positions,actorId);
  if(!result.found)return Object.freeze({...result,valid:false});
  if(result.cost>remaining)return Object.freeze({...result,valid:false,reason:'Need '+result.cost+' movement, only '+remaining+' remaining.'});
  return Object.freeze({...result,valid:true,reason:'Move '+(result.path.length-1)+' step'+(result.path.length===2?'':'s')+' · cost '+result.cost+' movement. Confirm to travel.'});
}
export function moveActor(positions,id,target){
  if(!Object.hasOwn(positions,id))return positions;
  return Object.freeze({...positions,[id]:freezePoint(target)});
}
