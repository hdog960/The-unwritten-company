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

**Latest v0.09 Gate A quality correction (twenty-first pass):** Real character movement now carries each miniature's physical **paper-backing matte along the actual animated walking rectangle** instead of leaving it floating at the destination. All four heroes have distinct original tiny boot, plate, leaf, and folio **footsteps only along genuinely traversed confirmed path cells**, which fade immediately with the action. Original body/weapon animation and paper shadow lean now follow each true cardinal segment, without phantom hints or extra player controls. All four upgraded portraits, six individually sculpted miniatures/faces, authentic HP/Guard, four manuscript combat signatures, connected river and ivy, 4v2 deterministic skirmish, external thumb rails and offline PWA remain intact.

**Independently verified gameplay commit:** [23bdb63](https://github.com/hdog960/The-unwritten-company/commit/23bdb63a1f56da36a8281bcbbdf56d35d90d9496). [Merged-main Foundation CI 43228145539](https://github.com/hdog960/The-unwritten-company/actions/runs/43228145539) **SUCCESS: 206/206 Node tests, three actual Chromium victories at 667×375 / 844×390 / 932×430, and complete offline cached battle, foe AI, movement and cancel**. [Merged-main Pages 43228144307](https://github.com/hdog960/The-unwritten-company/actions/runs/43228144307) **SUCCESS** on identical gameplay SHA. Genuine baseline vs final motion screenshots showed changed pixels solely on the battlefield, none in left/right rails. Direct public HTTP and real physical iPhone Safari/Home Screen remain **UNVERIFIED**. See [release ledger](docs/RELEASE_STATUS.md) and [player Gate A checklist](docs/GATE_A_REVIEW.md).

**Gate A remains NOT APPROVED; v0.10 remains blocked** until the player explicitly approves the art and iPhone touch layout. See [Gate A review checklist](docs/GATE_A_REVIEW.md), the [seven governing documents](docs/README_START_HERE.md) and [actual implementation ledger](docs/RELEASE_STATUS.md).
