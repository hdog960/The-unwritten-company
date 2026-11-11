# The Unwritten Company

**Every adventure becomes a legend. Most legends are accidents.**

An original tactical fantasy roguelike for iPhone, in which a custom hero and three recruited companions fight through coherently assembled, choice-driven miniature campaigns.

[Start here: the seven canonical project documents](docs/README_START_HERE.md)  
[Full 100-release development roadmap](docs/ROADMAP.md)  
[Verified release ledger](docs/RELEASE_STATUS.md)

Expected public game once deployed: https://hdog960.github.io/The-unwritten-company/

Early development: design targets are not yet playable features. Four player quality gates are enforced at v0.09, v0.39, v0.79 and v0.99. Required hosting cost: $0.

## Current verified development stage: v0.09 — Gate A awaiting player review

The actual game includes **one fully finishable, deterministic tactical skirmish**, not a completed roguelike campaign. Four controllable illustrated adventurers fight two active enemy types using legal pathfinding, per-hero AP and MP, four abilities, real HP/damage/Guard, telegraphed enemy turns, win/lose and replay. Character creation, recruited companion stories, branching three-act campaigns, save/resume and Chronicle progression remain planned for later releases.

**Sixth Gate A art refinement:** Added an original source-drawn lighting pass that gives engraved lantern tiles and water coherent multi-tile illumination instead of a flat web-grid look. All six miniatures have a more grounded sculpted shadow, individual ink-coloured silhouette separation and subtle enamel footlights. Screenshot inspection caught a decorative footlight extending beyond its own tile; corrected the radii and added a tile-bounds regression test. The right intent line now names **Briar→Kess!** / **Shade→Capt!**, conveying attacker → threatened hero and using ! only for incoming strikes. No battlefield-overlapping controls or changed combat rules.

**Latest independently tested game source:** [`9ef1ec58`](https://github.com/hdog960/The-unwritten-company/commit/9ef1ec58ff123cc389f611411c32c00cb95d41d3). [Foundation CI run 43070089209](https://github.com/hdog960/The-unwritten-company/actions/runs/43070089209) **SUCCESS: 97/97 Node tests, complete Chromium winning playthroughs at 667×375, 844×390 and 932×430, and genuine offline movement/combat/enemy-phase checks**. [GitHub Pages deployment 43070089918](https://github.com/hdog960/The-unwritten-company/actions/runs/43070089918) **SUCCESS** for the same SHA. The public URL cannot be fetched independently through the available reader; **actual iPhone Safari and installed Home Screen still NOT VERIFIED**.

**Gate A remains NOT APPROVED. v0.10 strictly blocked** until the player explicitly accepts the art and two-thumb controls on an actual iPhone. Read the [seven governing documents](docs/README_START_HERE.md), [Gate A checklist](docs/GATE_A_REVIEW.md), and [truthful release ledger](docs/RELEASE_STATUS.md) before any further development.
