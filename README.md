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

**Latest v0.09 Gate A quality correction (eighth pass):** Original bookbinder-floor threat stitches now lie *beneath* the miniatures instead of crossing faces; attack and approach have distinct shapes, and valid/invalid travel has faint footsteps, open-corner destination marks and a crossed invalid-target mark. Hit/critical/miss effects now use separate short hand-cut paper/ink fragments timed after impact. The 3-column landscape controls, one finishable seeded skirmish, offline cache and combat engine are unchanged. Gate A is not approved.

**Latest independently tested source:** [`2c680390`](https://github.com/hdog960/The-unwritten-company/commit/2c680390de63d78739ec7cf96482c05dd9208b5a). [PR Foundation CI 43100799291](https://github.com/hdog960/The-unwritten-company/actions/runs/43100799291): **119/119 Node tests passed**, three completed Chromium victories at 667×375, 844×390, 932×430 and actual cached offline skirmish/foe turn. [PR #1](https://github.com/hdog960/The-unwritten-company/pull/1) merged at [`e11735a`](https://github.com/hdog960/The-unwritten-company/commit/e11735a576633f24a4462ecf4e5822ce0b650476) after green CI. [Pages 43101134304](https://github.com/hdog960/The-unwritten-company/actions/runs/43101134304) **SUCCESS** on the merge commit. Actual iPhone Safari/Home Screen and independent direct site HTTP remain **UNVERIFIED**.

**Gate A remains NOT APPROVED; v0.10 remains blocked** until the player explicitly approves the art and iPhone touch layout. See [Gate A review checklist](docs/GATE_A_REVIEW.md), the [seven governing documents](docs/README_START_HERE.md) and [actual implementation ledger](docs/RELEASE_STATUS.md).
