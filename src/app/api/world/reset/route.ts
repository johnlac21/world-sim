import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Person } from '@prisma/client';
import {
  generateBaseStats,
  computeOverallRating,
  generatePotentialOverall,
  generateDevelopmentStyle,
  generatePeakAge,
} from '@/lib/stats';
import { generatePersonalityFromStats } from '@/lib/personality';

// ----- CONFIG / HELPERS -----

const COUNTRY_NAMES = ['Alboria', 'Zentara', 'Kirell', 'Thessis', 'Vandria'];

const COMPANY_NAMES = [
  'Global Dynamics',
  'Blue River Analytics',
  'Northwind Logistics',
  'Aurora Media',
  'Pioneer Foods',
  'Silverline Bank',
  'Vertex Technologies',
  'Crescent Health',
];

const JOB_TITLES = [
  'Intern',
  'Junior Analyst',
  'Analyst',
  'Senior Analyst',
  'Manager',
  'Director',
  'VP',
];

const SCHOOL_LEVELS = ['Primary', 'Secondary', 'University'] as const;

// Local industry type for reset seeding.
// Kept as a TS union, not a Prisma enum, so the DB column stays flexible.
type IndustryType = 'TECH' | 'FINANCE' | 'RESEARCH';

const INDUSTRIES: IndustryType[] = ['TECH', 'FINANCE', 'RESEARCH'];

// Base hierarchy of roles per industry (global templates).
const BASE_INDUSTRY_ROLES: { name: string; rank: number }[] = [
  { name: 'President', rank: 0 },
  { name: 'Vice President', rank: 1 },
  { name: 'Senior Manager', rank: 2 },
  { name: 'Manager', rank: 3 },
  { name: 'Associate Manager', rank: 4 },
  { name: 'Lead Analyst', rank: 5 },
  { name: 'Analyst', rank: 6 },
  { name: 'Junior Analyst', rank: 7 },
  { name: 'Trainee', rank: 8 },
  { name: 'Worker', rank: 9 },
];

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomName() {
  const FIRST = ['Lena', 'Kai', 'Mara', 'Jace', 'Noa', 'Theo', 'Iris', 'Ravi'];
  const LAST = ['Halden', 'Kerr', 'Novak', 'Saeed', 'Kato', 'Silva', 'Ibrahim'];

  const first = FIRST[randInt(0, FIRST.length - 1)];
  const last = LAST[randInt(0, LAST.length - 1)];
  return `${first} ${last}`;
}

// Salary based on some mental/social stats
function computeBaseSalary(
  person: Pick<Person, 'intelligence' | 'discipline' | 'charisma'>,
): number {
  const skill = (person.intelligence + person.discipline + person.charisma) / 3; // ~20–80
  return Math.round(25000 + (skill - 20) * (125000 / 60));
}

// ===== ROLE SCORE HELPERS (Positions v1 seeding) =====

// Exec: President / VP (ranks 0–1)
function execScore(p: Person): number {
  return (
    0.35 * p.leadership +
    0.20 * p.judgment +
    0.15 * p.charisma +
    0.15 * p.communication +
    0.10 * p.discipline +
    0.05 * p.confidence
  );
}

// Manager: Senior Manager / Manager / Associate Manager (ranks 2–4)
function managerScore(p: Person): number {
  return (
    0.30 * p.leadership +
    0.20 * p.discipline +
    0.15 * p.communication +
    0.15 * p.judgment +
    0.10 * p.empathy +
    0.10 * p.negotiation
  );
}

// Contributor / worker: Lead Analyst → Worker (ranks 5–9)
function contributorScore(p: Person): number {
  return (
    0.30 * p.intelligence +
    0.20 * p.discipline +
    0.15 * p.adaptability +
    0.10 * p.memory +
    0.10 * p.creativity +
    0.15 * p.stability
  );
}

function computeRoleScore(p: Person, roleRank: number): number {
  if (roleRank <= 1) {
    return execScore(p);
  }
  if (roleRank <= 4) {
    return managerScore(p);
  }
  return contributorScore(p);
}

// ----- MAIN RESET HANDLER -----

