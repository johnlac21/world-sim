# World Sim — Generational World Simulation

World Sim is a fully dynamic, generational world simulation game built with Next.js, Prisma, and SQLite. Each new world contains countries, thousands of people, schools, companies, political offices, family structures, and a simulation engine that evolves the world year by year. The player controls one country, guiding it through demographic shifts, employment trends, education outcomes, political leadership cycles, and long-term national development. Every person in the world has a full stat profile, personality traits, relationships, jobs, and life events that shape the history of the world.

## Key Features

### Living World
Procedurally generated world with multiple countries and thousands of unique people. Each citizen has 24 core stats (cognitive, social, physical, personality), a personality archetype/subtype, potential and peak age, development style, education background, job history, marriages, friendships, and more. The yearly simulation processes aging, births, deaths, stat growth, education progression, job markets, promotions, retirements, and political leadership changes.

### Country Management
You play as a country, not as a single person. Your country tracks population, employment, institutions, schools, companies, presidential offices, and national metrics. Future updates will introduce policy decisions, elections, budgeting, economic levers, and long-term strategic choices.

### Deep Character Simulation
Citizens develop over time through a combination of stat-based growth, personality tendencies, potential ceilings, and peak ages. Over many years, the world naturally forms elites, influential figures, political dynasties, family lines, and demographic patterns. No scripting — all emergent behavior.

### Modern Web Stack
Next.js App Router (React client components), SQLite + Prisma ORM, and serverless API routes power a clean architecture. The simulation logic lives in src/lib/sim.ts, the reseed/reset logic in src/app/api/world/reset, and all UI in src/app.

## Project Structure

src/app — All UI pages (World, Player Country Dashboard, Country, Person, Leaders, Office)  
src/app/api — API routes (world, sim, countries, people, offices)  
src/lib/sim.ts — Simulation engine  
src/lib/stats.ts — Stat generation + potential/peak age curves  
src/lib/personality.ts — Archetype/subtype assignment  
prisma/schema.prisma — Database models  
scripts/seedWorld.ts — CLI world generator

## How It Works

### Reset World
Creates a new world with 5 countries, ~2000 NPCs, full stat profiles, personalities, potential curves, schools, companies, political offices, education pipelines, job assignments, marriages, friendships, and a designated controlled country.

### Simulate One Year
Aging, births, deaths, education movement, job hiring/promotions/firings, stat development, political office term progression, and personality-driven emergent behaviors.

## Getting Started

npm install  
npx prisma migrate dev  
npm run dev  

Visit:  
/ — World overview  
/player — Controlled country dashboard  
/country/[id] — Country details  
/person/[id] — Person details  
/leaders — World leaders  
/office/[id] — Term history

## Vision

World Sim aims to become a rich, emergent world simulation where societies evolve naturally across decades. Countries develop or stagnate based on demographic forces, education outcomes, employment trends, and the personalities and paths of their citizens. The goal is a deep, systemic game where the story of your country emerges from the complex interactions of thousands of simulated lives.
