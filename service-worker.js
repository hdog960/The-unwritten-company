/* Static-project scoped, offline-first asset storage; no runtime AI or paid backend. */
const CACHE_PREFIX = 'tuc-foundation-';
const CACHE_NAME = CACHE_PREFIX + 'v0.02';
const CORE_ASSETS = [
  './','./index.html','./styles.css','./manifest.webmanifest',
  './src/main.js','./src/content/catalog.js','./src/engine/state.js',
  './src/engine/random.js','./src/platform/pwa.js','./src/platform/paths.js',
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
