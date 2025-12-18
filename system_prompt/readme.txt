WORLD SIM BBGM — README (TXT VERSION)
1. Overview
World Sim BBGM is a browser-based generational management sim inspired by Basketball GM (BBGM), but applied to a living world of people, countries, industries, and governments.
Instead of managing a single character or team, you manage one country (the country referenced by World.controlledCountryId). Your job is to:


Shape long-term talent pipelines in industry and government


Assign people to structured roles inside companies and offices


Watch careers and institutions evolve over decades


Compete with other countries in a yearly “season” driven by:


Industry output (company performance)


Government performance (quality of leadership and cabinet)


Future: population well-being and demographics




Each simulated year produces new company scores, country scores, standings, and champions. Over time, this builds eras, dynasties, and collapse stories—BBGM, but for countries.
The project is built with Next.js (App Router), Prisma, and SQLite.

2. Current Prototype: What Exists Today
At a high level the prototype includes:


A seeded world (1 world, 5 countries, ~2,000 people, schools, companies, government offices)


A yearly simulation loop with births, deaths, aging, education, jobs, and government terms


Structured industry hierarchies (IndustryRole + CompanyPosition)


A v1 performance system (CompanyYearPerformance + CountryYearPerformance)


A complete browser UI for exploring people, countries, companies, offices, and standings


Player controls for:


Manually appointing cabinet members (player-locked terms)


Manually editing company hierarchies for controlled-country companies (depth-chart style)


Globally searching and scouting people


Viewing a dedicated Youth Pipeline of teenage / early-20s prospects in the controlled country





3. Core Systems
3.1 Generational Simulation
The core loop is one year at a time:


People age; death probability increases with age.


Adults can have children; children inherit tendencies from parents plus noise.


Education is modeled as Enrollment rows in School (Primary, Secondary, University).


Jobs are modeled as Employment rows; people are hired, promoted, fired, and retire.


Government offices (Office) are filled via elections unless overridden by the player.


Industry hierarchies (IndustryRole + CompanyPosition) are maintained with promotions and hiring.


Company and country performance tables are recomputed every year.


The simulation is orchestrated in src/lib/sim.ts.
3.2 Industry Hierarchy (IndustryRole + CompanyPosition)
Each Company has an industry: string (e.g. "TECH", "FINANCE", "RESEARCH").


IndustryRole defines a ladder of roles per industry (e.g., President, VP, Manager, Analyst, Worker) with a rank (0 = top).


CompanyPosition links a company, a role, and a person, plus:


startYear, endYear?


locked: Boolean




Semantics:


Every company has a structured ladder of roles determined by its industry’s roles.


CompanyPosition is the canonical “slot”: who is in which role at which company.


Each sim year:


Cleans up invalid positions (death, job loss, industry mismatch, etc.)


Promotes people from lower roles into vacancies using role-specific scoring


Hires unemployed people into low-tier roles


Deduplicates conflicting slots for the same (companyId, roleId), preferring locked slots




Locked slots (locked = true) are player-pinned positions:


The sim will not use them as promotion sources.


Validation prefers to keep locked occupants when conflicts occur.


They are surfaced and editable for companies in the controlled country via the /company/[id] “Manage hierarchy” UI.


3.3 Government Hierarchy (Office + Term)
Government is modeled via:


Office: world- or country-level positions (World President, President of <Country>, ministers) with:


level (e.g. "World", "Country", "Cabinet")


termLength (years)


prestige (1–100)


worldId, optional countryId




Term: a record of a person holding an office:


officeId, personId


startYear, endYear?


playerLocked: Boolean




Semantics:


Each office can have at most one active term (endYear = null).


Each year, for each office:


If there is no active term, or the active term has reached its termLength and is not playerLocked, an election is run.


Elections choose a candidate pool based on age, country, and prestige, and select winners using weights on charisma, leadership, and existing prestige.


Winners gain prestige; new auto-elected Terms have playerLocked = false.




Player overrides:


On /player, each office row has a Reassign button.


Reassigning:


Calls /api/player/offices/[officeId]/candidates to get eligible candidates.


Lets the player appoint a new holder via /api/player/offices/[officeId]/appoint.


The new Term is created with playerLocked = true.




