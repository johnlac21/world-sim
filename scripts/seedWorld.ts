// scripts/seedWorld.ts
import { PrismaClient, Person } from '@prisma/client';
import {
  generateBaseStats,
  computeOverallRating,
  generatePotentialOverall,
  generateDevelopmentStyle,
  generatePeakAge,
} from '../src/lib/stats';
import { generatePersonalityFromStats } from '../src/lib/personality';

const prisma = new PrismaClient();

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

// Local industry type for seeding companies (Ticket 1 / Industry v0).
// We deliberately keep this as a TypeScript union, not a Prisma enum,
// so the database column remains a flexible STRING.
type IndustryType = 'TECH' | 'FINANCE' | 'RESEARCH';

const INDUSTRIES: IndustryType[] = ['TECH', 'FINANCE', 'RESEARCH'];

// Base hierarchy of roles per industry (Ticket A / hierarchy v0).
// These are global templates; CompanyPosition connects specific people
// to these roles inside specific companies.
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

// Standard cabinet offices per country (same as reset route)
const CABINET_OFFICES = [
  {
    name: 'Minister of Economy',
    level: 'Cabinet',
    termLength: 4,
    prestige: 65,
  },
  {
    name: 'Minister of Education',
    level: 'Cabinet',
    termLength: 4,
    prestige: 60,
  },
  {
    name: 'Minister of Industry',
    level: 'Cabinet',
    termLength: 4,
    prestige: 62,
  },
  {
    name: 'Minister of Health',
    level: 'Cabinet',
    termLength: 4,
    prestige: 58,
  },
  {
    name: 'Minister of Infrastructure',
    level: 'Cabinet',
    termLength: 4,
    prestige: 55,
  },
];


function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
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

// ===== ROLE SCORE HELPERS (Ticket B — Positions v1) =====

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

