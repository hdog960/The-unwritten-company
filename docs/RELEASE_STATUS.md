# THE UNWRITTEN COMPANY — VERIFIED RELEASE LEDGER

## Registration audit (2026-11-10, America/Chicago)
- Repo: https://github.com/hdog960/The-unwritten-company
- Public, default branch main, has_pages true according to GitHub repository metadata.
- Initial commit SHA: 3dc0ee834eaa07ab1f571631812ad87b5abef8a7.
- At audit, only the initial README.md existed; no game implementation yet.
- Pages HTTP, browser gameplay, actual iPhone, installed PWA, automated tests: **NOT VERIFIED** at audit.
- The 100-release roadmap is PLANNED, not achieved. Development status must be added below with real evidence.

## Development log
Documentation established as project authority. v0.01 code implementation to be separately audited and recorded; do not describe it as completed until tests, commit and deployment evidence are checked.

## Mandatory rules
Keep status truthful, list exact checks and failures. A repo property of has_pages=true alone is NOT a verified deployed site. No gate can be approved by the developer on the player's behalf.

## v0.01 — Technical foundation (2026-11-10, America/Chicago)
- **Code commit:** [82c1ba133b213da989cd1425bf0da8d185ba3522](https://github.com/hdog960/The-unwritten-company/commit/82c1ba133b213da989cd1425bf0da8d185ba3522).
- **Changes actually implemented:** Original responsive storybook guild launch shell with three-panel layout; interactive deterministic story-seed preview expressly labeled non-playable; seeded random utilities, immutable state reducer, six preview region records and six preview premise records; modular JS source, 2 test files, repository CI workflow, static Pages entry point and .nojekyll.
- **Automated tests:** GitHub Actions [Foundation checks run 42931736125](https://github.com/hdog960/The-unwritten-company/actions/runs/42931736125), completed SUCCESS. Ran npm run check, structural/content validation PASSED; Node test suite **6 passed, 0 failed**.
- **Deploy pipeline:** [GitHub Pages build and deployment run 42931733933](https://github.com/hdog960/The-unwritten-company/actions/runs/42931733933) for same code SHA completed SUCCESS.
- **External HTTP response / real browser rendering:** NOT VERIFIED. The external page URL was inaccessible through this assistant's web inspection interface, so do not claim live interactive inspection.
- **Actual iPhone Safari/Home Screen test:** NOT PERFORMED. Do not request player aesthetic approval before Gate A.
- **Save schema:** Not yet implemented; this release has no gameplay or save files.
- **Actual feature counts:** zero playable campaigns, zero battles, zero equipped party members, zero runtime story consequences. Preview sample content is NOT a generated campaign.
- **Gate status:** Gate A NOT REACHED. No player testing required at v0.01.
- **Next authorized milestone:** v0.02, Pages shell + PWA groundwork, followed by battle renderer and separate side rails in v0.03–0.09.
- **Status classification:** IMPLEMENTED + TESTED + deployment-workflow successful; live HTTP/browser NOT VERIFIED.

## v0.02 — GitHub Pages boot, mobile PWA and offline preview foundation (2026-11-10, America/Chicago)
- **Verified implementation lineage:** [2c973fe8fe8ac10610a5f0cd094ccaf382347278](https://github.com/hdog960/The-unwritten-company/commit/2c973fe8fe8ac10610a5f0cd094ccaf382347278) — PWA implementation; [354b9d84ff3593db91211041afac5d6e91955f37](https://github.com/hdog960/The-unwritten-company/commit/354b9d84ff3593db91211041afac5d6e91955f37) — real-browser smoke harness; [ad433f8df139328b37066e47d6e04df1eefee515](https://github.com/hdog960/The-unwritten-company/commit/ad433f8df139328b37066e47d6e04df1eefee515) — cleanup-race fix; this is the v0.02 tested code SHA.
- **Implemented:** Relative-path manifest and scope, first-party 180/192/512px PNG app icon assets, Safari Home Screen metadata, iPhone installation text, online/offline display mode detection and status, scoped service worker with complete foundation shell+module precache, navigation network-first/offline fallback, static asset caching, versioned cache retirement and safe deferred worker updates. Original v0.01 seed preview remains functional. No paid APIs or back end.
- **Automated tests:** [GitHub Actions run 42933419124](https://github.com/hdog960/The-unwritten-company/actions/runs/42933419124), **SUCCESS**. `npm run check` passed structural validations and **11/11 Node tests, 0 failures**, including manifest scope, PNG integrity/decompression, deterministic state and service-worker core list.
- **Actual browser suite:** The same passing run executed `npm run browser:smoke` in headless Chromium using a locally hosted clone of the shipped static app at the **actual Pages subpath** `/The-unwritten-company/`. Passed viewport checks at **667×375** (stage 328px), **844×390** (stage 435px), **932×430** (stage 483px), with no horizontal overflow or side rail overlap; the seed preview was clickable and functioned at all three sizes; a service-worker-controlled **offline navigation reload passed**. A 844×390 screenshot was uploaded as an Actions artifact. This is browser simulation, **not actual iPhone Safari**.
- **Observed and resolved test infrastructure issue:** Browser smoke initially returned an unsuccessful workflow solely because Chromium was still writing temporary profile files during cleanup. Its three viewport checks and offline check had *all passed*. Browser profile cleanup was fixed, and the full rerun completed successfully.
- **GitHub Pages:** [Deployment run 42933417027](https://github.com/hdog960/The-unwritten-company/actions/runs/42933417027) for tested SHA `ad433f8`, completed **SUCCESS**. Public URL expected: https://hdog960.github.io/The-unwritten-company/ . The assistant's external web fetch did not resolve the public Pages URL, so an independent HTTP response from *that live URL* remains **NOT VERIFIED**.
- **Real iPhone Safari / Home Screen installation test:** **NOT PERFORMED**, reserved for Gate A or later device access. No assertion of visual satisfaction on a real device.
- **Persistence:** Service worker caches the *foundation preview*. Campaign saves, tactical combat, playable campaign content and save migrations are **NOT IMPLEMENTED** yet. No claim that offline play exists.
- **Actual shipped gameplay content:** **0 battles, 0 playable campaigns, 0 recruitable companions**. Six preview premise records and six preview regions remain non-playable content concepts.
- **Status:** v0.02 **IMPLEMENTED, AUTOMATED-TESTED, CHROMIUM-TESTED, GitHub Pages DEPLOYMENT SUCCESSFUL**; public live HTTP and actual iPhone inspection outstanding. **Gate A NOT REACHED.**
- **Next authorized milestone:** v0.03 — a real center-only tactical board renderer and viewport geometry tests; remain inside v0.09 Gate A, no advancement without the player's approval.