playerLocked terms are respected by the yearly election logic until they become invalid (death, country change, etc.).
3.4 Performance System
To make the game feel like BBGM, performance is explicit and deterministic.
CompanyYearPerformance
CompanyYearPerformance stores per-company, per-year performance:


worldId, companyId, year


talentScore, leadershipScore, reliabilityScore, outputScore


Each year:


The sim reads the company’s CompanyPosition rows and occupant stats.


Role-specific weights and rank multipliers produce:


Talent, leadership, reliability scores


A composite outputScore




Used by:


/company/[id] performance panels and history


/world/[id]/top-companies


Country aggregation into CountryYearPerformance


CountryYearPerformance
CountryYearPerformance stores per-country, per-year performance:


worldId, countryId, year


companyScore, governmentScore, populationScore


totalScore, isChampion


Components:


companyScore: sum of outputScore for all companies in that country for that year.


governmentScore (v1):


Considers all country-level offices for that country.


For each office with an active term:


Compute a 0–100 “leader rating” from leadership, judgment, integrity, charisma.


Weight by office prestige.




Normalize to a final 0–100 government score.




populationScore: currently a placeholder (0), reserved for future demographic systems.


totalScore: companyScore + GOVERNMENT_SCORE_WEIGHT * governmentScore + populationScore.


isChampion: true for the best country in that world/year.


All standings, country pages, and many snippets pull from these tables, so everything stays in sync.

