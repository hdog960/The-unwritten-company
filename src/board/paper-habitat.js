/** Gate A 18: a physical cut-paper river and hand-inked moss habitat.
 *
 * These are not grid hints, interactive surfaces or new movement costs.
 * Adjacent real water cells share a continuous indigo ink current; their
 * exposed banks expose layered cut-card vellum, not blue square outlines.
 * Adjacent moss cells share etched ivy stems, petals and candle-gilt buds.
 * Only *unoccupied* moss receives dense leaf painting, to protect figure
 * silhouettes, existing legal markers and tiny iPhone screen readability.
 *
 * No timer, DOM, RNG, network, save, click region or engine modification.
 */
import {cellRect} from './geometry.js';

export const HABITAT_KINDS=Object.freeze(['water','moss']);
export const HABITAT_EDGES=Object.freeze(['north','east','south','west']);
const EDGE_STEPS=Object.freeze([
 Object.freeze({edge:'north',dr:-1,dc:0}),
 Object.freeze({edge:'east',dr:0,dc:1}),
 Object.freeze({edge:'south',dr:1,dc:0}),
 Object.freeze({edge:'west',dr:0,dc:-1})
]);
const inside=(b,r,c)=>r>=0&&c>=0&&r<b.rows&&c<b.columns;
const place=(p)=>p&&Number.isInteger(p.column)&&Number.isInteger(p.row);
const pen=(ctx,coords,color,weight)=>{
 ctx.beginPath();ctx.moveTo(...coords[0]);for(const v of coords.slice(1))ctx.lineTo(...v);
 ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle=color;ctx.lineWidth=weight;ctx.stroke();
};
const shape=(ctx,coords,fill,edge=null,w=1)=>{
 ctx.beginPath();ctx.moveTo(...coords[0]);for(const v of coords.slice(1))ctx.lineTo(...v);
 ctx.closePath();ctx.fillStyle=fill;ctx.fill();
 if(edge){ctx.strokeStyle=edge;ctx.lineWidth=w;ctx.stroke();}
};
const dot=(ctx,x,y,r,color)=>{
 ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();
};
/** Pure, frozen plan. Occupancy changes only what is *drawn*, never terrain,
 * logical cells, click coordinates, legal move/target marks or enemy AI. */
