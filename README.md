# WORLD SIM BBGM — README (TXT VERSION)

A web-based world simulation game inspired by Basketball GM, where you simulate a living generational world with people, countries, births, deaths, and a controllable player character. Built with Next.js, Prisma, and SQLite.

==================================================
CURRENT FEATURES (IMPLEMENTED)
==================================================

1. PROJECT ARCHITECTURE
------------------------
Frontend:
- Next.js (App Router)
- React client components
- Simple UI listing world data, with control buttons

Backend:
- Next.js API routes for:
  • Getting the world
  • Simulating 1 year
  • Resetting the entire world

Database:
- SQLite + Prisma ORM
- Tables:
  • World
  • Country
  • Person


2. WORLD GENERATION (RESET)
----------------------------
The "Reset World" button fully regenerates a new world:

- Deletes all worlds, countries, and people
- Creates a fresh world (SimWorld 1, year 0)
- Creates 5 countries
- Generates 2,000 people:
  • Ages 0–60
  • Random stats (20–80)
  • Random assignment to countries
  • Random names
- Creates one special player character (isPlayer = true)

This matches the original seed script behavior.


3. YEARLY SIMULATION LOOP ("SIM 1 YEAR")
-----------------------------------------
Each time you click "Sim 1 Year", the following occurs:

Aging:
- All living people age +1 year

Deaths:
- Probability increases by age:
  • <50: 0.1%
  • 50–65: 0.5%
  • 65–80: 2%
  • 80–95: 8%
  • 95+: 25%

Births:
- For every person between ages 20–40:
  • 5% chance to have a baby
  • Baby inherits parent stat averages ± randomness
  • Born into parent’s country
  • Age starts at 0

Player:
- The player character also ages normally


4. WEB INTERFACE (HOME PAGE)
-----------------------------
The homepage shows:

- World name
- Current year
- Number of countries
- Sample of 20 people (ordered by ID)
- Buttons:
  • Sim 1 Year
  • Reset World

This view allows live interaction with the simulation.


5. PLAYER PAGE
---------------
Route: /player

Shows:
- Player name
- Age
- Country
- All stats
- Updates immediately after each simulation year


6. EXISTING API ENDPOINTS
--------------------------
GET /api/world
- Returns world info, countries, sample people

POST /api/sim/year
- Runs the yearly simulation loop

POST /api/world/reset
- Deletes all data and regenerates a new world

GET /api/player
- Returns the player character


7. CURRENT STATS MODEL
-----------------------
Each person includes:

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

Stats are typically 20–80 at generation.


8. WORLD LAYOUT
----------------
- One world
- Five countries
- 2,000 NPC people
- One player character


9. FOLDER STRUCTURE (CORE FILES)
---------------------------------
src/
  app/
    page.tsx                 → Home UI
    player/page.tsx          → Player page
    api/
      world/
        route.ts             → GET world
        reset/route.ts       → POST reset world
      sim/year/route.ts      → POST simulate 1 year
  lib/
    prisma.ts                → Prisma client helper
    sim.ts                   → Simulation engine

scripts/
  seedWorld.ts               → Initial generator logic

prisma/
  schema.prisma              → Database schema


10. DEVELOPMENT WORKFLOW
--------------------------
Install dependencies:
  npm install

Start dev server:
  npm run dev

Reset world:
  Click "Reset World" in the UI

Simulate:
  Click "Sim 1 Year"

Player page:
  Visit /player


==================================================
NEXT FEATURE PATHS (A–F)
==================================================

OPTION A — JOBS & EMPLOYMENT SYSTEM
------------------------------------
Adds:
- Companies
- Job titles
- Hiring logic based on stats
- Promotions/firings
- Salaries
- Career history
- Player career choices
(Equivalent to “teams and rosters” in BBGM)

OPTION B — EDUCATION SYSTEM (SCHOOLS & UNIVERSITIES)
------------------------------------------------------
Adds:
- Schools/universities
- Admissions logic based on stats/prestige
- Graduation events
- Student → employee transitions
- Alumni networks
- Player education path

OPTION C — RELATIONSHIPS & FAMILIES
-------------------------------------
Adds:
- Parents, siblings, marriages
- Friendships, social circles
- Children from two parents
- Family trees
- NPC marriages/divorces
- Player dating/marriage/kids

OPTION D — GOVERNMENTS & ELECTIONS
-----------------------------------
Adds:
- Political institutions
- Roles like President, Minister, Mayor
- Election cycles every N years
- Candidates chosen by charisma/leadership
- Prestige modifiers
- Player can run for office

OPTION E — PLAYER STRATEGY SETTINGS (BBGM-STYLE)
--------------------------------------------------
Adds:
- Player “activity sliders”
  • Study
  • Train
  • Network
  • Job search
  • Campaigning
- Player stat growth influenced by strategy
- Passive decisions (no pop-ups) like BBGM

OPTION F — UI EXPANSION & WORLD BROWSER
----------------------------------------
Adds:
- Country pages
- People directory with filters
- Search (age range, stat range, country)
- Institution pages (schools, companies)
- BBGM-style history:
  • Past presidents
  • Alumni lists
  • Player career log

This makes the world explorable.


==================================================
NEXT STEP
==================================================

Choose one next major feature from A–F and it will be added cleanly and step-by-step.
