// Resolve from the module's real URL to stay inside the GitHub Pages project scope.
export function appRootFor(moduleUrl) {
  return new URL('../../', moduleUrl);
}
export function workerUrlFor(moduleUrl) {
  return new URL('../../service-worker.js', moduleUrl);
}
export function isStandaloneEnvironment(navigatorObject, mediaMatches = false) {
  return navigatorObject?.standalone === true || mediaMatches === true;
}
