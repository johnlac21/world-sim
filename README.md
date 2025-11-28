# WORLD SIM BBGM — README (TXT VERSION)

A web-based world simulation game inspired by Basketball GM, where you simulate a living generational world with people, countries, births, deaths, education, jobs, governments, and elections. You, the player, control **one country** in the world (via `World.controlledCountryId`) rather than a single person. Built with Next.js, Prisma, and SQLite.

==================================================
CURRENT FEATURES (IMPLEMENTED)
==================================================

1. PROJECT ARCHITECTURE
------------------------
Frontend:
- Next.js (App Router)
- React client components
- UI pages:
  • Home world overview (/)
  • Controlled country dashboard (/player)
  • Country pages (/country/[id])
  • Person pages (/person/[id])
  • Global leaders page (/leaders)
  • Office history pages (/office/[id])

Backend:
- Next.js API routes for:
  • Getting world summary
  • Simulating 1 year
  • Resetting/reseeding the world
  • Fetching the controlled country dashboard
  • Fetching a single country + its offices/terms
  • Fetching a single person with jobs/education/marriages
  • Fetching world-level offices and specific office history

Database:
- SQLite + Prisma ORM
- Core tables:
  • World (with controlledCountryId)
  • Country
  • Person
  • Company
  • Employment
  • School
  • Enrollment
  • Marriage
  • Office
  • Term


2. WORLD GENERATION (RESET)
----------------------------
The "Reset World" button fully regenerates a new world via POST /api/world/reset:

- Deletes all worlds and dependent data:
  • People, companies, schools, offices
  • Employments, enrollments, marriages, terms, etc.
- Creates a fresh world (SimWorld 1, year 0)
- Creates 5 countries
- Generates 2,000 NPC people:
  • Ages roughly 0–60
  • Random stats (20–80)
  • Random assignment to countries
  • Random names
- (Optional) Creates a special “flavor” character if desired, but **control** is at the country level.
- Creates schools in each country:
  • Primary, Secondary, University with prestige values
- Creates companies in each country:
  • 3–6 companies per country
- Seeds initial education:
  • Age-based enrollment into primary, secondary, or university
- Seeds initial jobs:
  • Working-age NPCs get jobs probabilistically
- Creates political offices:
  • One world-level office (e.g., “World President”)
  • One country-level president office per country
- Sets `World.controlledCountryId` to one of the countries (e.g., the first one), marking it as the player-controlled country.

Reset = wipe everything + clean reseed consistent with `seedWorld.ts` and the current schema.


3. YEARLY SIMULATION LOOP ("SIM 1 YEAR")
-----------------------------------------
Each time you click "Sim 1 Year" (POST /api/sim/year), the simulation advances one year via `src/lib/sim.ts`:

Aging:
- All living people age +1 year.
- The population of your controlled country ages along with everyone else.

Deaths:
- Age-based death probabilities:
  • <50: 0.1%
  • 50–65: 0.5%
  • 65–80: 2%
  • 80–95: 8%
  • 95+: 25%
- Dead people are marked `isAlive = false` and their jobs/enrollments end.

Births:
- For every person age 20–40:
  • 5% chance to have a baby each year.
  • Baby inherits parent stats ± randomness.
  • Born into parent’s country.
  • Age starts at 0.
  • Parent link stored (e.g., `parent1Id = parent.id`).

Stat growth:
- Children/teens (<18) get small yearly changes:
  • Mental stats: intelligence, wit, discipline.
  • Physical stats: strength, athleticism, endurance.
- Stats are clamped to reasonable ranges (e.g. 1–99).

Education progression:
- Current enrollments:
  • Primary → graduate around age 12.
  • Secondary → graduate around age 18.
  • University → graduate after ~4 years or by age ~23; small dropout chance.
- New enrollments if not currently in school:
  • 6–11: enter Primary (if not yet completed).
  • 12–17: enter Secondary (if Primary completed).
  • 18–22: may enter University (if Secondary completed + sufficient academic stats).

Jobs & employment:
- Working-age people (roughly 18–65) can:
  • Get hired into companies (per-country job market).
  • Receive annual raises.
  • Get promoted along a job ladder (Intern → Junior Analyst → Analyst → Senior Analyst → Manager → Director → VP).
  • Be fired with a small probability.
  • Retire past a certain age (e.g., >75 auto-ends job).
- Hiring probability & salary:
  • Based on intelligence, discipline, charisma, and education (university completion boosts chances and pay).
