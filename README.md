# The Unwritten Company

**Every adventure becomes a legend. Most legends are accidents.**

An original tactical fantasy roguelike for iPhone, in which a custom hero and three recruited companions fight through coherently assembled, choice-driven miniature campaigns.

[Start here: the seven canonical project documents](docs/README_START_HERE.md)  
[Full 100-release development roadmap](docs/ROADMAP.md)  
[Verified release ledger](docs/RELEASE_STATUS.md)

Expected public game once deployed: https://hdog960.github.io/The-unwritten-company/

Early development: design targets are not yet playable features. Four player quality gates are enforced at v0.09, v0.39, v0.79 and v0.99. Required hosting cost: $0.

## Current verified development stage: v0.09 — Gate A unapproved

The implemented prototype is **one finishable deterministic tactical skirmish** with four controllable illustrated adventurers, two genuine enemy AI types, per-member AP and MP, HP/damage/Guard, deterministic legal movement, incoming attack intent, and victory/defeat/replay. No complete procedural campaign, recruitable companion story, protagonist creator or battle resume save exists yet.

**Fifth v0.09 original art and control pass:** Six individually illustrated miniatures now have short identity-specific ink-action gestures (shield, hammer, twin blades, scholar's crystal, briar thorns and spectral arcs). Puppet animation follows actual attack windup and impact timing: misses never displace untouched targets, critical impacts stagger clearly, and enemy-phase gestures are sequenced. New watercolor transitions tie water and moss to surrounding stone without creating gameplay blockers. Physical `!` seals on endangered party portraits and `◇` Ward emblems supplement color and border cues; the main battlefield remains completely clear of permanent controls and HUD. These are v0.09 visual refinements, not v0.10 features.

**Latest verified code SHA:** [`5d83f29`](https://github.com/hdog960/The-unwritten-company/commit/5d83f29cb8dfd31454fc508f38da507562d66f8f). [GitHub Actions checks](https://github.com/hdog960/The-unwritten-company/actions/runs/43061384423) **SUCCESS: 92/92 Node tests, three complete actual Chromium skirmish victories at 667×375, 844×390 and 932×430, and offline PWA combat checks**. [Pages build/deployment](https://github.com/hdog960/The-unwritten-company/actions/runs/43061382845) **SUCCESS** for the same source SHA. The public site could not be independently fetched through the available reader; iPhone Safari, Home Screen behavior and the player's visual acceptance are **NOT VERIFIED**.

**Gate A is NOT APPROVED; do not start v0.10 without explicit player approval of the actual iPhone artwork and controls.** Refer to [the seven canonical documents](docs/README_START_HERE.md), [Gate A review](docs/GATE_A_REVIEW.md), and [verified release ledger](docs/RELEASE_STATUS.md).
