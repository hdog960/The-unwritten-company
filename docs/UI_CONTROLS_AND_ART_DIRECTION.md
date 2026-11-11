# THE UNWRITTEN COMPANY — UI / CONTROLS / ART

This is a non-negotiable visual and usability standard, alongside the handheld layout document.

## Screen
Landscape iPhone-first; support actual Safari and Home Screen landscape sizes and both device rotations. Hard CSS layout with separate **left party rail**, **middle battlefield** and **right command/turn rail**. No permanent controls, floating joysticks, HUD, panels or tooltips covering a live battlefield pixel. The center contains only tactical world, native unit silhouettes, world-surface grid markers and preview effects. Fullscreen dialogue/inventory are allowed when combat is paused or outside battle. Don't shrink the center to a postage stamp; responsively compress or scroll *inside rails*, not the arena. Touch target recommendation >=44 CSS px; account for notch, safe area and home gesture inset. Test at logical sizes 667x375, 844x390 and 932x430 and real devices later.

Left side: four selectable portraits, HP and state, active unit. Right side: abilities with AP and cost, action preview summary, intent/turn queue, confirm/cancel and distinct End Turn. Center: sufficiently large grid, cover, environment, miniatures, telegraphs, ranged/AOE highlight. Flow: select hero, choose action, select target, preview consequences, confirm, feedback; cancel never spends AP. No fake hover dependence. Keyboard fallback, reduced motion, legible labels and colorblind-friendly patterns.

Portrait screens may use full screen landscape layout (no battlefield to obstruct); narrative font must be readable outdoors. Scaling text cannot hide key buttons. Avoid triggering scroll/zoom while targeting. Preserve focus order and announce important state transitions accessibly.

## The Illuminated Table style
Original whimsical dark storybook fantasy with painted ink contours, brass-framed miniature diorama, cracked enamel gems, layered tactile parchment and warm lanterns. No generic blue web admin dashboard, flat wireframe passed as final art, obvious mismatched assets, identical NPC face swaps or copyrighted visual copies.
Suggested material colors: Midnight Ink #1D2735; Parchment #E9D8AD; Candle Gold #DDAE63; Oxblood #873F4A; Moss #526B54; Mage Teal #5BB8AB; Danger Coral #E98575. Pair colors with distinct shape/line/texture cues. Region sets vary hue, lighting, scenery, sky and creatures. Characters have original silhouettes and readable stances. Animations: idle, anticipation, effect, recovery and expressive portrait reactions. Effects never conceal target legality.

## Acceptance tests
- Separately measured DOM rectangles: rails never overlap stage; battlefield retains adequate width at all breakpoints.
- Every stage cell remains fully visible and tappable after rotation, safe-area padding and font scaling.
- No pointer phantom action, double spends, canceled-target AP loss, blocked cancel, or inaccessible End Turn.
- Combat run and long text tested in keyboard and pointer input.
- Narrative screens and menu flows tested without scroll-lock dead ends.
- Visual screenshot inspection is required at all player gates; automated CSS assertions are insufficient to certify art.

**Gate A** player scrutinizes initial miniatures, original art and actual control comfort before the team advances past v0.09.
