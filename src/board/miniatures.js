/** The Illuminated Table — original v0.09 six-figure painted-miniature atlas.
 * Source-drawn at a 100-unit scale; never remote image or copyrighted sprites.
 */
import {paintWeaponRig} from './weapon-rigs.js';
import {paintArticulatedCloth} from './articulated-cloth.js';
import {figureBeat} from './combat-beats.js';
import {paintGestureJoints} from './pose-gestures.js';
export const HERO_SILHOUETTES=Object.freeze(['captain','brunna','kess','mirelle']);
export const FOE_SILHOUETTES=Object.freeze(['briar','shade']);
const H=100;
function polygon(ctx,pts,fill,stroke='#182631',w=2.4){
  ctx.beginPath();ctx.moveTo(...pts[0]);for(const p of pts.slice(1))ctx.lineTo(...p);ctx.closePath();
  if(fill){ctx.fillStyle=fill;ctx.fill()}
  if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=w;ctx.lineJoin='round';ctx.stroke()}
}
function mark(ctx,pts,color='#d8c69d',w=1.8){
  ctx.beginPath();ctx.moveTo(...pts[0]);for(const p of pts.slice(1))ctx.lineTo(...p);
  ctx.strokeStyle=color;ctx.lineWidth=w;ctx.lineJoin='round';ctx.lineCap='round';ctx.stroke();
}
function bead(ctx,x,y,r,fill,stroke=null){
  ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();
  if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1.6;ctx.stroke()}
}
function ellipse(ctx,x,y,rx,ry,fill){
  ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();
}
function thinGradient(ctx,y,h,a,b){
  const g=ctx.createLinearGradient(0,y,0,y+h);g.addColorStop(0,a);g.addColorStop(1,b);return g;
}
function podium(ctx,tone,dead=false){
  ellipse(ctx,50,83,34,11,'#0c1420ad');
  ellipse(ctx,50,80,29,9,'#2d3339');
  ellipse(ctx,50,78,28,8,dead?'#655f5d':tone);
  ellipse(ctx,50,77,24,5,'#e9d4a13f');
  mark(ctx,[[24,79],[31,84],[50,87],[68,84],[76,79]],'#121d26',2);
  for(const x of [37,50,63])bead(ctx,x,82,1.3,'#f0d69a');
}
function head(ctx,x,y,skin,hair){
  bead(ctx,x,y,9,skin,'#31303a');
  polygon(ctx,[[x-9,y-3],[x-10,y-10],[x-3,y-13],[x+8,y-9],[x+9,y-2],[x+5,y-7],[x-5,y-7]],hair,'#27303a',1.4);
  bead(ctx,x-3,y+1,1,'#28313b');bead(ctx,x+3,y+1,1,'#28313b');
  mark(ctx,[[x-2,y+6],[x+3,y+6]],'#9c6d56',1);
}
function ornament(ctx,x,y){
  polygon(ctx,[[x,y-4],[x+4,y],[x,y+4],[x-4,y]],'#e7c481','#4c493f',1.2);
  bead(ctx,x,y,1.1,'#fff4c9');
}
function drawCaptain(ctx){
  // Cape silhouette is now the action-posed, character-specific cloth rig.
  // Steel legs and knee-high travel boots.
  polygon(ctx,[[37,61],[47,62],[45,74],[37,75]],'#a69a78','#253341');
  polygon(ctx,[[52,62],[61,61],[65,75],[53,75]],'#778f87','#263540');
  polygon(ctx,[[34,73],[46,72],[45,80],[32,81]],'#35434a');
  polygon(ctx,[[54,72],[67,73],[70,80],[55,79]],'#35434a');
  // Caped captain: asymmetric slate armor with radiant book emblem.
  polygon(ctx,[[34,34],[43,30],[58,32],[67,39],[61,65],[38,64]],thinGradient(ctx,29,39,'#c5c3a2','#53716a'),'#203745',2.8);
  polygon(ctx,[[37,39],[48,34],[52,50],[46,61],[37,61]],'#567e7d','#253b43');
  polygon(ctx,[[47,38],[60,35],[61,59],[48,62]],'#a5b7a2','#2c444b');
  mark(ctx,[[49,40],[58,40],[58,55],[54,58],[49,55],[49,40]],'#ebd49d',2);
  mark(ctx,[[53,44],[53,54]],'#e8d9ad',1.8);
  head(ctx,50,24,'#d6af8d','#665448');
  polygon(ctx,[[37,18],[42,10],[58,9],[64,18],[62,25],[39,25]],'#7d8e85','#2f4450',2);
  polygon(ctx,[[39,17],[62,17],[55,10],[44,10]],'#d6be8d','#33464a',1.4);
  bead(ctx,50,18,2.5,'#e9d99e');
  // Northern shield.
  polygon(ctx,[[25,43],[35,40],[39,53],[35,69],[26,73],[18,60],[20,48]],'#d6b775','#473e38',2.5);
  polygon(ctx,[[25,47],[34,45],[35,54],[31,64],[24,67],[22,58]],'#345b60','#243a3d',1.4);
  ornament(ctx,27,55);
  // Signature weapon is painted separately by the animated paper-joint rig.
}
function drawBrunna(ctx){
  // Cape silhouette is now the action-posed, character-specific cloth rig.
  polygon(ctx,[[29,60],[45,61],[43,74],[26,76]],'#755b58','#2e333b');
  polygon(ctx,[[53,61],[70,59],[73,76],[56,75]],'#8d7564','#2b353b');
  polygon(ctx,[[24,72],[43,71],[42,80],[24,81]],'#40444a');
  polygon(ctx,[[55,72],[75,70],[77,80],[55,80]],'#40444a');
  polygon(ctx,[[24,42],[36,31],[62,31],[75,44],[70,67],[30,67]],thinGradient(ctx,31,42,'#d2ae82','#706c6a'),'#28303c',3.4);
  polygon(ctx,[[25,42],[32,31],[43,34],[43,49],[27,55]],'#e3ad77','#3d4850');
  polygon(ctx,[[57,33],[69,30],[77,43],[69,56],[58,49]],'#d99b74','#4a3b43');
  mark(ctx,[[38,49],[62,49],[61,64],[39,64],[38,49]],'#f0d29d',2.2);
  ornament(ctx,50,55);
  head(ctx,51,25,'#d6ab8b','#874b3a');
  // Signature huge braided rust-red dwarf beard and bronze oath helm.
  polygon(ctx,[[42,27],[60,27],[66,37],[59,49],[52,52],[43,46],[37,35]],'#a85c3f','#4b3435',2);
  mark(ctx,[[44,33],[46,45],[51,49]],'#dfa47e',2);
  mark(ctx,[[59,34],[57,44],[53,49]],'#d8916c',2);
  bead(ctx,49,43,2.3,'#e2b67c');bead(ctx,57,43,2.2,'#e2b67c');
  polygon(ctx,[[37,22],[43,13],[60,13],[65,24],[57,23],[42,25]],'#bca780','#48444a');
  polygon(ctx,[[36,20],[25,13],[30,10],[42,16]],'#d6b981','#48444a');
  polygon(ctx,[[63,19],[75,12],[71,8],[60,17]],'#d6b981','#48444a');
  // Signature weapon is painted separately by the animated paper-joint rig.
  polygon(ctx,[[15,50],[29,48],[35,60],[28,72],[16,72],[10,60]],'#8b5c53','#2c3b41');
  ornament(ctx,22,60);
}
function drawKess(ctx){
  // Cape silhouette is now the action-posed, character-specific cloth rig.
  // Long, narrow elf silhouette and dark leather.
  polygon(ctx,[[42,59],[52,59],[49,76],[38,77]],'#4a554c');
  polygon(ctx,[[51,59],[59,59],[64,77],[53,78]],'#53685a');
  polygon(ctx,[[37,72],[50,73],[48,80],[34,81]],'#293b3c');
  polygon(ctx,[[54,74],[67,73],[72,80],[52,81]],'#293b3c');
  polygon(ctx,[[39,36],[47,32],[57,31],[65,42],[59,66],[42,65]],thinGradient(ctx,31,40,'#7d9681','#2b504b'),'#1e3435',2.4);
  polygon(ctx,[[40,44],[48,37],[49,59],[40,60]],'#a0a781','#304743',1.6);
  mark(ctx,[[45,52],[59,50]],'#d4c189',2);
  head(ctx,51,26,'#d5b797','#503f3a');
  // Long ears read at small phone tiles.
  polygon(ctx,[[42,26],[28,19],[38,30]],'#d9b38f','#385044',1.3);
  polygon(ctx,[[60,26],[73,18],[63,31]],'#d9b38f','#385044',1.3);
  polygon(ctx,[[34,22],[40,10],[55,8],[68,23],[58,19],[50,18],[41,24]],'#305447','#263b3c',2);
  mark(ctx,[[36,20],[52,12],[62,17]],'#86ac86',2);
  // Signature weapon is painted separately by the animated paper-joint rig.
  bead(ctx,50,56,2.5,'#dfc98e');
}
function drawMirelle(ctx){
  // Cape silhouette is now the action-posed, character-specific cloth rig.
  polygon(ctx,[[40,43],[58,41],[70,77],[29,77]],thinGradient(ctx,40,40,'#74668d','#313850'),'#263245',3);
  for(let n=0;n<3;n++)mark(ctx,[[38-n*3,64+n*2],[49,67+n*2],[60+n*2,64+n*2]],'#b4aaa0',1.1);
  polygon(ctx,[[39,34],[60,34],[62,52],[39,52]],'#537a83','#293f54',1.5);
  polygon(ctx,[[44,38],[55,38],[50,55]],'#b8c8b4','#3a5d6a',1.4);
  ornament(ctx,50,44);
  head(ctx,51,27,'#ddbea0','#4b5671');
  // Scholar's great soft brim and asymmetrical pointed crown.
  polygon(ctx,[[30,23],[35,18],[46,18],[56,12],[63,20],[73,24],[56,27],[36,27]],'#5a4a76','#292f45',2);
  polygon(ctx,[[39,20],[52,3],[57,12],[61,20]],'#6c5a86','#30384c',2.4);
  mark(ctx,[[37,21],[67,22]],'#d6b980',2.6);
  bead(ctx,52,14,2.2,'#d9c5a9');
  // Signature weapon is painted separately by the animated paper-joint rig.
  polygon(ctx,[[25,44],[33,38],[37,55],[28,58]],'#9d8796','#353a48');
  bead(ctx,26,57,2,'#e9c98d');
}
/** Per-figure enamel and stitching: these are small distinct authored shapes,
 * rather than shared faces, recolors, random procedural hats or text labels.
 */