- Your controlled country’s employment stats emerge from these individual outcomes.

Governments & offices:
- Offices exist at world and country level (e.g., World President, President of Alboria).
- Terms track office holders over time (startYear, endYear, personId).
- Simulation can be extended with:
  • Term limits, term lengths.
  • Automatic elections every N years.
  • Candidate selection based on charisma/leadership and other stats.

Player (country control):
- The “player” is the country referenced by `World.controlledCountryId`.
- All the above systems (births, deaths, schools, jobs, offices) operate globally, but your main dashboards and decisions focus on this one controlled country.


4. WEB INTERFACE (HOME PAGE)
-----------------------------
Route: /

The homepage shows:

- World name
- Current year
- Aggregate counts:
  • Number of countries
  • Total people
  • Total companies
  • Employed vs unemployed
- A sample of people in the world (e.g. 20 people) with links to their person pages.
- Buttons:
  • Sim 1 Year
  • Reset World
- Links to:
  • Controlled country dashboard (/player)
  • Global leaders page (/leaders)

This is the central “world overview” and main entry point into deeper pages.


5. CONTROLLED COUNTRY PAGE (PLAYER DASHBOARD)
----------------------------------------------
Route: /player

Shows:

- The controlled country (from `World.controlledCountryId`):
  • Country name
  • World name
- Country-level metrics:
  • Population (alive residents)
  • Employed / Unemployed counts
  • Number of companies
  • Number of schools
- Political overview:
  • Offices in this country
  • Current office holders (e.g., President)
- Updates automatically after each simulation year.

This page is the main management view for the user. Future features (policy sliders, budgets, election strategies) will plug into this dashboard.


6. OTHER PAGES
---------------
Country page: /country/[id]
- Shows:
  • Country name
  • Offices and their term history
  • Current vs past leaders
- Backed by: GET /api/country/[id]

Person page: /person/[id]
- Shows:
  • Name, age, alive/dead status
  • Country, birth year, full stats
  • Career history (current job + past employments)
  • Education history (current enrollment + past schools)
  • Marriages (spouses and years)
- Backed by: GET /api/person/[id]

Global leaders: /leaders
- Shows:
  • World-level offices (e.g., World President)
  • Optional country-level summaries.
- Backed by: GET /api/offices/world

Office history: /office/[id]
- Shows:
  • Office metadata (name, level, country/world, term length if used)
  • Full list of terms (who held this office and when).
- Backed by: GET /api/office/[id]


7. EXISTING API ENDPOINTS
--------------------------
GET /api/world
- Returns world summary:
  • World info
  • Counts (countries, people, companies, employment)
  • Sample people
  • Possibly the controlledCountryId

POST /api/sim/year
- Runs the yearly simulation loop (aging, deaths, births, jobs, schools, offices, etc.)

POST /api/world/reset
- Deletes all data and regenerates a new world (reset + reseed).

GET /api/player-country (or /api/player used as a country)
- Returns controlled country dashboard data:
  • Country metrics
  • Basic office overview

GET /api/country/[id]
- Returns a single country with offices + term history.

GET /api/person/[id]
- Returns a person with stats, jobs, schools, marriages.

GET /api/offices/world
- Returns all world-level offices and their terms.

GET /api/office/[id]
- Returns one office with its term history.


8. CURRENT STATS MODEL
-----------------------
Each Person includes:

Mental:
- intelligence
- wit
- discipline

Social:
- charisma
- leadership
- empathy

Physical:
- strength
- athleticism
- endurance

Stats are typically 20–80 at generation and can change slightly each year for younger people.


9. WORLD LAYOUT
----------------
- One World (SimWorld 1)
- Five Countries
- 2,000+ NPC people at start (grows over time as births occur)
- Each Country has:
  • A population of people
  • Several Companies
  • Several Schools (Primary, Secondary, University)
  • At least one top-level political Office (e.g. President)
- The World has:
  • One controlled country (the player’s country)
  • Optionally a world-level office (e.g. World President)
- Everything evolves over time through the yearly simulation loop.


