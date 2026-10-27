# AI Engineering Handoff: Spatial Landing Page Enhancements

Updated: 2026-10-27
Repository: https://github.com/pomegranatexlily/pages-app
Purpose: Shared source of truth for ChatGPT, Perplexity, and the founder while improving the existing Pomegranate × Lily Labs landing page.

## Working agreement

- Extend the existing implementation; do not rebuild the site or introduce a framework without evidence it is needed.
- Keep production unchanged until a proposed change is reviewed, tested, and explicitly approved for merge.
- Work in small, reversible changes on a feature branch and open a pull request.
- Report clearly what was inspected, changed, tested, and not tested. Do not claim a live iPhone/browser visual check unless one was actually performed.
- Prefer progressive enhancement and graceful fallbacks over requiring a new browser feature.
- Preserve the current visual identity and spatial character.

## Existing implementation observed

- `index.html`: landing page and Work, Services, Founder, and Contact views; CSS-rendered Packet Lily product demonstration.
- `studio.css`: spatial background/layers, 3D phone and document mockup, perspective presentation, responsive styling, and reduced-motion rules.
- `studio.js`: view/navigation interactions, contact mailto behavior, and touch/swipe interactions for the product stage.
- `.github/workflows/deploy-pages.yml`: checks JavaScript syntax, runs Node tests, stages the site, and deploys GitHub Pages.
- Existing tests include `tests/studio.test.cjs` and `tests/inquiry-errors.test.cjs`.

These are repository-level observations, not a claim that every behavior has been visually verified on all devices. Reinspect the current branch before editing; this note may become stale.

## Goal

Make the current site feel more cohesive, polished, and spatial without damaging its existing 3D product showcase, navigation, mobile usability, or accessibility.

## Recommended implementation sequence

### Phase 1 — Navigation/view transitions (first, contained change)

1. Inspect the current navigation markup, CSS view-state selectors, and JavaScript event flow.
2. Determine whether the current view changes can use the View Transition API without changing the current state-management model.
3. Add a progressive enhancement only. If unsupported, retain the existing immediate view switch.
4. Respect `prefers-reduced-motion: reduce`; reduced motion should disable or substantially simplify the transition.
5. Preserve keyboard operation, focus visibility, URL behavior if present, and all existing Work/Services/Founder/Contact content.
6. Avoid introducing a framework or dependency for this feature.
7. Add or update tests for the state transitions and fallback behavior where the current test setup allows it.

Acceptance checks:
- Existing navigation still selects the correct view.
- Unsupported browsers still work.
- Reduced-motion preference is honored.
- No hidden view remains accidentally focusable or blocks interaction.
- No unrelated visual or content changes are included.

### Phase 2 — Restrained scroll-driven product motion

Only start after Phase 1 is reviewed and green.

- Enhance the existing CSS 3D phone/document rather than replacing it.
- Use a subtle scroll-linked transform only if browser support and layout behavior are suitable; otherwise use the existing static presentation.
- Do not hijack page scrolling, add heavy animation libraries, or make text/product details hard to read.
- Preserve the Front, Perspective, and Packet controls and existing touch/swipe behavior.
- Respect reduced-motion preferences and avoid continuous high-cost animation on mobile.

Acceptance checks:
- Normal scrolling remains natural.
- Manual perspective controls still work.
- Mobile layout does not overflow or become jittery.
- Reduced-motion users retain a clear, usable product presentation.

### Phase 3 — Reusable UI components (later)

After the first two phases are stable, identify repeated patterns worth extracting (for example, project cards, contextual panels, or buttons). Extract only where reuse is real; avoid abstraction for its own sake. Consider Web Components only if they simplify cross-project reuse enough to justify the added structure.

## Required validation

Run the existing repository checks from the repository root:

```sh
node --check studio.js
node --test tests/*.test.cjs
```

Also inspect the Git diff for accidental content, asset, workflow, or unrelated style changes. If a browser automation or screenshot tool is available, test desktop and narrow mobile widths and capture evidence; otherwise state that visual testing remains outstanding. Confirm GitHub Actions status before proposing merge.

## Constraints

- Do not change production or merge automatically.
- Do not remove or replace the current CSS spatial scene or 3D mockup.
- Do not add dependencies, paid APIs, analytics, or external services without explicit approval.
- Do not expose founder/private controls or change contact destinations.
- Keep performance, accessibility, touch behavior, and mobile-first layout as first-class requirements.
- Keep each PR focused on one phase and document any trade-offs.

## Handoff format for each future session

Update this file or the relevant PR description with:
- Current branch and base commit
- Files changed and why
- Tests run and exact results
- Browser/device checks actually performed
- Known limitations or remaining risks
- Next smallest actionable step

## Immediate next action

Inspect the current `index.html`, `studio.css`, `studio.js`, and tests on the feature branch, then propose Phase 1 as a small diff. Do not begin Phase 2 until Phase 1 checks pass and the founder has reviewed the result.
