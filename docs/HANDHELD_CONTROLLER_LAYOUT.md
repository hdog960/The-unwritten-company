# THE UNWRITTEN COMPANY — HANDHELD TACTICAL LAYOUT

Design reference: a portable hinged brass-and-leather storyteller's command ledger, holding a miniature battlefield between two integrated control surfaces. No copied console branding or external game UI.

Landscape composition:
LEFT / PARTY RAIL | CENTER / TACTICAL WORLD | RIGHT / COMMAND RAIL

LEFT: four compact, readable party portraits; HP/status; selection and unit information.
CENTER: grid, terrain, true unit positions and direct target preview; never opaque HUD or buttons.
RIGHT: four contextual powers, AP and cost, confirm/cancel, turn order, enemy intent, End Turn.

Use three siblings in real DOM grid, not one fullscreen canvas behind decorative controls. Center canvas or scene is size-aware and can letterbox only when the grid would otherwise become unfair. At small landscape widths condense side rail labels and fold tooltips into a pause/help panel; keep controls discoverable. Keep safe areas on outer edges and game stage away from notches. Typography optimized for iPhone viewing distance.

Controls: tap portrait → tap skill → tap tile/target → preview → confirm; tap cancel returns without consuming resources. Explicit End Turn with distinct placement. Keyboard fallback: tab/arrow focus, enter action, escape cancel; every control labeled. Pinch/drag must not accidentally attack. No ongoing joystick needed for a turn-based game.

Rejection: center too narrow; text too small; gameplay occluded by controls; poor touch target; misleading AP; hidden enemy; button/tooltip covering a threatened tile; failure to recover from cancel or accidental end turn.

Testing: 667×375, 844×390, 932×430, simulated notches, both orientations, text enlargement, portrait notice, installed PWA, actual iPhone review at approval gates.
