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

// Local industry type for reset seeding (Ticket 1).
// Kept as a TS union, not a Prisma enum, so the DB column stays flexible.
type IndustryType = 'TECH' | 'FINANCE' | 'RESEARCH';

const INDUSTRIES: IndustryType[] = ['TECH', 'FINANCE', 'RESEARCH'];

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

// ----- MAIN RESET HANDLER -----

export async function POST() {
  try {
    // wipe old data in dependency-safe order
    await prisma.friendship?.deleteMany?.().catch(() => {});
    await prisma.marriage.deleteMany();
    await prisma.enrollment.deleteMany();
    await prisma.employment.deleteMany();
    await prisma.term.deleteMany();
    await prisma.school.deleteMany();
    await prisma.company.deleteMany();
    await prisma.office.deleteMany();
    await prisma.person.deleteMany();
    await prisma.country.deleteMany();
    await prisma.world.deleteMany();

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
        const arr = [];
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
        const arr = [];
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
    }

    await prisma.$transaction([
      ...enrollmentCreates,
      ...employmentCreates,
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
    });
  } catch (err) {
    console.error('Reset world failed:', err);
    return NextResponse.json(
      { error: 'Reset world failed', details: String(err) },
      { status: 500 },
    );
  }
}
