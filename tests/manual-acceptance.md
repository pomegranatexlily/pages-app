# PAGES v0.1 — Two-account manual acceptance script

Run the app locally (`python3 -m http.server 8080`) and open it in your
browser. Demo mode stores data in the browser (localStorage, shared across
tabs) with a per-tab sign-in (sessionStorage) — so the two-account test
runs in **two tabs of the same browser**.

## Setup

- **Tab 1 — Account A (Ama):** sign in as `ama@test.com`
- **Tab 2 — Account B (Ben):** sign in as `ben@test.com`

## The journey

1. [A] Circles → create "Community Event Team", purpose "First event".
   Expect: redirected into the circle; Members tab shows Ama as owner.
2. [A] Members → Create invite link → Copy link.
3. [Tab 2] Paste the invite link in the second tab → expect "Welcome in."
4. [B] Missions → create "Organize our first community event".
   Add milestones: "Select a location", "Establish the budget".
5. [A] Refresh — expect to see B's mission and milestones (persistence).
6. [A] Commitments → Propose: to Ben, title "Confirm the venue by October 16",
   terms "Call Riverside Hall, confirm Oct 24 availability, report back in chat."
7. [B] Home → expect the commitment card "needs your answer".
8. [B] Open the circle → Commitments → Accept.
   Expect: pill changes to "accepted".
9. [A] Commitments → attempt to mark it completed — allowed (proposer).
   (Or have B complete it.) Expect: "completed", History shows
   proposed → accepted → completed with identical title/terms snapshots.
10. [A] Activity → expect the full event trail.
11. [B] Chat → send "Venue confirmed!" → [A] refresh → message visible.

## Authorization checks

12. Open a **third tab**, sign in as `mallory@test.com`, paste the
    circle URL directly (no invite). Expect: "Circle unavailable / Not a member".
13. [A] Propose a second commitment to Ben. [A] attempts to Accept it.
    Expect: error "Only the recipient can accept or decline".
14. [B] Accept, then attempt to Accept again. Expect: "no longer awaiting a response".
15. Create an invite, then in B's browser wait past expiry (or craft an
    expired token via devtools). Expect: "Invite expired".

## Mobile layout

16. Resize to 390×844 (or use a phone). Check: tab bar reachable, no
    horizontal scroll, forms usable, cards readable.

Pass criteria: all 15 steps behave as described with no console errors.
