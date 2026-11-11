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

**Latest v0.09 Gate A quality correction (fourteenth pass):** Six individually authored *physical damage states* now appear on original hero and enemy miniature armor, cloth, bark and spectral paper when **actual HP** falls below 85% or 38%. Genuine guarded party members receive tiny enchanted stitches. Misses and idle movement do not invent injuries, and fallen figures are not actively guarded. The same deterministic skirmish, unobstructed center stage, two independent thumb rails, and offline service-worker PWA remain intact.

**Latest independently verified gameplay code:** [`bcd7f30`](https://github.com/hdog960/The-unwritten-company/commit/bcd7f307b70e42a5a0d7649ac6849593f0d4aeee). [Main Foundation CI 43123441434](https://github.com/hdog960/The-unwritten-company/actions/runs/43123441434) **SUCCESS with 151/151 Node tests, three actual Chromium victories at 667×375, 844×390, 932×430, and full offline cached battle and enemy turns**. [Pages 43123440077](https://github.com/hdog960/The-unwritten-company/actions/runs/43123440077) **SUCCESS** for the identical code SHA. Direct public HTTP response and actual iPhone Safari/Home Screen remain **UNVERIFIED**. Detailed [release evidence](docs/RELEASE_STATUS.md) and [Gate A physical review](docs/GATE_A_REVIEW.md).

**Gate A remains NOT APPROVED; v0.10 remains blocked** until the player explicitly approves the art and iPhone touch layout. See [Gate A review checklist](docs/GATE_A_REVIEW.md), the [seven governing documents](docs/README_START_HERE.md) and [actual implementation ledger](docs/RELEASE_STATUS.md).
