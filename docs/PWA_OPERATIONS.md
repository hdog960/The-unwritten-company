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


## v0.09 Gate A fourth correction — offline illustrated floor and precise targeting

The service worker now caches src/board/targeting.js, src/board/scenery.js, and src/board/motion.js under tuc-foundation-v0.09-gate-a4. On the tested Chrome build, online cache warmup followed by offline board movement, attack rolls and real enemy phases passed. Artwork and target cues are drawn locally with no online assets or hidden service requests. No save format or migration exists yet; reload can reset a battle. Real iPhone Safari and installed Home Screen remain user-inspection items.


## v0.09 Gate A quality refinement 5 — local choreographed miniatures and wet-ink edges

Service worker cache generation is now `tuc-foundation-v0.09-gate-a5` with `./src/board/choreography.js` and `./src/board/shoreline.js` explicitly precached. All other actual imported game/PWA modules, relative project-path assets and icons remain present. The latest verified Chromium test warmed the cache, relaunched offline and successfully ran actual seeded combat, movement and an enemy phase. Choreographed attacks and watercolor terrain are local Canvas paths; no remote image or gameplay APIs. Real iPhone Safari/Home Screen lifecycle and battery impact are **not yet measured**. Interrupted fights are not resumable; no persistent skirmish save format exists.


## v0.09 Gate A quality refinement 6 — miniatures and warm/cold illumination

Service worker cache generation is `tuc-foundation-v0.09-gate-a6-r1` and precaches `./src/board/illumination.js`. The new original Canvas-only lantern/river wash and unit-shadow/enamel modules do not need online assets or alter battle positions. The `r1` suffix intentionally invalidates the initial `gate-a6` cache from the intermediate screenshot build where footlight arcs crossed cell edges. After this correction, the exact tested build passed cached offline launch, real movement and attack actions, enemy turn and source/PWA tests in Chromium. No player-save schema exists and no live iPhone WebKit/Home Screen test has been performed.


## v0.09 Gate A quality refinement 7 — ink targeting, relief and precache integrity

Cache generation is now `tuc-foundation-v0.09-gate-a7-r1` with original static `./src/board/relief.js` and `./src/board/quill.js` precached **once each**. A transient broken intermediate commit had duplicated `quill.js` and caused `Cache.addAll()` to abort; final commit `7648a570` removed the duplicate and added a regression test enforcing unique URLs. The final green Chromium run proves actual controlled-worker installation, offline launch, legal movement, seeded combat and enemy turns. The new source-drawn target quill and enamel condition cuts require no network sprites or remote AI. No local battle save/resume exists, and iPhone WebKit/Home Screen remains untested.

## v0.09 Gate A quality refinement 8 — floor-ink and impact-fragment offline graph

Final cache generation is `tuc-foundation-v0.09-gate-a8-r2`. New original rendering-only modules `src/board/battle-engraving.js` and `src/board/impact-fragments.js` are both precached exactly once, in addition to all prior authored JS, portraits, icons and launcher assets. CI 43100799291 confirmed offline Chromium controlled-worker launch, actual combat, deterministic enemy phase, path/cancel and illustrated world rendering after warmup. The static app has no external rendering or AI API requirement. No save schema/interrupt recovery is implemented. Device WebKit and installed Home Screen updates remain **unverified**. Keep safe deferred worker takeover; future new modules require a cache generation bump.

## v0.09 Gate A ninth refinement — physical press ruin / puppet shadow offline graph

The complete locally-rendered code for `src/board/press-ruins.js` and `src/board/paper-puppets.js` is included in the unique `CORE_ASSETS` list under service-worker generation `tuc-foundation-v0.09-gate-a9-r1`. Actual PR Chromium CI 43105040409 and merged main CI 43105391188 confirmed controlled service-worker offline navigation, complete combat interactions, AI enemy phase and source-drawn battle art after warmup. No remote fonts, APIs or generated image fetches are required for this art. No interrupted-battle save or storage migration exists. No forced `skipWaiting`; real iPhone WebKit and installed Home Screen behavior remain player-review items.

## v0.09 Gate A tenth refinement — articulated character weapons offline dependency

The newest complete offline source graph includes `./src/board/weapon-rigs.js` exactly once and uses `tuc-foundation-v0.09-gate-a10-r1`. This original Canvas-only module is imported by `miniatures.js` and depends on no paid services, external render assets, network data, audio, DOM or runtime. PR Foundation CI 43107633178 and merge-main CI 43107961359 both verified real controlled Chromium service-worker startup, offline cached art, deterministic skirmish damage, enemy AI and movement/cancel. Do not force worker takeover mid-skirmish and do not claim battle saves; no persistence migration was introduced. Actual iPhone WebKit/Home Screen remains unverified.

## v0.09 Gate A eleventh refinement — complete paper-cloth offline graph

The source-drawn `src/board/articulated-cloth.js` is now a fixed, single cached module in `CORE_ASSETS`, using generation `tuc-foundation-v0.09-gate-a11-r1`. Art remains deterministic, on the existing Canvas and fully offline without an AI API or remote textures. Both [PR CI 43111951543](https://github.com/hdog960/The-unwritten-company/actions/runs/43111951543) and [main CI 43112317132](https://github.com/hdog960/The-unwritten-company/actions/runs/43112317132) executed true headless Chromium online-to-offline service-worker launch, enemy AI, combat, preview, movement and cancel. No forced worker takeover, battle-save schema, or durable storage was added. A real installed iPhone PWA and browser-specific cache lifecycle still await player verification.