export async function POST() {
  try {
    // wipe old data in dependency-safe order
    await prisma.friendship?.deleteMany?.().catch(() => {});
    await prisma.marriage.deleteMany();
    await prisma.enrollment.deleteMany();
    await prisma.employment.deleteMany();
    await prisma.companyPosition.deleteMany();
    await prisma.term.deleteMany();
    await prisma.school.deleteMany();
    await prisma.company.deleteMany();
    await prisma.office.deleteMany();
    await prisma.person.deleteMany();
    await prisma.country.deleteMany();
    await prisma.world.deleteMany();
    await prisma.industryRole.deleteMany();

    // ----- WORLD -----
    const world = await prisma.world.create({
      data: {
        name: 'SimWorld 1',
        currentYear: 0,
      },
    });

    // ----- COUNTRIES -----
    const countries = await Promise.all(
      COUNTRY_NAMES.map((name) =>
        prisma.country.create({
          data: {
            name,
            worldId: world.id,
          },
        }),
      ),
    );

    const controlled = countries[0];

    await prisma.world.update({
      where: { id: world.id },
      data: { controlledCountryId: controlled.id },
    });

    // ----- INDUSTRY ROLES (GLOBAL HIERARCHY TEMPLATES) -----
    await prisma.industryRole.createMany({
      data: INDUSTRIES.flatMap((industry) =>
        BASE_INDUSTRY_ROLES.map((role) => ({
          industry,
          name: role.name,
          rank: role.rank,
        })),
      ),
    });

    // ----- PEOPLE (NPCs) -----
    const peopleToCreate = 2000;

    const peopleData = Array.from({ length: peopleToCreate }).map(() => {
      const country = countries[randInt(0, countries.length - 1)];
      const birthYear = randInt(-60, 0);
      const age = -birthYear;

      const stats = generateBaseStats();
      const overall = computeOverallRating(stats);
      const devStyle = generateDevelopmentStyle();
      const peakAge = generatePeakAge(devStyle);
      const { archetype, subtype } = generatePersonalityFromStats(stats);

      return {
        worldId: world.id,
        countryId: country.id,
        name: randomName(),
        birthYear,
        age,
        isPlayer: false,

        // potential & development
        potentialOverall: generatePotentialOverall(overall),
        peakAge,
        developmentStyle: devStyle,

        // personality
        personalityArchetype: archetype,
        personalitySubtype: subtype.label,

        // stats
        ...stats,
      };
    });

    await prisma.person.createMany({ data: peopleData });

    // ----- PLAYER CHARACTER -----
    const playerStats = generateBaseStats();
    const playerOverall = computeOverallRating(playerStats);
    const playerDevStyle = generateDevelopmentStyle();
    const playerPeakAge = generatePeakAge(playerDevStyle);
    const { archetype: playerArchetype, subtype: playerSubtype } =
      generatePersonalityFromStats(playerStats);

    const player = await prisma.person.create({
      data: {
        worldId: world.id,
        countryId: countries[0].id,
        name: 'Player One',
        birthYear: 0,
        age: 0,
        isPlayer: true,

        potentialOverall: generatePotentialOverall(playerOverall),
        peakAge: playerPeakAge,
        developmentStyle: playerDevStyle,

        personalityArchetype: playerArchetype,
        personalitySubtype: playerSubtype.label,

        ...playerStats,
      },
    });

    // re-load all people (so we have IDs for jobs/education)
    const allPeople = await prisma.person.findMany({
      where: { worldId: world.id },
    });

    // ----- SCHOOLS -----
    const schools = await prisma.$transaction(
      countries.flatMap((country) => {
        const arr: Promise<any>[] = [];
        for (const level of SCHOOL_LEVELS) {
          const numSchools = level === 'University' ? 1 : 2; // each country: 2 primary, 2 secondary, 1 uni
          for (let i = 0; i < numSchools; i++) {
            arr.push(
              prisma.school.create({
                data: {
                  name: `${country.name} ${level} ${i + 1}`,
                  level,
                  prestige: randInt(40, 95),
                  countryId: country.id,
                  worldId: world.id,
                },
              }),
            );
          }
        }
        return arr;
      }),
    );

    const schoolsByCountryLevel = new Map<
      string,
      (typeof schools)[number][]
    >();

    for (const s of schools) {
      const key = `${s.countryId}-${s.level}`;
      const arr = schoolsByCountryLevel.get(key) || [];
      arr.push(s);
      schoolsByCountryLevel.set(key, arr);
    }

    // ----- COMPANIES -----
    const companies = await prisma.$transaction(
      countries.flatMap((country) => {
        const numCompanies = 3 + Math.floor(Math.random() * 4); // 3–6 per country
        const arr: Promise<any>[] = [];
        for (let i = 0; i < numCompanies; i++) {
          // rotate industries for a roughly even spread per country
          const industry: IndustryType = INDUSTRIES[i % INDUSTRIES.length];

          arr.push(
            prisma.company.create({
              data: {
                name: `${pickRandom(COMPANY_NAMES)} ${
                  country.name.split(' ')[0]
                } ${i + 1}`,
                countryId: country.id,
                worldId: world.id,
                industry,
              },
            }),
          );
        }
        return arr;
      }),
    );

    const companiesByCountry = new Map<
      number,
      (typeof companies)[number][]
    >();
    for (const country of countries) {
      companiesByCountry.set(
        country.id,
        companies.filter((c) => c.countryId === country.id),
      );
    }

    // ----- OFFICES (WORLD + COUNTRY LEADERS) -----
    await prisma.office.create({
      data: {
        name: 'World President',
        level: 'World',
        termLength: 4,
        prestige: 90,
        worldId: world.id,
        countryId: null,
      },
    });

    await prisma.$transaction(
      countries.map((country) =>
        prisma.office.create({
          data: {
            name: `President of ${country.name}`,
            level: 'Country',
            termLength: 4,
            prestige: 70,
            worldId: world.id,
            countryId: country.id,
          },
        }),
      ),
    );

    // ----- INITIAL JOBS + ENROLLMENTS -----
    const employmentCreates: any[] = [];
    const enrollmentCreates: any[] = [];
    const companyPositionCreates: any[] = [];

    // Track employees per company to assign hierarchy positions later
    const employeesByCompany = new Map<number, Person[]>();

    for (const person of allPeople) {
      const isPlayerPerson = person.id === player.id;
      const age = person.age;

      // === education ===
      let level: string | null = null;
      if (age >= 6 && age <= 11) level = 'Primary';
      else if (age >= 12 && age <= 17) level = 'Secondary';
      else if (age >= 18 && age <= 22) {
        const academic = (person.intelligence + person.discipline) / 2;
        const uniChance = 0.2 + (academic - 20) * (0.4 / 60); // ~20–60%ish
        if (Math.random() < Math.max(0, Math.min(0.6, uniChance))) {
          level = 'University';
        }
      }

      if (level && person.countryId) {
        const key = `${person.countryId}-${level}`;
        const candidateSchools = schoolsByCountryLevel.get(key);
        if (candidateSchools && candidateSchools.length > 0) {
          const school = pickRandom(candidateSchools);
          const yearsSoFar = randInt(0, 3);
          const startYear = world.currentYear - yearsSoFar; // may be <= 0

          enrollmentCreates.push(
            prisma.enrollment.create({
              data: {
                personId: person.id,
                schoolId: school.id,
                startYear,
              },
            }),
          );
        }
      }

      // === jobs ===
      const workingAge = age >= 18 && age <= 65;
      const countryCompanies =
        (person.countryId && companiesByCountry.get(person.countryId)) ||
        companies;

      if (!countryCompanies || countryCompanies.length === 0) continue;

      // Player always gets a job; NPCs ~60% if working age
      if (!isPlayerPerson) {
        if (!workingAge) continue;
        if (Math.random() > 0.6) continue;
      }

      const company = pickRandom(countryCompanies);
      const title = isPlayerPerson ? 'Player Character' : pickRandom(JOB_TITLES);
      const salary = computeBaseSalary(person);

      employmentCreates.push(
        prisma.employment.create({
          data: {
            personId: person.id,
            companyId: company.id,
            title,
            salary,
            startYear: world.currentYear,
          },
        }),
      );

      // Track this person as an employee of the company
      const list = employeesByCompany.get(company.id) || [];
      list.push(person);
      employeesByCompany.set(company.id, list);
    }

    // ----- COMPANY POSITIONS (INITIAL HIERARCHY SNAPSHOT) -----
    // This seeds the hierarchy given current employees; yearly sim will
    // maintain and refill it using promotion + hiring logic.
    const allIndustryRoles = await prisma.industryRole.findMany();

    for (const company of companies) {
      const employees = [...(employeesByCompany.get(company.id) || [])];
      if (employees.length === 0) continue;

      const rolesForIndustry = allIndustryRoles
        .filter((r) => r.industry === company.industry)
        .sort((a, b) => a.rank - b.rank); // top of hierarchy first

      const availableEmployees = [...employees];

      for (const role of rolesForIndustry) {
        if (availableEmployees.length === 0) break;

        // Pick best candidate for this role based on roleRank-specific score.
        let bestIdx = 0;
        let bestScore = -Infinity;

        for (let i = 0; i < availableEmployees.length; i++) {
          const candidate = availableEmployees[i];
          const score = computeRoleScore(candidate, role.rank);
          if (score > bestScore) {
            bestScore = score;
            bestIdx = i;
          }
        }

        const [chosen] = availableEmployees.splice(bestIdx, 1);
        if (!chosen) continue;

        companyPositionCreates.push(
          prisma.companyPosition.create({
            data: {
              companyId: company.id,
              personId: chosen.id,
              roleId: role.id,
              startYear: world.currentYear,
              endYear: null,
            },
          }),
        );
      }
    }

    await prisma.$transaction([
      ...enrollmentCreates,
      ...employmentCreates,
      ...companyPositionCreates,
    ]);

    return NextResponse.json({
      ok: true,
      worldId: world.id,
      countries: countries.length,
      people: peopleToCreate + 1,
      companies: companies.length,
      schools: schools.length,
      jobs: employmentCreates.length,
      enrollments: enrollmentCreates.length,
      positions: companyPositionCreates.length,
    });
  } catch (err) {
    console.error('Reset world failed:', err);
    return NextResponse.json(
      { error: 'Reset world failed', details: String(err) },
      { status: 500 },
    );
  }
}
