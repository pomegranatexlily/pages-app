# Services Page Expansion — Perplexity Implementation Brief

**Repository:** `pomegranatexlily/pages-app`  
**Current feature branch:** `docs/spatial-ui-handoff-20261027`  
**Current open draft PR:** [#6 — docs: add shared AI handoff for spatial UI enhancements](https://github.com/pomegranatexlily/pages-app/pull/6)

## Goal

Expand the Services view in `index.html` so it communicates the founder's broader practical development capabilities, while preserving the existing editorial visual identity, spatial Packet Lily showcase, navigation, responsive layout, and working interactions.

This is a focused content-and-information-architecture change, not a redesign. Keep the current four service rows if practical, but broaden their descriptions and make the overall offer comprehensive and easy for prospective Upwork clients to scan.

## Current Services section

The current four categories are:
1. Web applications & business websites
2. AI & API integration
3. Documents & workflows
4. Repair & refinement

They are a good foundation but underrepresent the studio's front-end work, broader application implementation, Python tools, deployment support, and quality assurance.

## Recommended Services content

Organize the services so they clearly cover these areas (combine related items into the existing rows or add a small number of rows only if the layout remains clean):

1. **Websites, Front-End & Interactive UI**  
   Responsive, mobile-first websites; interactive interfaces; spatial/product presentation; tasteful motion and browser-native UI features; accessible, touch-friendly layouts.

2. **Full-Stack Web Applications**  
   Build and improve browser-based applications by connecting front-end interfaces, application logic, APIs, and data/storage components where appropriate. Scope authentication, payments, hosting, and persistence explicitly for each project rather than implying they are included by default.

3. **AI Features & API Integration**  
   AI-assisted workflows, model/API integration, structured prompts, loading/error/fallback behavior, data-boundary awareness, and representative response evaluation.

4. **Automation, Python & Learning Tools**  
   Practical task automation, browser-based developer tools, coding/learning environments, and small utilities. Link Python Atelier as an example.

5. **Documents, Forms & Business Workflows**  
   Intake forms, structured briefs, reports, invoice/job documentation, exports, and repeatable business processes. Link Packet Lily where relevant.

6. **Debugging, Testing & Codebase Improvement**  
   Reproduce a reported issue, inspect the existing implementation, identify likely causes, make targeted changes, run relevant checks, and verify affected flows. Mention regression tests and acceptance criteria where applicable.

7. **Deployment, Maintenance & Technical Handoffs**  
   Deployment assistance, release checks, documentation, handoff notes, and scoped follow-up maintenance for supported projects. Do not claim ongoing monitoring or support unless agreed and actually provided.

## Proof and positioning

- Preserve the positioning **Founder & AI-Assisted Full-Stack Developer** and the current G-CAFL-QC method section.
- Link services to existing, relevant projects rather than presenting unsupported claims:
  - Packet Lily / Closeout Pocket: https://pomegranatexlily.github.io/Closeout-Pocket/
  - Python Atelier: https://pomegranatexlily.github.io/Python-Atelier/
  - POM Lily Labs: https://pom-lily-labs.pages.dev/
  - GitHub portfolio: https://github.com/pomegranatexlily
- Describe capabilities honestly. Do not imply every backend, database, security, hosting, payment, or infrastructure pattern has been demonstrated in production.
- Retain the core selling point: the studio can clarify a client's problem, define requirements, direct implementation, troubleshoot defects, and work toward a tested, usable result. Sell problem-solving and disciplined execution, not a claim of knowing every technology in advance.

## Guardrails — do not break the existing site

- Do not redesign the site or alter the existing spatial Packet Lily product render.
- Do not change the navigation model, route radio inputs, IDs, contact/email behavior, or product angle controls.
- Avoid adding libraries, build tooling, paid services, frameworks, or dependencies for this content update.
- Keep semantic HTML, mobile responsiveness, keyboard usability, and existing typography/spacing conventions.
- If adding service rows, inspect the existing CSS selectors and mobile breakpoints first; reuse current `.service-row` styling where possible.
- Do not change `studio.js` unless a demonstrated requirement makes it necessary.

## Validation checklist

1. Review current `index.html`, `studio.css`, `studio.js`, README, and existing tests before editing.
2. Make the smallest focused change, preferably to the Services section in `index.html` and only necessary CSS if the new content needs it.
3. Run the repository's existing tests and JavaScript syntax checks using the documented workflow.
4. Verify service headings and descriptions render correctly on narrow mobile and desktop widths.
5. Verify all four navigation views still work, the Packet Lily angle controls remain functional, and contact links still open the intended email draft.
6. Inspect the final diff for accidental changes, dead code, broken links, misleading claims, or unrelated refactoring.
7. Report exactly what changed and which checks passed or could not be run.

## Delivery rule

Work on a feature branch and open/update a pull request for review. Do not merge or publish to production without the owner's approval. This document is an implementation brief, not authorization to skip tests or make unrelated changes.
