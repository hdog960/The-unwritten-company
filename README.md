# The Unwritten Company

**Every adventure becomes a legend. Most legends are accidents.**

An original tactical fantasy roguelike for iPhone, in which a custom hero and three recruited companions fight through coherently assembled, choice-driven miniature campaigns.

[Start here: the seven canonical project documents](docs/README_START_HERE.md)  
[Full 100-release development roadmap](docs/ROADMAP.md)  
[Verified release ledger](docs/RELEASE_STATUS.md)

Expected public game once deployed: https://hdog960.github.io/The-unwritten-company/

Early development: design targets are not yet playable features. Four player quality gates are enforced at v0.09, v0.39, v0.79 and v0.99. Required hosting cost: $0.

## Current verified development stage: v0.09 — Gate A AWAITING PLAYER APPROVAL

The implementation is still **one real, deterministic, finishable and replayable tactical skirmish**, not a complete story campaign. Four controllable illustrated prototype adventurers, two active enemy types, individually tracked AP and MP, legal pathfinding, hit/damage/Guard, incoming enemy attacks and HP, victory/defeat/replay and static offline PWA continue working. The full procedural three-act narrative, protagonist creator, authored recruitment and interrupted-battle saves are not built yet.

**Latest v0.09 Gate A quality correction (sixteenth pass):** Kess's game-world elf now has sweeping ivory hair matching his actual portrait; Mirelle's giant pointed wizard hat has been replaced with long dark scholarly hair and a small Collegium circlet matching her actual portrait. All six miniature characters now have individually inked, face-specific brows, eyes and signature features that respond to the **existing real attack, hit, stagger and Ward timeline**, without fake damage, changed hitboxes or extra stage controls. Raised paper silhouettes, real HP/Guard injury states, tactile terrain, the full deterministic skirmish and both external thumb rails remain unchanged.

**Latest independently verified gameplay code:** [`57c5034`](https://github.com/hdog960/The-unwritten-company/commit/57c503414d04cab1bf55c98011a7831a7cdbdff4). [Post-merge Foundation CI 43140904974](https://github.com/hdog960/The-unwritten-company/actions/runs/43140904974) **SUCCESS: 165/165 Node tests, three real Chromium victories at 667×375, 844×390 and 932×430, and real offline service-worker cached combat, foe turns and movement**. [Pages deployment 43140903925](https://github.com/hdog960/The-unwritten-company/actions/runs/43140903925) **SUCCESS** on that exact gameplay SHA. Direct external HTTP retrieval and physical iPhone Safari/Home Screen review remain **UNVERIFIED**. Full evidence and player approval instructions are in the [release ledger](docs/RELEASE_STATUS.md) and [Gate A review](docs/GATE_A_REVIEW.md).

**Gate A remains NOT APPROVED; v0.10 remains blocked** until the player explicitly approves the art and iPhone touch layout. See [Gate A review checklist](docs/GATE_A_REVIEW.md), the [seven governing documents](docs/README_START_HERE.md) and [actual implementation ledger](docs/RELEASE_STATUS.md).