4. Player Experience & UI
The player identity is the country, not a person. The country is World.controlledCountryId. The /player page is your country dashboard, analogous to a team page in BBGM.
The frontend uses Next.js App Router under src/app/* with React client components.
4.1 Key Pages
/ — World Overview


Shows world name, current year, counts of countries / people / companies / schools, and basic employment numbers.


Controls:


Reset World (POST /api/world/reset)


Sim 1 Year (POST /api/sim/year)




/player — Controlled Country Dashboard
Backed by /api/player-country.
Shows:


Country and world name


Population, number of companies and schools, employed vs unemployed


Talent & Scouting panel


Explains the global scouting system.


Contains an “Open Talent Search” button.


Opens TalentSearchModal, powered by /api/people/search and scoped by worldId / countryId.


Lets the player filter people by age, employment status, stats, and industry experience.


Shows inline stat summaries and fit badges (Exec / Manager / Worker).


Currently, selecting a candidate opens their /person/[id] page in a new tab.


Youth Pipeline link


A “Youth pipeline” link/button that leads to /player/youth.


This is the dedicated prospects view for teenage and early-20s talent in the controlled country.


Government card


Shows top country-level offices ordered by prestige.


For each office:


Office name (link to /office/[id])


Current holder (link to /person/[id] or “Vacant”)


Fit score (0–100, same metrics used in governmentScore)


Term remaining in years




Reassign button:


Opens a modal backed by /api/player/offices/[officeId]/candidates.


Shows candidate name, age, fit score, current office, and current holder flag.


Appointing uses /api/player/offices/[officeId]/appoint to create a new playerLocked term.




Country performance panel


Uses getCountryPerformanceSummary and CountryYearPerformance.


Shows current year performance:


Total output


Number of companies with performance


Average output per company


Per-industry breakdown


Top companies




Links to /country/[id]/industry and /world/[id]/standings.


/player/youth — Youth Pipeline
Backed by /api/player/youth.
Shows:


A table of youth prospects from the controlled country (e.g. ages ~15–23).


For each prospect:


Name (link to /person/[id])


Age


potentialOverall


Current education label (Primary / Secondary / University / Out of school / Not in school)


A computed prospect grade (e.g. “A (92/100)”).




Data:


/api/player/youth filters Person by world, controlled country, alive status, and youth age band.


Joins active Enrollment + School to derive an education label.


Uses a helper to compute a 0–100 prospect score and letter grade from potential and key stats.


Results are sorted by potential desc, then prospect score desc, then age asc.


This is the concrete “youth pool / talent pipeline” view for the country.
/country/[id] — Country Page
Backed by /api/country/[id].
Shows:


Country metadata and world name.


Offices and term history (president + cabinet).


Current-year performance (total output, average, per-industry breakdown, top companies).


A history section using CountryYearPerformance (several years of totalScore, rank, and champion markers).


/country/[id]/industry — Country Industry Dashboard
Backed by /api/country/[id]/industry.


For each industry (TECH, FINANCE, RESEARCH):


Lists companies in that country.


Shows the full hierarchy ladder (IndustryRole ordered by rank), with occupant names or “Vacant”.




/company/[id] — Company Page
Backed by /api/company/[id]/hierarchy.
Layout:


Header: company name, industry, country.


Main column:


Current performance: year, outputScore, talentScore, leadershipScore, reliabilityScore.


Industry benchmark: company output vs industry average, rank in industry, company count.


Industry peers: ranking of all companies in the same industry + world for that year, with the current company highlighted.


Performance history: bar chart or list of outputScores from recent years.


Right sidebar: Hierarchy ladder


Shows roles (IndustryRole) ordered by rank, with current occupant and key stats, or “Vacant”.


For companies in the controlled country:


An Edit toggle switches the sidebar into “Manage lineup / hierarchy” mode.


Each role row:


Loads candidates via /api/player/companies/[companyId]/positions/[roleId]/candidates.


Provides a select box to assign a different employee or set the slot to Vacant.


Provides a lock control to toggle CompanyPosition.locked via /api/player/companies/[companyId]/positions/[roleId]/assign.






This is the BBGM-style depth chart for companies.
/world/[id]/standings — Standings
Backed by /api/world/[id]/standings and /api/world/[id]/top-companies.
Shows, for the world’s current year:


Standings table:


Rank, country, totalScore


Component scores (companyScore, governmentScore, populationScore)


Trend vs last year (up/down/same)




Per-industry totals and averages per country.


Global industry summary (best country per industry, world totals).


Top companies list (name, country, industry, outputScore).


/person/[id], /leaders, /office/[id]


/person/[id]: full stat profile, personality, education history, employment history, family links, friendships, and any offices held.


/leaders: quick view of world leader and country presidents/cabinet roles.


/office/[id]: office metadata, level, term length, prestige, and term history (who held it when, whether a term was playerLocked).



5. Backend & Data Model
Backend: Next.js route handlers in src/app/api/*.
Database: Prisma + SQLite, schema in prisma/schema.prisma.
Key models (conceptually):


World: id, name, currentYear, controlledCountryId; relations to countries, people, companies, schools, offices, performance rows.


Country: belongs to a world; has people, companies, schools, offices, and CountryYearPerformance rows.


Person: demographics, 24 stats, personality traits, potential (potentialOverall, peakAge, developmentStyle), prestige, links to employments, enrollments, friendships, marriages, company positions, and terms.


Company: name, industry, worldId, countryId; relations to employments, company positions, and CompanyYearPerformance.


School + Enrollment: education institutions and enrollment history.


Employment: job history (title, salary, start/endYear).


Marriage + Friendship: social relationships.


Office + Term: government structure and office history, including playerLocked terms.


IndustryRole + CompanyPosition: industry ladders and company role assignments (with locked).


CompanyYearPerformance: yearly company scores.


CountryYearPerformance: yearly country scores, champions, and trends.



6. World Reset, Simulation, and Local Run
6.1 Reset & Seeding
Implemented in:


scripts/seedWorld.ts (CLI)


/api/world/reset (HTTP route)


Reset does the following:


Clears data in dependency order (social → education/jobs → hierarchy → performance → offices/companies/schools/people/countries/worlds/industry roles).


Creates a new world (currentYear = 0) with a controlled country.


Creates five countries.


Seeds ~2,000 people with age, stats, potential, and personality.


Seeds schools per country (primary, secondary, university).


Seeds companies (3–6 per country) with industries cycling among TECH/FINANCE/RESEARCH.


Seeds industry roles (rank 0–9 per industry).


Seeds initial employment and CompanyPosition ladders.


Seeds world and country offices (world president, presidents, and cabinet).


Terms created at seed time are not playerLocked; elections will populate and replace them.
6.2 Yearly Simulation
POST /api/sim/year → tickYear in src/lib/sim.ts.
Each year:


Increment World.currentYear.


Update people (aging, death, births, stat development).


Process education enrollments and graduations.


Process jobs (hiring, promotion, firing, retirement).


Maintain government offices (expire terms, run elections, respect playerLocked).


Maintain industry hierarchies (clean, promote, hire, deduplicate, respect locked).


Compute CompanyYearPerformance rows.


Compute CountryYearPerformance rows and mark champions.


6.3 Local Development
Prereqs: Node LTS, npm.


Install dependencies
npm install



Apply Prisma migrations
npx prisma migrate dev



Run the dev server
npm run dev



Visit http://localhost:3000 and smoke-test:


/ — Reset world, simulate a few years.


/player — Confirm stats, Government card, Talent & Scouting panel, Youth pipeline link.


/player/youth — Confirm youth prospects are listed.


/country/1, /country/1/industry — Check country and industry dashboards.


/company/1 — Check hierarchy sidebar, edit + lock behavior for controlled-country companies.


/world/1/standings — Check standings, per-industry totals, and top companies.


/person/[id] — Check person pages.




Optional:
npx prisma studio

to inspect CompanyPosition, CompanyYearPerformance, CountryYearPerformance, Term.playerLocked, etc.

7. Design Vision
Keep this mental model:

Stats → Roles → Company performance → Country performance → Standings → Champions & history.



The player is the country, not a person.


IndustryRole, CompanyPosition, CompanyYearPerformance, and CountryYearPerformance form the backbone.


Government (Office, Term, governmentScore) is a second, strongly scored layer, with player overrides via playerLocked terms.


The Youth Pipeline and Talent & Scouting systems are the lenses that turn a noisy population into a manageable pipeline of future leaders and executives.


Locked terms and locked positions are the “don’t let the AI change this” tools, mirroring BBGM.


As you extend the project, aim to:


Keep the architecture stable (Next.js App Router, sim logic in sim.ts, aggregation in performance.ts, Prisma schema as the single source of truth).


Reuse existing entities rather than inventing unrelated systems.


Respect that gameplay is country-centric, even when you’re looking at individuals.


Move toward richer BBGM-style features: awards, dynasties, hall of fame, prestige curves, deeper—but still structured—decision-making in industry and government.


If you stick to that, you can safely add features without breaking the simulation or drifting into a different type of game.

Recent Additions:

- Education impact modeling v1:
  School enrollments now influence stat development each simulation year.
  Primary and Secondary levels boost cognitive + discipline stats; University boosts cognitive + social stats.
  All effects scale with school prestige, allowing two equally talented youths to diverge based on educational quality.

- Player-controlled university admissions: On the Youth Pipeline page, players can now select which eligible 18-year-olds receive university slots for the upcoming year, overriding the automatic enrollment logic for the controlled country. Includes eligibility hints, admission caps based on university count, persistent selections, and “New this year” enrollment feedback after simulation.

- Introduced PersonYearPerformance, a per-person yearly contribution model populated during each simulation tick. For every occupied CompanyPosition, the sim now stores talentScore, leadershipScore, reliabilityScore, industry, and a combined contributionScore. This enables future leaderboards, awards, and career pages without recomputing stats on the fly.

UI Layout Shell (Ticket 24)

A full BBGM-style global UI shell is now implemented across the entire app.
This includes:

A persistent top navigation bar (world name, year, Sim 1 Year, Reset World, My Country, search).

A left sidebar navigation with WORLD, COUNTRY, PEOPLE, and COMPANIES sections.

A centralized page wrapper with BBGM-style dense, data-first layout.

Integration through a new GameLayout component, now wrapping all pages via RootLayout.

Updated globals.css to follow the UI Vision palette (#f2f2f2 background, compact spacing).

This establishes a consistent UI frame for all future page upgrades.


Player Dashboard UI v2 (Ticket 24)

The /player page now uses the three-column BBGM dashboard layout defined in the UI Vision document.
New features include:

Left column: Mini-standings widget + Your Standing summary.

Center column: Country Overview panels, yearly performance breakdown, and a Youth Pipeline quick view.

Right column: Government summary (via GovernmentCard) and dynamic Headlines (champion, rank, cabinet strength, top prospect).

Integrated TalentSearchModal with top-bar access.

This page is now the main “team dashboard” equivalent for the controlled country.

- First-pass UI refactor for core views:
  - New world overview layout with left-hand navigation, top world/year header, and primary actions (Sim 1 Year, Reset World, My Country).
  - Refreshed person page with grouped attribute blocks (Cognitive, Social/Influence, Physical, Personality), plus clearer sections for career, education, and relationships.
  - Country Industry Structure page with industry tabs (Tech/Finance/Research), an aggregate output summary, and per-company cards that surface hierarchy slots and v0 performance scores.
  - Youth Pipeline player view with sortable table of prospects, university eligibility flags, and a “Save admissions” workflow that posts selected 18-year-olds back to the server.
  - Global Leaders and Office pages now show cleaner summaries and link through to office history and individual person profiles.
  - Company hierarchy sidebar component that shows the full ladder from President down to Worker, including key stats for each person.
- Talent Search modal for scouting people across the world by age, stats, employment status, and industry experience, with pagination and optional “Select” callbacks for future assignment flows.

Company Page UI v2 (Ticket 25)

The /company/[id] page has been rebuilt into a BBGM-style two-column layout. The main column focuses on performance (current-year panel, benchmark, peers, and a mini history chart), while the sidebar becomes a sticky “depth chart” editor for the company hierarchy.
Key improvements include:
- Current-year performance panel with talent/leadership/reliability breakdown on top of outputScore.
- Industry benchmark and peers table driven by CompanyYearPerformance, highlighting the current company.
- Compact performance history bar chart across recent seasons.
- A company hierarchy sidebar using DepthChartRow, with edit mode, lock icons, and integrated TalentSearchModal for controlled-country companies.

Standings Page UI v2 (Ticket 26)

The /world/[id]/standings page has been upgraded to a wide, BBGM-style league table. Countries are now clearly ranked by CountryYearPerformance, with movement vs. last year surfaced via compact trend icons and recent-season history.
Key improvements include:
- Redesigned league table with dense, readable columns for rank, country, totalScore, last year rank, trend, and recent seasons.
- Trend arrows (+1 / –1 / same / new) derived from multi-year CountryYearPerformance.
- Visual highlighting of the player-controlled country’s row.
- Integrated Top Companies section on the same page so users can see how elite companies relate to the current standings.

Person Page UI v2 (Ticket 27)

The /person/[id] page now behaves like a BBGM “player card” for people in the world. A two-column layout separates core stats and performance from quick facts and career history, tying in the new PersonYearPerformance data.
Key improvements include:
- A 24-attribute grid grouped into Cognitive, Social/Influence, Physical, and Personality categories using StatPill.
- A PersonYearPerformance mini bar chart showing contributionScore by year, plus peak season and industry summary.
- Structured employment and education history tables with current and past entries clearly separated.
- New role and office history sections (company hierarchy roles and political terms), alongside a cleaned-up relationships panel.

BBGM-Style UI Conversion (World Overview + Layout Update)

Date: UI Sprint – BBGM Sheet Layout Adoption

Converted / (world overview) to a BBGM-style single-sheet dashboard

Removed panel/card layouts

Adopted flat sections, dense tables, and compact typography

Introduced a 3-column structure: mini standings, snapshot/top companies, headlines

Updated global GameLayout to use a centered white content sheet with border-x

Sidebar and top navigation remain, but spacing and font sizes now match BBGM density

Added compact mode + sizing options to SectionHeader (size, compact)

Updated tables to use a flat, dense BBGM look on the world overview page

UI Vision Document revised to reflect new panel-minimalist, table-first, single-sheet design language

### BBGM-Style Homepage UI Overhaul (Dec 2025)

- Implemented a BBGM-inspired homepage layout with a 3-column grid (standings, world snapshot, stats, headlines).
- Added zebra-striped tables, gray header bars, hover states, and score formatting for a more authentic BBGM visual identity.
- Added safe numeric formatting via `formatScore()` to prevent NaN values from breaking the UI.
- Introduced `CountryCrest` UI component (pastel circular badge with country initials) for use in standings and leaderboards.
- Updated mini standings to use new BBGM-style table structure and crest icons.
- Began structuring the future Shared UI Component Library (e.g., DataTable, SectionHeader, CountryCrest).
- Improved robustness of data parsing with `getStandingsCountriesFromAny()` helper.
- Fixed multiple runtime errors caused by optional fields (`companyScore`, `governmentScore`, etc.) and missing company count keys.
