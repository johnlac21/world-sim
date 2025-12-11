WORLD SIM BBGM — ROADMAP

A structured roadmap for the world simulation game.
Updated after each completed ticket:

README.md → append to “Recent Additions”
DEVELOPER_ONBOARDING.md → append to “Dev Changelog”
ROADMAP.md → move completed ticket to Section 4 + LLM proposes next ticket(s)

==================================================
1. NEXT TICKETS (ACTIVE BACKLOG)
==================================================

(Only this section changes every iteration.
Keep ~3–7 items here at all times.
The LLM inserts new tickets after a completion.)

Current backlog:

23. UI Layout Shell (BBGM-style top nav + sidebar + page wrapper)
    (Global page frame used across /player, /company/[id], /world/[id]/standings, etc.)

24. Player Dashboard UI v2 (BBGM-style three-column layout:
    mini-standings, country dashboard panels, world headlines)

25. Shared UI Components Library
    (Tables, panels/cards, standings rows, depth chart blocks, section headers)

26. Company Page UI v2
    (BBGM depth-chart layout, two-column structure, cleaner performance panels)

27. Standings Page UI v2
    (BBGM table styling, trend arrows, better per-industry summaries)

28. Person Page UI v2
    (BBGM player-card layout, attributes grid, career performance table)

==================================================
2. UPCOMING SYSTEMS (MEDIUM-TERM)
==================================================

These systems will eventually be decomposed into multiple fine-grained tickets.

Industry Roles System v1
Company Position System v1
Personality Archetypes & Behavioral Traits
Dynamic Talent Pipeline (youth → education → companies)
Company Performance v2 (bonuses, multipliers, prestige curves)
Country Performance v2 (gov score v2, population productivity, investments)
Player Actions & Country Management Menu
Simulation Settings (speed, seeds, auto-sim)
Events System (shocks, scandals, gov crises, elections)
Awards System (MVPs, All-Industry teams, champions UI)
Hall of Fame / Historical Records System
Save/Load Worlds + import/export formats

==================================================
3. LONG-TERM VISION (TOP-LEVEL THEMES)
==================================================

Rarely changed—these guide all ticket design.

A full BBGM-style competitive world where countries compete yearly
Deep industry hierarchies modeled like sports leagues
Deterministic stats driving corporate + national performance
Generational life simulation (potential, peak age, decline)
History, dynasties, eras; a living world timeline
Addictive optimization loop: Sim → Analyze → Improve → Dominate

==================================================
4. COMPLETED TICKETS
==================================================

Append new items here as brief bullets.
Older entries remain permanently.

11. Education impact modeling v1

12. University admission controls for the player country
    (Player admissions override sim logic, UI controls, eligibility hints,
     PlayerUniversityDecision model, backend POST/GET, sim-time overrides)

13. PersonYearPerformance model (per-person yearly contributions)
    (Prisma model, sim integration, per-person yearly scores, reset/seed fixes)

Example: Per-Country Industry Dashboard
Example: World Standings (company + country scores)
Example: CountryYearPerformance pipeline (champions, ranking)
Example: Company Performance page (benchmarks, peers, charts)
Example: Player-Country Dashboard (/player)

==================================================
5. NOTES
==================================================

Section (1) should ALWAYS reflect the exact next tickets your workflow will use.

When a ticket is completed:
Append a tiny summary to README.md (Recent Additions)
Append a dev-facing note to Developer Onboarding (Dev Changelog)
Move the ticket from Section (1) → Section (4)
LLM proposes a new ticket to add into Section (1)

Do not rewrite Sections (2), (3), or (4).

This file is stable and append-only except for Section (1).
