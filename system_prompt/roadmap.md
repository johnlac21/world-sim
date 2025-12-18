WORLD SIM BBGM — ROADMAP

A structured roadmap for the world simulation game.

After every completed ticket:

README.md → add to Recent Additions

DEVELOPER_ONBOARDING.md → add to Dev Changelog

ROADMAP.md → move completed ticket to Section 4 and insert an LLM-generated replacement ticket into Section 1

1. NEXT TICKETS (ACTIVE BACKLOG)

(This section changes each iteration. Maintain ~3–7 active items.)

Shared UI Components Library

Standardized UI primitives (cards, tables, headers, depth-chart rows, badges).

Season Headlines & Event Feed v1

Automatic yearly recap generated after each sim-year; displayed on /player and /world.

Person Career Summary Page v1 (NEW — replaces 3 completed UI tickets)

Standalone career page summarizing full PersonYearPerformance history, awards, offices held, role evolution, and career arcs.
Provides consistent URLs for long-term historical browsing (e.g., /person/[id]/career).

2. UPCOMING SYSTEMS (MEDIUM-TERM)

(Stable; not modified.)

Industry Roles System v1
Company Position System v1
Personality Archetypes & Behavioral Traits
Dynamic Talent Pipeline (youth → education → companies)
Company Performance v2 (bonuses, multipliers, prestige curves)
Country Performance v2 (gov score v2, population productivity, investments)
Player Actions & Country Management Menu
Simulation Settings (speed, seeds, auto-sim)
Events System (shocks, scandals, crises, elections)
Awards System (MVPs, All-Industry teams, championships UI)
Hall of Fame / Historical Records
Save/Load Worlds + import/export formats

3. LONG-TERM VISION (TOP-LEVEL THEMES)

(Stable; not modified.)

A BBGM-style competitive world with yearly national standings
Deep industry hierarchies modeled like sports leagues
Deterministic stats driving corporate + national outcomes
Generational life simulation (potential → peak → decline)
History, eras, dynasties — a persistent living timeline
Addictive loop: Sim → Analyze → Improve → Dominate

4. COMPLETED TICKETS

(Append-only.)

Education Impact Modeling v1

University Admission Controls (Player Country)
UI controls, eligibility hints, PlayerUniversityDecision model, backend GET/POST, sim-time overrides.

PersonYearPerformance Model

Prisma model, sim integration, per-person yearly scoring pipeline.

UI Layout Shell v1

Global layout (sidebar + top nav), GameLayout wrapper, globals.css cleanup.

Player Dashboard UI v2

Three-column dashboard: mini-standings, country stats, government summary, headlines, youth preview.

Company Page UI v2

Two-column BBGM layout, upgraded hierarchy sidebar, performance panels, industry peers + benchmark.

Standings Page UI v2

Wide BBGM-style table, trend arrows, player-country highlighting, integrated Top Companies and per-industry summaries.

Person Page UI v2

Player-card layout, grouped attribute grid, PersonYearPerformance chart, full career/role/office/education/employment histories.

5. WORKFLOW NOTES

Section 1 must always show the exact next active tickets the LLM will operate on.

When completing a ticket:

Append to README.md → Recent Additions

Append to DEVELOPER_ONBOARDING.md → Dev Changelog

Move the ticket from Section 1 → Section 4

LLM proposes and inserts a new ticket to keep Section 1 populated

Sections 2, 3, and 4 are append-only and never rewritten.