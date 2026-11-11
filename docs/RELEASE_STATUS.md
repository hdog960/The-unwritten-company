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
