/* Static-project scoped, offline-first asset storage; no runtime AI or paid backend. */
const CACHE_PREFIX = 'tuc-foundation-';
const CACHE_NAME = CACHE_PREFIX + 'v0.09-gate-a12-r1';
const CORE_ASSETS = [
  './','./index.html','./styles.css','./manifest.webmanifest',
  './src/main.js','./src/content/catalog.js','./src/engine/state.js',
  './src/engine/random.js','./src/board/geometry.js','./src/board/scene.js','./src/board/miniatures.js','./src/board/effects.js','./src/board/atelier.js','./src/board/diorama.js','./src/board/targeting.js','./src/board/scenery.js','./src/board/motion.js','./src/board/choreography.js','./src/board/shoreline.js','./src/board/illumination.js','./src/board/relief.js','./src/board/quill.js','./src/board/battle-engraving.js','./src/board/impact-fragments.js','./src/board/press-ruins.js','./src/board/paper-puppets.js','./src/board/weapon-rigs.js','./src/board/articulated-cloth.js','./src/board/combat-beats.js','./src/board/pose-gestures.js',
  './src/party/model.js','./src/party/ui.js',
  './src/commands/engine.js','./src/commands/ui.js','./src/battle/engine.js','./src/movement/pathfinding.js','./src/combat/engine.js',
  './art/portraits/captain.svg','./art/portraits/brunna.svg','./art/portraits/kess.svg','./art/portraits/mirelle.svg','./src/platform/pwa.js','./src/platform/paths.js',
  './icons/company-mark-192.png','./icons/company-mark-512.png','./icons/apple-touch-icon.png'
];

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE_NAME);
    const urls=CORE_ASSETS.map(path=>new URL(path,self.registration.scope).href);
    await cache.addAll(urls);
    // Never force waiting workers to take over a potentially active campaign.
  })());
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const existing=await caches.keys();
    await Promise.all(existing.filter(key=>key.startsWith(CACHE_PREFIX)&&key!==CACHE_NAME).map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const target=new URL(request.url);
  const scope=new URL(self.registration.scope);
  if(target.origin!==scope.origin || !target.pathname.startsWith(scope.pathname))return;
  if(request.mode==='navigate'){
    event.respondWith((async()=>{
      try{
        const response=await fetch(request);
        if(response.ok){
          const cache=await caches.open(CACHE_NAME);
          await cache.put(new URL('./index.html',scope),response.clone());
        }
        return response;
      }catch{
        const cache=await caches.open(CACHE_NAME);
        return await cache.match(new URL('./index.html',scope)) ||
          await cache.match(new URL('./',scope)) ||
          new Response('Offline preview is unavailable until you open the app online.',{status:503,headers:{'Content-Type':'text/plain'}});
      }
    })());
    return;
  }
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE_NAME);
    const cached=await cache.match(request,{ignoreSearch:true});
    if(cached)return cached;
    const response=await fetch(request);
    if(response.ok && response.type==='basic')await cache.put(request,response.clone());
    return response;
  })());
});
