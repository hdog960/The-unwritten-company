import { appRootFor, workerUrlFor, isStandaloneEnvironment } from './paths.js';

export function initPwa({online,offline}) {
  const nav = globalThis.navigator;
  const win = globalThis.window;
  const updateConnectivity = () => {
    const connected = nav.onLine !== false;
    online.textContent = connected ? 'Online connection' : 'Offline — cached foundation only';
    online.dataset.online = connected ? 'yes' : 'no';
  };
  updateConnectivity();
  win.addEventListener('online',updateConnectivity);
  win.addEventListener('offline',updateConnectivity);

  const isInstalled = isStandaloneEnvironment(nav,win.matchMedia?.('(display-mode: standalone)')?.matches ?? false);
  const guide = document.querySelector('.install-guide');
  if (guide && isInstalled) {
    guide.querySelector('summary').textContent = 'Home Screen app installed';
  }
  if (!('serviceWorker' in nav)) {
    offline.textContent = 'Offline caching not supported by this browser.';
    return;
  }

  // Register after page load to keep the first render responsive on mobile.
  win.addEventListener('load',async () => {
    try {
      const scope = appRootFor(import.meta.url);
      const reg = await nav.serviceWorker.register(workerUrlFor(import.meta.url), {scope:scope.href,updateViaCache:'none'});
      const showReadiness = () => {
        if (reg.active?.state === 'activated') offline.textContent = 'Offline preview cached · not yet a playable game';
        else if (reg.waiting) offline.textContent = 'Update ready; reopen the app to apply it.';
        else offline.textContent = 'Preparing offline preview…';
      };
      showReadiness();
      const worker = reg.installing || reg.waiting;
      worker?.addEventListener('statechange',showReadiness);
      nav.serviceWorker.addEventListener('controllerchange',showReadiness);
      await nav.serviceWorker.ready;
      showReadiness();
    } catch (error) {
      offline.textContent = 'Offline setup unavailable; online preview still works.';
      console.warn('PWA setup error',error);
    }
  },{once:true});
}