async function main() {
  // wipe old data in dependency order
  await prisma.friendship.deleteMany();
  await prisma.marriage.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.employment.deleteMany();
  await prisma.companyPosition.deleteMany();
  await prisma.term.deleteMany();

  await prisma.companyYearPerformance.deleteMany();
  await prisma.countryYearPerformance.deleteMany();

  await prisma.school.deleteMany();
  await prisma.company.deleteMany();
  await prisma.office.deleteMany();
  await prisma.person.deleteMany();
  await prisma.country.deleteMany();
  await prisma.world.deleteMany();
  await prisma.industryRole.deleteMany();
  await prisma.playerUniversityDecision.deleteMany();

  const world = await prisma.world.create({
    data: {
      name: 'SimWorld 1',
      currentYear: 0,
    },
  });

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

  // Set which country the user controls
  await prisma.world.update({
    where: { id: world.id },
    data: {
      controlledCountryId: countries[0].id, // pick first country for now
    },
  });

  // ===== INDUSTRY ROLES (HIERARCHY TEMPLATES) =====
  await prisma.industryRole.createMany({
    data: INDUSTRIES.flatMap((industry) =>
      BASE_INDUSTRY_ROLES.map((role) => ({
        industry,
        name: role.name,
        rank: role.rank,
      })),
    ),
  });

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
      developmentStyle: devStyle, // plain string: "EARLY" | "NORMAL" | ...

      // personality
      personalityArchetype: archetype,
      personalitySubtype: subtype.label,

      // spread new stat profile
      ...stats,
    };
  });

  await prisma.person.createMany({ data: peopleData });

  // ===== SCHOOLS (EDUCATION) =====
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

  const schoolsByCountryLevel = new Map<string, (typeof schools)[number][]>();

  for (const s of schools) {
    const key = `${s.countryId}-${s.level}`;
    const arr = schoolsByCountryLevel.get(key) || [];
    arr.push(s);
    schoolsByCountryLevel.set(key, arr);
  }

  // ===== COMPANIES (JOBS) =====
  const companies = await prisma.$transaction(
    countries.flatMap((country) => {
      const numCompanies = 3 + Math.floor(Math.random() * 4); // 3–6 per country
      const arr: Promise<any>[] = [];
      for (let i = 0; i < numCompanies; i++) {
        // Rotate industries for a roughly even spread per country.
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

  // ===== OFFICES (GOVERNMENTS) =====
  // One world-level leader + one president per country
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

  // Cabinet-level offices per country (standardized)
  await prisma.$transaction(
    countries.flatMap((country) =>
      CABINET_OFFICES.map((cfg) =>
        prisma.office.create({
          data: {
            name: `${cfg.name} of ${country.name}`,
            level: cfg.level,
            termLength: cfg.termLength,
            prestige: cfg.prestige,
            worldId: world.id,
            countryId: country.id,
          },
        }),
      ),
    ),
  );


  const companiesByCountry = new Map<number, (typeof companies)[number][]>();
  for (const country of countries) {
    companiesByCountry.set(
      country.id,
      companies.filter((c) => c.countryId === country.id),
    );
  }

  const allPeople = await prisma.person.findMany({
    where: { worldId: world.id },
  });

  const employmentCreates: any[] = [];
  const enrollmentCreates: any[] = [];
  const marriageCreates: any[] = [];
  const friendshipCreates: any[] = [];
  const companyPositionCreates: any[] = [];

  // Track employees per company so we can assign hierarchy roles.
  const employeesByCompany = new Map<number, Person[]>();

  // ===== INITIAL EDUCATION + JOBS =====
  for (const person of allPeople) {
    const isPlayer = person.isPlayer;
    const age = person.age;

    // EDUCATION
    // 6–11: Primary, 12–17: Secondary, 18–22: maybe University
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

    // JOBS
    const workingAge = age >= 18 && age <= 65;
    const countryCompanies =
      (person.countryId && companiesByCountry.get(person.countryId)) ||
      companies;

    if (!countryCompanies || countryCompanies.length === 0) continue;

    // Player always gets a job; NPCs ~60% if working age
    if (!isPlayer) {
      if (!workingAge) continue;
      if (Math.random() > 0.6) continue;
    }

    const company = pickRandom(countryCompanies);
    const title = isPlayer ? 'Player Character' : pickRandom(JOB_TITLES);
    const salary = computeBaseSalary(person);

    // Track for Employment
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

    // Track employees per company for hierarchy assignment
    const list = employeesByCompany.get(company.id) || [];
    list.push(person);
    employeesByCompany.set(company.id, list);
  }

  // ===== INITIAL MARRIAGES =====
  // Pair up adults (20–40) within each country
  const adultsByCountry = new Map<number, (typeof allPeople)[number][]>();

  for (const person of allPeople) {
    if (person.age < 20 || person.age > 40) continue;
    if (!person.countryId) continue;

    const arr = adultsByCountry.get(person.countryId) || [];
    arr.push(person);
    adultsByCountry.set(person.countryId, arr);
  }

  for (const [, adults] of adultsByCountry.entries()) {
    const pool = shuffle(adults);

    for (let i = 0; i + 1 < pool.length; i += 2) {
      const a = pool[i];
      const b = pool[i + 1];

      if (a.id === b.id) continue;

      marriageCreates.push(
        prisma.marriage.create({
          data: {
            personAId: a.id,
            personBId: b.id,
            startYear: world.currentYear,
          },
        }),
      );
    }
  }

  // ===== INITIAL FRIENDSHIPS =====
  const peopleByCountry = new Map<number, (typeof allPeople)[number][]>();
  for (const person of allPeople) {
    if (!person.countryId) continue;
    const arr = peopleByCountry.get(person.countryId) || [];
    arr.push(person);
    peopleByCountry.set(person.countryId, arr);
  }

  const friendshipSet = new Set<string>(); // 'minId-maxId' to avoid duplicates

  for (const [, people] of peopleByCountry.entries()) {
    if (people.length < 2) continue;

    for (const person of people) {
      // each person gets between 2–5 random friends
      const numFriends = randInt(2, 5);

      for (let k = 0; k < numFriends; k++) {
        const other = pickRandom(people);
        if (other.id === person.id) continue;

        const idA = Math.min(person.id, other.id);
        const idB = Math.max(person.id, other.id);
        const key = `${idA}-${idB}`;

        if (friendshipSet.has(key)) continue;
        friendshipSet.add(key);

        friendshipCreates.push(
          prisma.friendship.create({
            data: {
              personAId: idA,
              personBId: idB,
              strength: randInt(30, 90),
            },
          }),
        );
      }
    }
  }

  // ===== COMPANY POSITIONS (INDUSTRY HIERARCHY ASSIGNMENT) =====
  const allIndustryRoles = await prisma.industryRole.findMany();

  for (const company of companies) {
    const employees = [...(employeesByCompany.get(company.id) || [])];
    if (employees.length === 0) continue;

    const rolesForIndustry = allIndustryRoles
      .filter((r) => r.industry === company.industry)
      .sort((a, b) => a.rank - b.rank); // top of hierarchy first

    // We'll fill roles from President downward until we run out of employees.
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
    ...marriageCreates,
    ...friendshipCreates,
    ...companyPositionCreates,
  ]);

  console.log(
    `Seeded world ${world.id} with ${countries.length} countries, ${peopleToCreate} people, ${companies.length} companies, ${schools.length} schools, ${employmentCreates.length} jobs, ${enrollmentCreates.length} enrollments, ${marriageCreates.length} marriages, ${friendshipCreates.length} friendships, ${companyPositionCreates.length} company positions.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
