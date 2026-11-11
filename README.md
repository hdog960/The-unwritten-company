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

**Latest v0.09 Gate A quality correction (tenth pass):** Six genuinely articulated, source-drawn equipment silhouettes now follow each miniature's actual attack, movement, ward and recoil animation. The Captain wields an engraved sword, Brunna a bronze oath hammer, Kess independently swings two daggers, Mirelle carries a hinged prism staff, and Briar and Shade have separate animated hostile extensions. Overlapping enemy warning glyphs are consolidated by hero, with genuine imminent attacks taking priority over approaches. Game logic, terrain, battle outcome and iPhone side rails are unchanged.

**Latest verified gameplay code:** [`ad00ddb`](https://github.com/hdog960/The-unwritten-company/commit/ad00ddb7505f310b31da0007f685d7b412544663). [Main Foundation CI 43107961359](https://github.com/hdog960/The-unwritten-company/actions/runs/43107961359): **131/131 Node tests, three real Chromium combat victories at 667×375, 844×390 and 932×430, and successful offline cached skirmish/foe turn**. [Pages deployment 43107960656](https://github.com/hdog960/The-unwritten-company/actions/runs/43107960656) **SUCCESS** for the same code SHA. The public site's direct HTTP response and actual iPhone Safari/Home Screen behavior remain **UNVERIFIED**. See [actual release ledger](docs/RELEASE_STATUS.md) and [iPhone Gate A review](docs/GATE_A_REVIEW.md). No campaign or interrupted-battle saves have been implemented.

**Gate A remains NOT APPROVED; v0.10 remains blocked** until the player explicitly approves the art and iPhone touch layout. See [Gate A review checklist](docs/GATE_A_REVIEW.md), the [seven governing documents](docs/README_START_HERE.md) and [actual implementation ledger](docs/RELEASE_STATUS.md).
