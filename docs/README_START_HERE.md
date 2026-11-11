# THE UNWRITTEN COMPANY — START HERE

Official repository: https://github.com/hdog960/The-unwritten-company
Expected public game: https://hdog960.github.io/The-unwritten-company/

This document is the primary handoff. No planned feature is an implemented feature unless the verified release ledger says so.

## Seven governing documents, in reading order
1. DESIGN_BIBLE.md — premise, rules, world, roster, campaign generator, progression and target experience.
2. UI_CONTROLS_AND_ART_DIRECTION.md — non-negotiable iPhone interface and art standards.
3. HANDHELD_CONTROLLER_LAYOUT.md — dedicated landscape left/center/right screen and touch controls.
4. ROADMAP.md — one hundred separate releases v0.01 through v1.00.
5. NEW_CHAT_HANDOFF_PROMPT.txt — repeatable instructions for continuing in another chat.
6. RELEASE_STATUS_TEMPLATE.md — required verified release report format.
7. README_START_HERE.md — operating contract (this file).

Also maintain RELEASE_STATUS.md as the *actual* implementation/deployment ledger, separate from these plans.

## Locked product
Original fantasy tactical roguelike. Create one custom hero and recruit three authored companions for fully controllable four-character turn-based grid combat. Each 60–90-minute *target* campaign is a coherent seeded three-act fantasy adventure, with meaningful choices, chance, twists, factions and varied endings. Permanent guild/Chronicle; build progression resets per run. Heroic, heartfelt and sometimes extremely funny. No licensed D&D/Baldur's Gate material.

## Platform/quality contract
iPhone Safari and Home Screen PWA; landscape combat, separate left party rail / central completely unobstructed battlefield / right action rail; artwork is richly illustrated storybook/miniature diorama, not empty boilerplate. Game and required hosting cost zero dollars; static GitHub Pages; no Vercel, Codex, ChatGPT Work, server bill or paid AI calls. Offline saves with migration and export later. Mobile usability never sacrificed for decoration.

## Per-release discipline
Check current main, files, tests, GitHub Pages, and release ledger. Implement the *next unfinished version*. Run actual tests and browser checks (distinguish them from a real iPhone test), commit, verify live Pages when possible, update release ledger with SHA, test outcomes, blockers and next slice. Versions are earned by real work, not by prompts or promises.

Hard player acceptance gates: v0.09 Gate A art/controls; v0.39 Gate B first full story; v0.79 Gate C procedural variety; v0.99 Gate D final quality. Do not proceed until the user explicitly approves a gate. Gate revisions happen without inventing extra milestone credit.

Status at first audit: new public repo, main and Pages enabled according to GitHub metadata, only initial README present; no game yet. A Pages flag is *not* proof the site loads.