export function habitatPlan(board,tileAt,occupied=[]){
 if(!board||!Number.isInteger(board.rows)||!Number.isInteger(board.columns)||
  typeof tileAt!=='function'||!Array.isArray(occupied))return Object.freeze([]);
 const claimed=new Set(occupied.filter(place).map(p=>p.row+':'+p.column));
 const result=[];
 for(let row=0;row<board.rows;row++)for(let col=0;col<board.columns;col++){
  const kind=tileAt(row,col);
  if(!HABITAT_KINDS.includes(kind))continue;
  const rect=cellRect(board,col,row);
  if(!rect)continue;
  const linked=Object.freeze(HABITAT_EDGES.filter(edge=>{
   const step=EDGE_STEPS.find(s=>s.edge===edge);
   return inside(board,row+step.dr,col+step.dc)&&tileAt(row+step.dr,col+step.dc)===kind;
  }));
  const object=Object.freeze({
   row,column:col,kind,rect,
   variant:((row*13+col*7)%3+3)%3,
   linked,
   // An occupied moss tile stays legible: no detail behind the miniature.
   quiet:kind==='moss'&&claimed.has(row+':'+col)
  });
  result.push(object);
 }
 return Object.freeze(result);
}
const isLinked=(feature,dir)=>feature.linked.includes(dir);
const clamp=t=>Math.min(.98,Math.max(.02,t));
function loc(feature,x,y){
 const r=feature.rect;
 return [r.x+r.width*clamp(x),r.y+r.width*clamp(y)];
}
const trace=(feature,points)=>points.map(([x,y])=>loc(feature,x,y));
function riverBank(ctx,feature,side){
 const right=side==='east',s=feature.rect.width,
  mx=x=>right?1-x:x;
 const depth=trace(feature,[[.025,.025],[.165,.09],[.11,.19],[.205,.29],
  [.115,.41],[.18,.55],[.105,.65],[.2,.8],[.12,.93],[.025,.975]].map(([x,y])=>[mx(x),y]));
 const top=trace(feature,[[.045,.04],[.195,.14],[.145,.25],[.215,.34],
  [.135,.45],[.205,.60],[.13,.72],[.195,.88],[.065,.96]].map(([x,y])=>[mx(x),y]));
 const lip=trace(feature,[[.165,.09],[.11,.19],[.205,.29],[.115,.41],
  [.18,.55],[.105,.65],[.2,.8],[.12,.93]].map(([x,y])=>[mx(x),y]));
 shape(ctx,depth,'#1c3641','#233b42',s*.024);
 shape(ctx,top,'#b9a98a','#584f49',s*.026);
 pen(ctx,lip,'#ecddae',Math.max(1,s*.025));
 // A thin exposed blue-green underpaint edge separates water from paper.
 const glint=trace(feature,[[.208,.29],[.2,.43],[.19,.56],[.21,.81]].map(([x,y])=>[mx(x),y]));
 pen(ctx,glint,'#82b6aa',Math.max(.7,s*.016));
}
function riverEnd(ctx,feature,edge){
 const south=edge==='south',s=feature.rect.width,my=y=>south?1-y:y;
 shape(ctx,trace(feature,[[.06,.035],[.25,.085],[.39,.035],[.53,.085],
  [.74,.04],[.94,.065],[.94,.13],[.7,.115],[.5,.14],
  [.33,.105],[.1,.16]].map(([x,y])=>[x,my(y)])),
  '#c7b79c','#5e5a52',Math.max(.8,s*.018));
 pen(ctx,trace(feature,[[.18,.16],[.38,.12],[.55,.16],[.75,.13]].map(([x,y])=>[x,my(y)])),
  '#efe2bd',Math.max(.7,s*.016));
}
function riverFlow(ctx,feature){
 const s=feature.rect.width,v=feature.variant;
 // Each water segment enters and leaves at the same x so a two-cell
 // canal reads as one continuous piece of flowing indigo-glazed paper.
 const current=trace(feature,[[.51,.045],[.48,.17],[.53,.31],[.49,.48],
  [.54,.64],[.49,.80],[.51,.955]]);
 pen(ctx,current,'#0b374d',Math.max(2,s*.063));
 pen(ctx,current,'#80c5c4',Math.max(1,s*.027));
 const offset=(v-1)*.012;
 const companion=trace(feature,[[.39,.11],[.37+offset,.29],[.42,.46],
  [.38,.68],[.41,.88]]);
 pen(ctx,companion,'#508f99',Math.max(.7,s*.022));
 const foam=trace(feature,[[.60,.17],[.65,.235],[.60,.315],[.67,.41]]);
 pen(ctx,foam,'#c2e7d0',Math.max(.8,s*.021));
 const gleam=trace(feature,[[.55,.65],[.58,.69],[.55,.75],[.6,.79]]);
 pen(ctx,gleam,'#d7ebce',Math.max(.7,s*.017));
 // Water never draws a clickable arrow, crosshair or HUD glyph.
}
function mossVines(ctx,feature){
 const s=feature.rect.width;
 const left=isLinked(feature,'west'),right=isLinked(feature,'east'),
  north=isLinked(feature,'north'),south=isLinked(feature,'south');
 const v=feature.variant;
 const x1=left?.028:.20,x2=right?.972:.83;
 const spine=trace(feature,[[x1,.54],[.23,.5],[.36,.55],
  [.52,.47],[.67,.54],[x2,.51]]);
 pen(ctx,spine,'#203f35',Math.max(2,s*.059));
 pen(ctx,spine,'#82aa77',Math.max(.8,s*.023));
 // Vertical connection exists only when neighboring cells are actually moss.
 if(north||south){
  const s1=north?.024:.30,s2=south?.976:.74;
  const stalk=trace(feature,[[.55,s1],[.52,.29],[.62,.51],[.56,.72],[.55,s2]]);
  pen(ctx,stalk,'#244a38',Math.max(1,s*.038));
  pen(ctx,stalk,'#bed09a',Math.max(.8,s*.016));
 }
 // Hand-cut asymmetric leaves: their angles and counts are fixed per tile.
 const stems=[[.27,.5,-1],[.39,.53,1],[.56,.48,-1],[.7,.53,1]];
 for(let i=0;i<stems.length;i++){
  const [x,y,side]=stems[i],bend=(v-1)*.024;
  const rise=(i%2===0?-.18:.17)*side;
  const tip=[x+bend+(side<0?-.09:.09),y+rise];
  const leaf=trace(feature,[[x,y],[x-.075,y+rise*.36],tip,
    [x+.067,y+rise*.64]]);
  shape(ctx,leaf,i%2?'#7c9d70':'#9bb47e','#385947',Math.max(.8,s*.018));
  pen(ctx,trace(feature,[[x,y],tip]),'#d7d4a0',Math.max(.65,s*.014));
 }
 dot(ctx,...loc(feature,.48,.28),Math.max(.85,s*.022),'#e4d3a0');
 dot(ctx,...loc(feature,.73,.72),Math.max(.8,s*.018),'#d1bd8c');
 // Existing glyph and actual threatened unit margins always render later.
}
/** Return number of real habitat tiles drawn. The river's bank and water
 * geometry is clipped to native cells; unit footlights and legal targets
 * always render ABOVE it in scene.js.
 */
export function paintPaperHabitat(ctx,board,tileAt,occupied=[]){
 if(!ctx)return 0;
 const plan=habitatPlan(board,tileAt,occupied);
 let count=0;
 for(const item of plan){
  if(item.quiet)continue;
  const r=item.rect,s=r.width;
  ctx.save();ctx.beginPath();
  ctx.rect(r.x+1,r.y+1,s-2,s-2);ctx.clip();
  if(item.kind==='water'){
   riverFlow(ctx,item);
   if(!isLinked(item,'west'))riverBank(ctx,item,'west');
   if(!isLinked(item,'east'))riverBank(ctx,item,'east');
   if(!isLinked(item,'north'))riverEnd(ctx,item,'north');
   if(!isLinked(item,'south'))riverEnd(ctx,item,'south');
  }else mossVines(ctx,item);
  ctx.restore();count++;
 }
 return count;
}