function finishHeroInk(ctx,id,pose){
  if(id==='captain'){
    // A page-corner clasp and tiny scriptwork along the captain's cloak.
    mark(ctx,[[39,42],[42,44],[45,43]],'#f3d7a2',1.4);
    mark(ctx,[[46,55],[51,58],[57,56]],'#364b50',1.5);
    for(const y of [49,54,59])bead(ctx,61,y,1.2,'#e5cba4');
    mark(ctx,[[22,54],[27,50],[32,54],[27,58],[22,54]],'#e2c98e',1.25);
    // Light catches the raised sword on release.
    if(pose?.kind==='attack')mark(ctx,[[79,21],[83,16],[85,24]],'#fff0c6',2);
  }else if(id==='brunna'){
    // Hammer stamp, rivets and two braid-beads make the dwarf unmistakable.
    mark(ctx,[[69,19],[77,17],[83,19],[87,24]],'#f2d4a5',1.4);
    for(const x of [37,64])for(const y of [47,61])bead(ctx,x,y,1.35,'#efd3a1');
    mark(ctx,[[45,40],[50,45],[47,48]],'#f1b68d',1.5);
    mark(ctx,[[57,39],[53,46],[58,49]],'#f1b68d',1.5);
    for(const x of [45,58])bead(ctx,x,48,2.2,'#d8aa6d','#603c3b');
    if(pose?.kind==='attack')mark(ctx,[[82,8],[88,4],[93,8]],'#fff4c4',2);
  }else if(id==='kess'){
    // Forest-leaf clasp, shoulder lacing and split-dagger edges.
    polygon(ctx,[[48,48],[55,46],[54,53],[50,56]],'#c2d5a1','#3b634d',1.1);
    mark(ctx,[[45,49],[52,51]],'#f3e4b9',1.2);
    for(let i=0;i<4;i++){
      const y=40+i*5;
      mark(ctx,[[39,y],[43,y+1]],'#c0c69b',1);
    }
    mark(ctx,[[17,37],[21,30]],'#fff2d7',1.2);
    mark(ctx,[[86,42],[83,32]],'#f7e7ca',1.2);
    if(pose?.kind==='attack'){
      mark(ctx,[[20,24],[13,21],[10,30]],'#bedfca',2);
      mark(ctx,[[80,26],[89,22],[90,30]],'#bedfca',2);
    }
  }else if(id==='mirelle'){
    // Constellation hem, luminous crystal facets and ink-quill flourish.
    for(const [x,y] of [[38,64],[49,68],[57,60],[63,72]]){
      bead(ctx,x,y,1.7,'#d3c5e9');bead(ctx,x-.4,y-.4,.55,'#fff3cf');
    }
    mark(ctx,[[38,64],[49,68],[57,60],[63,72]],'#c5bce592',1);
    polygon(ctx,[[76,15],[80,21],[76,27],[72,21]],'#d6fbeb','#659f9f',1.4);
    mark(ctx,[[75,16],[78,20],[76,25]],'#fff4d0',1.4);
    if(pose?.kind==='attack'||pose?.kind==='ward'){
      for(const [x,y]of [[66,13],[87,16],[82,33]])bead(ctx,x,y,2.2,'#bcf2df');
    }
  }
}
function finishFoeInk(ctx,id,pose){
  if(id==='briar'){
    // Branch rings, ember sap and rough tree-bark scoring.
    for(const [x,y]of [[36,52],[61,59],[52,29],[72,45]]){
      mark(ctx,[[x-4,y-4],[x,y],[x-3,y+7]],'#b2a77a',1.4);
      mark(ctx,[[x+2,y-5],[x+4,y+3]],'#283b3a',1.3);
    }
    for(const [x,y]of [[32,28],[67,30],[74,59]])bead(ctx,x,y,2,'#bc9d65','#4c5740');
    if(pose?.kind==='attack')for(const x of [22,78])mark(ctx,[[x,42],[x+(x<50?-5:5),34]],'#e7b581',2);
  }else{
    // Fractured etched mask and floating constellation-like shards.
    mark(ctx,[[36,39],[42,30],[51,34],[59,31]],'#a1c6c7',1.6);
    mark(ctx,[[40,58],[50,65],[61,58]],'#759db7',1.8);
    for(const [x,y]of [[26,19],[75,31],[21,65],[68,70]]){
      bead(ctx,x,y,1.8,'#9ee5dc');
      mark(ctx,[[x-3,y+3],[x+3,y-3]],'#80c2c7',1.1);
    }
    if(pose?.kind==='attack'){
      for(const [x,y]of [[16,31],[84,34],[51,11]])bead(ctx,x,y,2.6,'#d6fff0');
    }
  }
}
function actionBrush(ctx,id,pose,foe=false){
  if(!pose||!['attack','recoil','stagger','ward'].includes(pose.kind))return;
  const force=Math.sin(Math.PI*Math.max(0,Math.min(1,pose.progress)));
  if(force<.025)return;
  ctx.save();ctx.globalAlpha=(Number.isFinite(ctx.globalAlpha)?ctx.globalAlpha:1)*Math.min(.88,.24+.64*force);
  if(pose.kind==='attack'){
    if(id==='captain'){
      mark(ctx,[[71,18],[85,11],[90,14]],'#fae2a6',2.8*force+1);
      mark(ctx,[[17,40],[12,53],[19,64]],'#dcead8',1.7);
    }else if(id==='brunna'){
      mark(ctx,[[80,12],[90,8],[94,15],[89,24]],'#f4c58d',2.8*force+1);
      bead(ctx,89,8,2.1+force*2.1,'#fff3d2');
    }else if(id==='kess'){
      mark(ctx,[[24,20],[15,24],[11,33]],'#bfe0bd',2.2);
      mark(ctx,[[80,22],[88,28],[90,36]],'#d7e6b2',2.2);
      for(const x of [13,88])bead(ctx,x,28,1.6,'#f2edce');
    }else if(id==='mirelle'){
      ctx.beginPath();ctx.arc(77,20,11+force*4,-.9,2.2);
      ctx.strokeStyle='#a5efdb';ctx.lineWidth=2+force*1.2;ctx.stroke();
      for(const [x,y]of [[64,19],[85,9],[91,27]])bead(ctx,x,y,1.4+force*1.6,'#fff2c3');
    }else if(id==='briar'){
      mark(ctx,[[11,41],[6,26],[13,18]],'#dab985',2.4);
      mark(ctx,[[88,42],[95,29],[89,22]],'#aecb91',2.4);
    }else if(id==='shade'){
      ctx.beginPath();ctx.arc(51,53,24+force*6,.2,2.5);
      ctx.strokeStyle='#93e4d6';ctx.lineWidth=2.5;ctx.stroke();
      for(const x of [18,82])bead(ctx,x,46,2.4,'#a5e6df');
    }
  }else if(pose.kind==='ward'&&id==='mirelle'){
    mark(ctx,[[29,33],[22,20],[34,17],[39,27]],'#c9bdf3',2.3);
    bead(ctx,34,17,3,'#ffefcf');
  }else{
    const color=foe?'#e7b89f':id==='mirelle'?'#beb8ed':'#f7d6a1';
    // Impact ink shards appear only in the target's actual hit window.
    for(let i=0;i<(pose.kind==='stagger'?6:4);i++){
      const a=i*2.399,dist=17+force*8,x=50+Math.cos(a)*dist,y=43+Math.sin(a)*dist;
      mark(ctx,[[x,y],[x+Math.cos(a)*(6+force*3),y+Math.sin(a)*(6+force*3)]],color,2.3);
    }
  }
  ctx.restore();
}
export function drawHero(ctx,rect,id,fallen=false,pose=null){
  if(!rect)return;const s=rect.width;
  ctx.save();ctx.translate(rect.x,rect.y);ctx.scale(s/H,s/H);
  const tone=id==='brunna'?'#956d60':id==='kess'?'#608677':id==='mirelle'?'#7a658d':'#6c8d84';
  podium(ctx,tone,fallen);
  ctx.save();
  if(fallen)ctx.globalAlpha=.28;
  // Animation translates painted paper pieces independently of their fixed
  // pedestals, like a tabletop puppet; no effect on hitboxes or tile geometry.
  const posture=figureBeat(id,pose);
  if(posture)ctx.translate(posture.x,posture.y);
  paintArticulatedCloth(ctx,id,pose,'back');
  if(id==='brunna')drawBrunna(ctx);
  else if(id==='kess')drawKess(ctx);
  else if(id==='mirelle')drawMirelle(ctx);
  else drawCaptain(ctx);
  finishHeroInk(ctx,id,pose);
  paintArticulatedCloth(ctx,id,pose,'front');
  paintGestureJoints(ctx,id,pose);
  paintWeaponRig(ctx,id,pose);
  if(!fallen)actionBrush(ctx,id,pose);
  ctx.restore();
  if(fallen){mark(ctx,[[25,55],[75,55]],'#dcbfa3',2);mark(ctx,[[49,48],[49,65]],'#dcbfa3',2);}
  ctx.restore();
}
function briar(ctx){
  polygon(ctx,[[26,72],[30,43],[41,37],[61,35],[72,45],[74,74]],thinGradient(ctx,31,49,'#8a8564','#4d5d46'),'#202d31',3.2);
  for(const [x,y] of [[27,47],[39,35],[63,39],[74,47]]){
    polygon(ctx,[[x-5,y+10],[x-4,y-12],[x+3,y-20],[x+9,y+8]],'#566d47','#304536',2);
    mark(ctx,[[x-1,y+3],[x+3,y-10]],'#b2af79',1.5);
  }
  polygon(ctx,[[32,31],[36,17],[46,29],[52,8],[61,29],[69,15],[69,36]],'#665b43','#303c37',2.8);
  head(ctx,51,37,'#997f5d','#52664b');
  polygon(ctx,[[40,40],[62,40],[58,50],[45,53]],'#514937','#283733',1.5);
  bead(ctx,46,41,2.8,'#f3ac71');bead(ctx,56,41,2.8,'#f3ac71');
  mark(ctx,[[45,51],[54,55],[61,49]],'#bcb48c',2);
  polygon(ctx,[[36,59],[45,55],[54,62],[65,56],[70,70],[58,74],[40,73]],'#675942','#233437',2);
  polygon(ctx,[[42,63],[51,58],[59,64],[52,69]],'#8e9164','#304639',1.4);
  mark(ctx,[[29,54],[15,62]],'#b6bb83',4);
  mark(ctx,[[71,53],[86,60]],'#b6bb83',4);
  polygon(ctx,[[12,58],[20,60],[17,73]],'#697e54','#314136');
  polygon(ctx,[[84,55],[89,67],[82,71]],'#697e54','#314136');
}
function shade(ctx){
  // Impossibly hollow spirit: asymmetrical bell hood, broken spectral flames.
  const smoke=ctx.createRadialGradient(50,44,7,50,53,33);
  smoke.addColorStop(0,'#80c1b0aa');smoke.addColorStop(.5,'#4c6a8a88');smoke.addColorStop(1,'#31345000');
  ellipse(ctx,50,52,35,34,smoke);
  polygon(ctx,[[37,69],[29,55],[31,36],[45,18],[57,20],[71,40],[73,60],[64,74],[55,65],[47,79]],
    thinGradient(ctx,20,58,'#5c627d','#2d2b4d'),'#18293f',3);
  polygon(ctx,[[36,40],[46,23],[58,31],[64,46],[57,58],[39,59]],'#142a3f','#7d98a4',2);
  polygon(ctx,[[40,46],[52,33],[60,47],[55,58],[43,55]],'#091c32','#425c6e',1.2);
  mark(ctx,[[44,43],[51,45],[57,43]],'#c4fff1',2.4);
  mark(ctx,[[47,51],[54,49]],'#7fd8d2',2);
  bead(ctx,51,55,5,'#83d6d0','#d3fff5');
  polygon(ctx,[[27,45],[16,39],[19,54],[28,61]],'#646585','#2c3850',1.5);
  polygon(ctx,[[71,48],[83,37],[82,60],[70,65]],'#69768e','#243752',1.5);
  for(const [x,y] of [[23,34],[75,24],[83,67]]){
    polygon(ctx,[[x,y-6],[x+4,y],[x,y+6],[x-4,y]],'#76b6b6','#304e62',1);
  }
}
export function drawFoe(ctx,rect,foe,lastCombat,pose=null){
  if(!rect||!foe)return;const s=rect.width;
  ctx.save();ctx.translate(rect.x,rect.y);ctx.scale(s/100,s/100);
  podium(ctx,foe.id==='briar'?'#7d6848':'#566c79',foe.hp===0);
  if(foe.hp<=0){
    polygon(ctx,[[35,60],[48,56],[63,60],[68,72],[52,77],[35,73]],'#4a5152','#24323a',2);
    mark(ctx,[[41,61],[57,68],[65,61]],'#a3a392',2);
    ctx.restore();return;
  }
  ctx.save();
  const posture=figureBeat(foe.id,pose);
  if(posture)ctx.translate(posture.x,posture.y);
  paintArticulatedCloth(ctx,foe.id,pose,'back');
  if(foe.id==='briar')briar(ctx);else shade(ctx);
  finishFoeInk(ctx,foe.id,pose);
  paintArticulatedCloth(ctx,foe.id,pose,'front');
  paintGestureJoints(ctx,foe.id,pose);
  paintWeaponRig(ctx,foe.id,pose);
  actionBrush(ctx,foe.id,pose,true);
  ctx.restore();
  // A real in-world miniature health enamel, not a floating HUD.
  const barX=17,barY=86,barW=66,barH=6.5;
  ctx.fillStyle='#0d1b25';ctx.fillRect(barX-2,barY-2,barW+4,barH+4);
  ctx.fillStyle='#724349';ctx.fillRect(barX,barY,barW,barH);
  const remaining=Math.max(0,Math.min(1,foe.hp/foe.maxHp));
  ctx.fillStyle=remaining<=.33?'#edaa89':'#e8ae82';
  ctx.fillRect(barX,barY,barW*remaining,barH);
  if(remaining<=.33){
    // Three engraved diagonal warning cuts survive colorblind viewing and
    // the smallest tested tile. They are part of the foe's in-world base.
    for(let i=0;i<3;i++){
      const px=barX+barW*(.16+i*.19);
      mark(ctx,[[px,barY+1],[px+4,barY+barH-1]],'#fff0d2',2.8);
    }
  }
  ctx.strokeStyle='#e0bd83';ctx.lineWidth=1;ctx.strokeRect(barX,barY,barW,barH);
  if(lastCombat?.id===foe.id){
    ctx.beginPath();ctx.arc(50,45,34,0,Math.PI*2);
    ctx.strokeStyle=lastCombat.hit?'#f6db9c':'#92d9d9';
    ctx.lineWidth=3;ctx.stroke();
  }
  ctx.restore();
}