10. FOLDER STRUCTURE (CORE FILES)
----------------------------------
src/
  app/
    page.tsx                       → Home world overview UI
    player/page.tsx                → Controlled country dashboard
    country/[id]/page.tsx          → Country detail + political history
    person/[id]/page.tsx           → Person detail (career, education, marriages)
    leaders/page.tsx               → Global leaders overview
    office/[id]/page.tsx           → Office term history
    api/
      world/
        route.ts                   → GET /api/world (world summary)
        reset/route.ts             → POST /api/world/reset (reset + reseed)
      sim/year/route.ts            → POST /api/sim/year (advance simulation)
      player-country/route.ts      → GET /api/player-country (controlled country)
      country/[id]/route.ts        → GET /api/country/[id]
      person/[id]/route.ts         → GET /api/person/[id]
      offices/world/route.ts       → GET /api/offices/world
      office/[id]/route.ts         → GET /api/office/[id]
  lib/
    prisma.ts                      → Prisma client helper
    sim.ts                         → Simulation engine (aging, births, deaths,
                                     jobs, education, offices, etc.)

scripts/
  seedWorld.ts                     → Initial generator logic for dev/CLI

prisma/
  schema.prisma                    → Database schema for all models


11. DEVELOPMENT WORKFLOW
--------------------------
Install dependencies:
  npm install

Start dev server:
  npm run dev

Reset world:
  Click "Reset World" in the UI (or POST /api/world/reset)

Simulate:
  Click "Sim 1 Year" (or POST /api/sim/year)

Explore the world:
  Home:
    /
  Controlled country dashboard:
    /player
  Countries:
    /country/[id]
  People:
    /person/[id]
  Global leaders:
    /leaders
  Office history:
    /office/[id]


==================================================
NEXT FEATURE PATHS (A–F)
==================================================

OPTION A — JOBS & EMPLOYMENT SYSTEM
------------------------------------
(Current: basic implementation exists; could be deepened.)

Adds / extends:
- More detailed companies (industries, sizes).
- More nuanced hiring logic based on stats and education.
- Promotions, demotions, firings with performance-based rules.
- Salaries and wealth accumulation.
- Country-level employment metrics that respond to policy.

OPTION B — EDUCATION SYSTEM (SCHOOLS & UNIVERSITIES)
------------------------------------------------------
(Current: basic implementation exists; could be deepened.)

Adds / extends:
- More detailed school prestige and its impact on jobs.
- Degrees/majors affecting career paths.
- Country-level education spending and outcomes.
- Alumni networks, referrals, elite pipelines.

OPTION C — RELATIONSHIPS & FAMILIES
-------------------------------------
(Current: parent links and marriages model exist; logic can expand.)

Adds:
- Parents, siblings, and rich family trees.
- Friendships and social circles with “closeness” scores.
- Children from two parents (both parent1Id and parent2Id).
- NPC marriages/divorces with probabilities tied to stats or events.
- Player country’s demographic + family metrics (marriage rates, fertility, etc.).

OPTION D — GOVERNMENTS & ELECTIONS
-----------------------------------
(Current: Office + Term models and history pages exist.)

Adds:
- Full political institutions per country:
  • President, Minister roles, Mayor, etc.
- Election cycles every N years.
- Candidate selection based on charisma, leadership, popularity, etc.
- Prestige modifiers for office holders.
- Player-controlled country:
  • Ability to influence elections, campaign, or even stand as a candidate (if you later reintroduce a personal avatar).

OPTION E — COUNTRY POLICY SETTINGS (BBGM-STYLE)
------------------------------------------------
(Not yet implemented; big opportunity for “gameplay.”)

Adds:
- Country-level “policy sliders”:
  • Education investment
  • Economic/jobs programs
  • Healthcare/welfare
  • Security/policing
  • Campaign spending / political reform
- Stat and outcome effects:
  • Policy mix influences education rates, employment, crime, health, and political stability.
- Passive, long-horizon decisions, similar in spirit to BBGM’s strategy sliders.

OPTION F — UI EXPANSION & WORLD BROWSER
----------------------------------------
(Partially implemented; can be expanded heavily.)

Adds:
- People directory with filtering/search (by age, stats, country, etc.).
- Institution pages:
  • Company detail pages (employees, size, average salary).
  • School pages (students, alumni, prestige, outcomes).
- BBGM-style history:
  • Past presidents list per office.
  • Alumni lists and elite pipelines.
  • Player country’s historical metrics (GDP-like analogs, unemployment, literacy).
  • Timeline of “notable events” in the world.

This makes the world more explorable, legible, and fun to poke around in.


==================================================
NEXT STEP
==================================================

You, the user, control exactly one country (via `World.controlledCountryId`). The next major gameplay layer is to add **country-level decision-making** (policies, budgets, election strategies) that hooks into the existing simulation. Choose one next feature or sub-feature from A–F, and it will be added cleanly and step-by-step, staying consistent with the existing architecture and simulation loop.
