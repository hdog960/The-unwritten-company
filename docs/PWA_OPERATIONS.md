# v0.02 — Static Pages and PWA operational notes

The production URL uses the GitHub repository's real capitalization: https://hdog960.github.io/The-unwritten-company/
Manifest id, start_url, scope and icon paths are **relative** so they stay inside the repository's Pages subdirectory. The service worker is registered via a relative URL from the source module and caches only same-origin GET requests inside its actual registered scope.

Service-worker behavior:
1. During install, precache shell, actual imported JS graph, CSS, manifest and all three raster icons. An unsuccessful install leaves the previous active worker in place.
2. After activation, remove only previously versioned *this-app* caches and claim controlled clients.
3. Navigation tries network first and falls back to cached app shell when offline. Local static assets use versioned cache-first and network fallback.
4. Never automatically call skipWaiting, to avoid disrupting future mid-campaign sessions. After a deployment, closing all app tabs and reopening permits the new version to activate.
5. No runtime internet API and no cloud account; current offline support covers only the v0.02 foundation, **not** game saves or actual tactical play.

Install guidance in left non-combat rail; iOS Share → Add to Home Screen; standalone detection supports navigator.standalone and CSS display-mode. Connection labels are informational only. Real iPhone Safari and installed-PWA checks remain a future player gate.

Any future newly imported module or asset must be added to CORE_ASSETS and the cache version must be bumped alongside the app version; test package scans these files. Do not claim in-browser offline behavior based only on CI tests.
