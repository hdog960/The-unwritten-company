import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import zlib from 'node:zlib';
import {appRootFor,workerUrlFor,isStandaloneEnvironment} from '../src/platform/paths.js';
const root=JSON.parse(fs.readFileSync('manifest.webmanifest','utf8'));
const sw=fs.readFileSync('service-worker.js','utf8');

test('PWA manifest is relative to the repository Pages subpath',()=>{
  assert.equal(root.start_url,'./');
  assert.equal(root.scope,'./');
  assert.equal(root.id,'./');
  assert.equal(root.display,'standalone');
  assert.equal(root.orientation,'landscape');
  assert.ok(root.icons.some(icon=>icon.sizes==='192x192'&&icon.purpose.includes('maskable')));
  assert.ok(root.icons.some(icon=>icon.sizes==='512x512'));
  for(const icon of root.icons)assert.ok(icon.src.startsWith('./icons/'));
});
test('module URLs resolve worker and scope without escaping Pages project',()=>{
  for(const origin of ['https://hdog960.github.io/The-unwritten-company/','https://example.org/sub/path/']){
    const mod=origin+'src/platform/pwa.js';
    assert.equal(appRootFor(mod).href,origin);
    assert.equal(workerUrlFor(mod).href,origin+'service-worker.js');
  }
});
test('standalone mode covers Safari Home Screen and display-mode query',()=>{
  assert.equal(isStandaloneEnvironment({standalone:true},false),true);
  assert.equal(isStandaloneEnvironment({},true),true);
  assert.equal(isStandaloneEnvironment({standalone:false},false),false);
});
test('service worker version and offline core match the actual app module graph',()=>{
  assert.match(sw,/tuc-foundation-/);
 assert.ok(sw.includes('v0.09-gate-a26-r1'));
  for(const asset of ['./index.html','./styles.css','./src/main.js','./src/content/catalog.js','./src/engine/state.js','./src/engine/random.js','./src/platform/pwa.js','./src/platform/paths.js','./src/board/geometry.js','./src/board/scene.js','./src/board/miniatures.js','./src/board/effects.js','./src/board/atelier.js','./src/board/diorama.js','./src/board/targeting.js','./src/board/scenery.js','./src/board/motion.js','./src/board/choreography.js','./src/board/shoreline.js','./src/board/illumination.js','./src/board/relief.js','./src/board/quill.js','./src/board/battle-engraving.js','./src/board/route-tickets.js','./src/board/impact-fragments.js','./src/board/press-ruins.js','./src/board/paper-puppets.js','./src/board/weapon-rigs.js','./src/board/articulated-cloth.js','./src/board/combat-beats.js','./src/board/pose-gestures.js','./src/board/action-seals.js','./src/board/figure-condition.js','./src/board/paper-habitat.js','./src/board/bearings.js','./src/board/visages.js','./src/board/combat-script.js','./src/board/impact-witness.js','./src/board/chased-relief.js','./src/board/miniature-matte.js','./src/board/paper-footfalls.js','./src/board/terrain-contact.js','./src/board/figure-edge-ink.js','./src/board/figure-relief.js','./src/board/tile-relief.js','./src/party/model.js','./src/party/ui.js','./src/commands/engine.js','./src/commands/ui.js','./src/movement/pathfinding.js','./src/combat/engine.js','./src/battle/engine.js','./art/portraits/captain.svg','./art/portraits/brunna.svg','./art/portraits/kess.svg','./art/portraits/mirelle.svg','./manifest.webmanifest','./icons/apple-touch-icon.png']){
    assert.ok(sw.includes("'"+asset+"'"),'offline asset missing: '+asset);
  }
  assert.match(sw,/request\.mode==='navigate'/);
  assert.match(sw,/scope\.pathname/);
  assert.doesNotMatch(sw,/skipWaiting\(/);
});
test('raster icons have valid PNG structure, palette and desired dimensions',()=>{
  const variants=[['icons/apple-touch-icon.png',180],['icons/company-mark-192.png',192],['icons/company-mark-512.png',512]];
  for(const [path,size] of variants){
    const bytes=fs.readFileSync(path);
    assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
    assert.equal(bytes.readUInt32BE(16),size);
    assert.equal(bytes.readUInt32BE(20),size);
    assert.equal(bytes[24],4,'4-bit indexed color');
    assert.equal(bytes[25],3,'indexed color type');
    let offset=8, idat=[];
    while(offset<bytes.length){
      const length=bytes.readUInt32BE(offset);
      const type=bytes.subarray(offset+4,offset+8).toString('ascii');
      if(type==='IDAT')idat.push(bytes.subarray(offset+8,offset+8+length));
      offset+=length+12;
      if(type==='IEND')break;
    }
    const raw=zlib.inflateSync(Buffer.concat(idat));
    assert.equal(raw.length,(Math.ceil(size/2)+1)*size);
    assert.ok(bytes.length>100);
  }
});

test('offline precache paths are unique so Cache.addAll can install successfully',()=>{
  const source=fs.readFileSync('service-worker.js','utf8');
  const match=source.match(/const CORE_ASSETS = \[([\s\S]*?)\];/);
  assert.ok(match,'worker must declare an explicit offline asset set');
  const entries=[...match[1].matchAll(/'(\.\/[^']+)'/g)].map(x=>x[1]);
  assert.equal(entries.length,new Set(entries).size,'duplicate offline URLs cause Cache.addAll install rejection');
  assert.ok(entries.includes('./src/board/relief.js'));
  assert.ok(entries.includes('./src/board/quill.js'));
  assert.ok(entries.includes('./src/board/battle-engraving.js'));
  assert.ok(entries.includes('./src/board/impact-fragments.js'));
  assert.ok(entries.includes('./src/board/press-ruins.js'));
  assert.ok(entries.includes('./src/board/paper-puppets.js'));
  assert.ok(entries.includes('./src/board/weapon-rigs.js'));
  assert.ok(entries.includes('./src/board/articulated-cloth.js'));
  assert.ok(entries.includes('./src/board/action-seals.js'));
  assert.ok(entries.includes('./src/board/figure-condition.js'));
  assert.ok(entries.includes('./src/board/paper-habitat.js'));
  assert.ok(entries.includes('./src/board/bearings.js'));
  assert.ok(entries.includes('./src/board/visages.js'));
  assert.ok(entries.includes('./src/board/combat-script.js'));
  assert.ok(entries.includes('./src/board/impact-witness.js'));
  assert.equal(entries.filter(path=>path==='./src/board/impact-witness.js').length,1);
  assert.ok(entries.includes('./src/board/miniature-matte.js'));
  assert.ok(entries.includes('./src/board/paper-footfalls.js'));
  assert.ok(entries.includes('./src/board/chased-relief.js'));
  assert.equal(entries.filter(path=>path==='./src/board/chased-relief.js').length,1);
  assert.ok(entries.includes('./src/board/route-tickets.js'));
  assert.equal(entries.filter(path=>path==='./src/board/route-tickets.js').length,1);
  assert.ok(entries.includes('./src/board/terrain-contact.js'));
  assert.equal(entries.filter(path=>path==='./src/board/terrain-contact.js').length,1);

  assert.ok(entries.includes('./src/board/figure-edge-ink.js'));
  assert.ok(entries.includes('./src/board/figure-relief.js'));
  assert.ok(entries.includes('./src/board/tile-relief.js'));

  assert.ok(entries.includes('./src/board/combat-beats.js'));
  assert.ok(entries.includes('./src/board/pose-gestures.js'));
});
