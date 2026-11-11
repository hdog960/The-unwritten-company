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


## v0.03 extension
The PWA precache now includes \`./src/board/geometry.js\` and \`./src/board/scene.js\`; bump \`CACHE_NAME\` whenever imported modules or art change. The board study is available on the cached foundation and can be toggled offline. This remains a **visual study**, not an offline-playable tactical battle or a valid saved run. A real iPhone Safari/Home Screen lifecycle test remains outstanding. The expected URL preserves repository casing: \`/The-unwritten-company/\`.


## v0.04 extension — party portrait asset updates
The offline cache now explicitly includes `src/party/model.js`, `src/party/ui.js` and the four authored vector portraits: `art/portraits/captain.svg`, `brunna.svg`, `kess.svg`, `mirelle.svg`. These are decorative illustrative roster previews, not campaign/recruitment data. Updating an SVG must bump the service-worker cache generation alongside game content. Current cache generation: `v0.04`. All art assets are relative to the Pages project root.


## v0.05 extension — command study offline cache
\`service-worker.js\` cache generation \`v0.05\` precaches \`./src/commands/engine.js\` and \`./src/commands/ui.js\` in addition to all previous modules, static illustrations, manifest and icons. Confirmed by a headless Chromium offline reload and execution of the preview's Ward + Cancel controls. Do not conflate cached command previews with a playable offline tactical combat campaign. Bump the cache name when adding new modules or art.


## v0.06 — movement module offline cache
Service worker \`tuc-foundation-v0.06\` now precaches \`./src/movement/pathfinding.js\` alongside its \`src/commands/engine.js\` importer and the rest of the original static app. Headless Chromium successfully ran the command/movement preview while offline after an online cache warmup. Move targets, per-member budget and routes are in-memory **demonstration state**, not persistent saved character advancement. To preserve offline operation, append any later imported module to \`CORE_ASSETS\` and update the cache generation on each release. No claim of real iPhone Safari/Home Screen support verification from Chromium tests.


## v0.07 — cached deterministic combat study

`service-worker.js` now uses `tuc-foundation-v0.07` and precaches the new `./src/combat/engine.js` module alongside the existing scene, command, movement, roster, artwork and PWA assets. A headless Chromium browser warmed the cache online and subsequently performed a seeded combat roll with networking disabled. No saved game schema or cloud synchronization exists yet: AP, MP, enemy HP, combat seed and rolls are volatile training state and reset on closing/reopening the page. Do not confuse offline static training interaction with an offline campaign. Any new imported module needs to be added to `CORE_ASSETS`, and the cache generation must be bumped for each release. Real iPhone Safari and installed-Home-Screen lifecycle tests remain unverified.


## v0.08 — finishable offline skirmish (verified via headless Chromium)

Service-worker cache generation is now \`tuc-foundation-v0.08\` and \`./src/battle/engine.js\` is explicitly precached. All prior combat, movement, party, board, story preview, manifest and original art resources remain present. A fully loaded static project was reloaded offline in Chromium and successfully started the skirmish, then advanced through an enemy phase. Its turn data, AP, MP, enemy and party HP, outcome and action rolls are **in-memory only**: reloading or closing the web app does **not** resume a campaign or saved battle. Physical iPhone Safari/Home Screen install, background/foreground transitions and storage-migration compatibility remain unverified and should be tested at the appropriate player gate. When new modules are added, include them in \`CORE_ASSETS\` and bump the cache generation; do not use \`skipWaiting()\` to replace an active run unexpectedly.


## v0.09 — original source-drawn artwork and VFX offline graph

Service-worker generation `tuc-foundation-v0.09` precaches `./src/board/miniatures.js` and `./src/board/effects.js` because `src/board/scene.js` imports both. All previous art, icons, story preview, party and skirmish logic remain cached. The real Chromium automation warmed the offline cache and ran combat and a deterministic enemy phase while offline after those modules were added. `prefers-reduced-motion` suppresses the temporary animation while preserving announcements in controls. No persistence or migration format exists yet; the game is not a recoverable offline campaign and cannot resume an interrupted battle. Real iPhone Safari/Home Screen and device-specific rendering remain user Gate A inspection items. Bump cache generation and precache future module imports, never force-update an active run without explicit migration planning.


## v0.09 Gate A correction 2 — offline illustrated terrain

The source-only `src/board/atelier.js` module is now explicitly cached in the static PWA core alongside `src/board/miniatures.js`, `src/board/effects.js` and `src/board/scene.js`. Cache generation changed to `tuc-foundation-v0.09-gate-a2` without advancing the roadmap milestone. Chromium actually reloaded an offline-cached game and executed real skirmish combat after this change. Continuous texture and puppet motion use deterministic/offline Canvas paths, not remote resources. No campaign or skirmish save persistence has been added; physical iPhone Safari/Home Screen lifecycle remains unverified.


## v0.09 Gate A correction 3 — cross-tile diorama assets

\`service-worker.js\` now uses cache generation \`tuc-foundation-v0.09-gate-a3\`; the new \`./src/board/diorama.js\` import is in the static asset list alongside all original board, artwork, command, battle and portrait modules. \`npm run browser:smoke\` successfully warmed the cache and confirmed real online and offline-skirmish operation with the latest art module loaded. The new painted joins, ornamentation and role emblems run entirely from local Canvas drawing. No new persistence or save migration exists and no iPhone/WebKit lifecycle has been tested.
