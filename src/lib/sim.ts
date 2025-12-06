// src/lib/sim.ts
import type {
  Person,
  CompanyPosition,
  IndustryRole,
} from '@prisma/client';
import { prisma } from './prisma';
import {
  STAT_KEYS,
  type PersonStats,
  computeOverallRating,
  generatePotentialOverall,
  generateDevelopmentStyle,
  generatePeakAge,
  type DevStyle,
} from './stats';
import { generatePersonalityFromStats } from './personality';

// --- random name helpers for births ---
const FIRST = ['Lena', 'Kai', 'Mara', 'Jace', 'Noa', 'Theo', 'Iris', 'Ravi'];
const LAST = ['Halden', 'Kerr', 'Novak', 'Saeed', 'Kato', 'Silva', 'Ibrahim'];

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomName() {
  const first = FIRST[randInt(0, FIRST.length - 1)];
  const last = LAST[randInt(0, LAST.length - 1)];
  return `${first} ${last}`;
}

function deathProbability(age: number): number {
  if (age < 50) return 0.001;
  if (age < 65) return 0.005;
  if (age < 80) return 0.02;
  if (age < 95) return 0.08;
  return 0.25;
}

const JOB_LADDER = [
  'Intern',
  'Junior Analyst',
  'Analyst',
  'Senior Analyst',
  'Manager',
  'Director',
  'VP',
];

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

function nextJobTitle(current: string): string {
  const idx = JOB_LADDER.indexOf(current);
  if (idx === -1 || idx === JOB_LADDER.length - 1) return current;
  return JOB_LADDER[idx + 1];
}

function clampStat(v: number) {
  return Math.max(1, Math.min(99, Math.round(v)));
}

function clampPrestige(v: number) {
  return Math.max(0, Math.min(100, Math.round(v)));
}

// simple normal noise generator for dev
function normalNoise(sd: number): number {
  if (sd <= 0) return 0;
  let u = 0,
    v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return z * sd;
}

// Salary based on mental/social stats
function computeBaseSalary(person: {
  intelligence: number;
  discipline: number;
  charisma: number;
}): number {
  const skill = (person.intelligence + person.discipline + person.charisma) / 3; // ~20–80
  // Map ~20–80 → ~25k–150k
  return Math.round(25000 + (skill - 20) * (125000 / 60));
}

/**
 * Apply one year of BBGM-style development to a person's stats.
 * Uses potentialOverall, peakAge, developmentStyle, and per-stat peak tweaks.
 */
function applyYearlyDevelopment(person: Person, newAge: number): PersonStats {
  const currentStats: PersonStats = {} as PersonStats;
  for (const key of STAT_KEYS) {
    // @ts-expect-error dynamic access from Prisma model
    currentStats[key] = person[key];
  }

  const currentOverall = computeOverallRating(currentStats);
  const { potentialOverall, peakAge, developmentStyle } = person;

  // how far from overall peak
  const yearsToPeak = peakAge - newAge;
  const growthDirection = yearsToPeak > 0 ? 1 : -1; // pre-peak vs post-peak
  const distance = Math.abs(yearsToPeak);

  let baseGrowth = 0.0;
  if (distance > 15) baseGrowth = 0.3;
  else if (distance > 8) baseGrowth = 0.7;
  else if (distance > 3) baseGrowth = 1.2;
  else baseGrowth = 1.8; // very near peak: strong movement

  let styleMultiplier = 1.0;
  let volatility = 0.4;
  switch (developmentStyle as DevStyle) {
    case 'EARLY':
      styleMultiplier = newAge < peakAge ? 1.3 : 0.7;
      volatility = 0.5;
      break;
    case 'NORMAL':
      styleMultiplier = 1.0;
      volatility = 0.4;
      break;
    case 'LATE':
      styleMultiplier = newAge < peakAge ? 0.8 : 1.2;
      volatility = 0.4;
      break;
    case 'VOLATILE':
      styleMultiplier = 1.0;
      volatility = 1.2;
      break;
  }

  const signedGrowth = baseGrowth * styleMultiplier * growthDirection;

  const nextStats: PersonStats = {} as PersonStats;

  for (const key of STAT_KEYS) {
    const current = currentStats[key];

    // tweak per-stat peak ages: physical earlier, cognitive later
    let statPeakAge = peakAge;
    if (
      key === 'strength' ||
      key === 'endurance' ||
      key === 'athleticism' ||
      key === 'reflexes' ||
      key === 'appearance'
    ) {
      statPeakAge = peakAge - 5;
    } else if (
      key === 'intelligence' ||
      key === 'judgment' ||
      key === 'memory'
    ) {
      statPeakAge = peakAge + 5;
    }

    const statYearsToPeak = statPeakAge - newAge;
    const statGrowthDir = statYearsToPeak > 0 ? 1 : -1;

    const diffOverall = potentialOverall - currentOverall;
    const statTarget = current + diffOverall * 0.4; // soft pull toward potential

    const towardTarget = statTarget - current;
    const stepMagnitude = Math.min(
      Math.abs(towardTarget) * 0.25,
      Math.abs(signedGrowth) + 0.5,
    );

    const deterministicDelta = stepMagnitude * statGrowthDir;
    const noise = normalNoise(volatility);

    let next = current + deterministicDelta + noise;
    next = clampStat(next);

    nextStats[key] = next;
  }

  return nextStats;
}

// ============================================================================
// INDUSTRY HIERARCHY LOGIC (v0)
// ============================================================================

/**
 * Cleanup invalid CompanyPosition rows:
 * - person is dead
 * - person.countryId !== company.countryId
 * - role.industry !== company.industry
 * - no active Employment at that company
 */
async function cleanInvalidCompanyPositions(): Promise<void> {
  const positions = await prisma.companyPosition.findMany({
    include: {
      person: {
        select: {
          id: true,
          isAlive: true,
          countryId: true,
          employments: {
            where: { endYear: null }, // active only
            select: { companyId: true },
          },
        },
      },
      company: {
        select: {
          id: true,
          countryId: true,
          industry: true,
        },
      },
      role: {
        select: {
          id: true,
          industry: true,
        },
      },
    },
  });

  const invalidIds: number[] = [];

  for (const pos of positions) {
    const { person, company, role } = pos;
    let invalid = false;

    // dead
    if (!person.isAlive) invalid = true;

    // cross-country not allowed
    if (!invalid) {
      if (person.countryId == null || person.countryId !== company.countryId) {
        invalid = true;
      }
    }

    // mismatched industry
    if (!invalid && role.industry !== company.industry) {
      invalid = true;
    }

    // person must still be employed at this company
    if (!invalid) {
      const activeEmploymentAtCompany = person.employments.some(
        (e) => e.companyId === company.id,
      );
      if (!activeEmploymentAtCompany) {
        invalid = true;
      }
    }

    if (invalid) invalidIds.push(pos.id);
  }

  if (invalidIds.length > 0) {
    await prisma.companyPosition.deleteMany({
      where: { id: { in: invalidIds } },
    });
  }
}

// Compare promotion candidates: intelligence → leadership → discipline
function comparePromotionCandidates(
  a: CompanyPosition & { person: Person; role: IndustryRole },
  b: CompanyPosition & { person: Person; role: IndustryRole },
): number {
  if (a.person.intelligence !== b.person.intelligence) {
    return b.person.intelligence - a.person.intelligence;
  }
  if (a.person.leadership !== b.person.leadership) {
    return b.person.leadership - a.person.leadership;
  }
  if (a.person.discipline !== b.person.discipline) {
    return b.person.discipline - a.person.discipline;
  }
  return a.id - b.id;
}

// Compare hiring candidates: (intelligence + discipline + charisma)
function compareHiringCandidates(a: Person, b: Person): number {
  const scoreA = a.intelligence + a.discipline + a.charisma;
  const scoreB = b.intelligence + b.discipline + b.charisma;
  if (scoreA !== scoreB) return scoreB - scoreA;
  return a.id - b.id;
}

/**
 * Fill hierarchy for a single company:
 * - Promote from lower ranks into empty higher ranks
 * - Hire into lowest rank roles from free agents in the same country
 */
async function fillIndustryHierarchyForCompany(companyId: number): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const company = await tx.company.findUnique({
      where: { id: companyId },
      include: {
        world: true,
      },
    });

    if (!company) return;
    const industry = company.industry;
    const currentYear = company.world.currentYear;

    const roles = await tx.industryRole.findMany({
      where: { industry },
      orderBy: { rank: 'asc' }, // 0 = top
    });

    if (roles.length === 0) return;

    const positions = await tx.companyPosition.findMany({
      where: { companyId: company.id },
      include: {
        person: true,
        role: true,
      },
    });

    type Slot = {
      role: IndustryRole;
      position: (CompanyPosition & { person: Person; role: IndustryRole }) | null;
    };

    const slots: Slot[] = roles.map((role) => {
      const matches = positions.filter((p) => p.roleId === role.id);
      let kept: (CompanyPosition & { person: Person; role: IndustryRole }) | null =
        null;
      if (matches.length > 0) {
        kept = matches.slice().sort(comparePromotionCandidates)[0];
      }
      return { role, position: kept };
    });

    // ----- Promotion loop (top-down, repeat until stable) -----
    let promotedSomething = true;
    while (promotedSomething) {
      promotedSomething = false;

      for (let i = 0; i < slots.length; i++) {
        const targetSlot = slots[i];
        if (targetSlot.position) continue;

        const lowerCandidates: (CompanyPosition & {
          person: Person;
          role: IndustryRole;
        })[] = [];

        for (let j = i + 1; j < slots.length; j++) {
          const lowerSlot = slots[j];
          if (lowerSlot.position) {
            lowerCandidates.push(lowerSlot.position);
          }
        }

        if (lowerCandidates.length === 0) continue;

        const best = lowerCandidates.slice().sort(comparePromotionCandidates)[0];
        const fromIndex = slots.findIndex(
          (s) => s.position && s.position.id === best.id,
        );
        if (fromIndex === -1) continue;

        const fromSlot = slots[fromIndex];

        const updated = await tx.companyPosition.update({
          where: { id: best.id },
          data: { roleId: targetSlot.role.id },
          include: {
            person: true,
            role: true,
          },
        });

        // debug log
        // eslint-disable-next-line no-console
        console.log(
          `[SIM][Company ${company.id}] PROMOTION: ${updated.person.name} from "${fromSlot.role.name}" -> "${targetSlot.role.name}"`,
        );

        targetSlot.position = updated;
        fromSlot.position = null;
        promotedSomething = true;
      }
    }

    // ----- Hiring into lowest-rank roles -----
    const maxRank = Math.max(...roles.map((r) => r.rank));
    const bottomRoleIds = roles.filter((r) => r.rank === maxRank).map((r) => r.id);

    const hasEmptyBottom = slots.some(
      (s) => bottomRoleIds.includes(s.role.id) && !s.position,
    );
    if (!hasEmptyBottom) return;

    let candidates = await tx.person.findMany({
      where: {
        worldId: company.worldId,
        isAlive: true,
        age: { gte: 18, lte: 65 },
        countryId: company.countryId,
        employments: {
          none: {
            endYear: null,
          },
        },
        companyPositions: {
          none: {},
        },
      },
    });

    candidates = candidates.slice().sort(compareHiringCandidates);

    const getNextEmptyBottomSlotIndex = (): number =>
      slots.findIndex(
        (s) => bottomRoleIds.includes(s.role.id) && !s.position,
      );

    while (true) {
      const bottomIndex = getNextEmptyBottomSlotIndex();
      if (bottomIndex === -1) break;
      if (candidates.length === 0) break;

      const bestCandidate = candidates.shift()!;
      const role = slots[bottomIndex].role;

      const created = await tx.companyPosition.create({
        data: {
          companyId: company.id,
          personId: bestCandidate.id,
          roleId: role.id,
          startYear: currentYear,
          endYear: null,
        },
        include: {
          person: true,
          role: true,
        },
      });

      // eslint-disable-next-line no-console
      console.log(
        `[SIM][Company ${company.id}] HIRE: ${created.person.name} into "${created.role.name}" (rank ${created.role.rank})`,
      );

      slots[bottomIndex].position = created;
    }
  });
}

/**
 * Validation pass:
 * - role.industry must match company.industry
 * - at most one position per (companyId, roleId), keep best by intelligence
 */
async function validateCompanyPositions(): Promise<void> {
  const positions = await prisma.companyPosition.findMany({
    include: {
      company: {
        select: { id: true, industry: true },
      },
      role: {
        select: { id: true, industry: true },
      },
      person: {
        select: { id: true, intelligence: true },
      },
    },
  });

  const idsToDelete = new Set<number>();

  // invalid industry
  for (const pos of positions) {
    if (pos.role.industry !== pos.company.industry) {
      idsToDelete.add(pos.id);
    }
  }

  // dedupe (companyId, roleId)
  const byKey = new Map<string, typeof positions>();

  for (const pos of positions) {
    if (idsToDelete.has(pos.id)) continue;
    const key = `${pos.companyId}-${pos.roleId}`;
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key)!.push(pos);
  }

  for (const [, group] of byKey.entries()) {
    if (group.length <= 1) continue;

    const sorted = group
      .slice()
      .sort(
        (a, b) =>
          b.person.intelligence - a.person.intelligence || a.id - b.id,
      );
    const keep = sorted[0];

    for (let i = 1; i < sorted.length; i++) {
      idsToDelete.add(sorted[i].id);
    }

    // eslint-disable-next-line no-console
    console.log(
      `[SIM] validateCompanyPositions: keeping person ${keep.person.id} for company ${keep.companyId}, role ${keep.roleId}, deleting ${sorted.length - 1} duplicates`,
    );
  }

  if (idsToDelete.size > 0) {
    await prisma.companyPosition.deleteMany({
      where: { id: { in: Array.from(idsToDelete) } },
    });
  }
}

/**
 * Convenience: run hierarchy maintenance for all companies in a world.
 */
async function fillIndustryHierarchiesForWorld(worldId: number): Promise<void> {
  const companies = await prisma.company.findMany({
    where: { worldId },
    select: { id: true },
  });

  for (const { id } of companies) {
    await fillIndustryHierarchyForCompany(id);
  }
}

// ============================================================================
// COMPANY YEARLY PERFORMANCE (v0)
// ============================================================================

async function computeCompanyYearPerformance(
  worldId: number,
  year: number,
): Promise<void> {
  // All companies in this world
  const companies = await prisma.company.findMany({
    where: { worldId },
  });

  if (companies.length === 0) return;

  const companyIds = companies.map((c) => c.id);

  // All positions in these companies, with person + role so we know stats and rank
  const positions = await prisma.companyPosition.findMany({
    where: {
      companyId: { in: companyIds },
    },
    include: {
      person: true,
      role: true,
    },
  });

  // companyId -> positions[]
  const positionsByCompany = new Map<number, any[]>();
  for (const pos of positions) {
    const arr = positionsByCompany.get(pos.companyId) ?? [];
    arr.push(pos);
    positionsByCompany.set(pos.companyId, arr);
  }

  // Component scores for a single person (based on their stats)
  function computeComponents(p: Person) {
    // Talent: mostly cognitive stats
    const talent =
      0.35 * p.intelligence +
      0.2 * p.creativity +
      0.2 * p.judgment +
      0.15 * p.memory +
      0.1 * p.adaptability;

    // Leadership / influence
    const leadership =
      0.4 * p.leadership +
      0.3 * p.charisma +
      0.2 * p.communication +
      0.1 * p.negotiation;

    // Reliability / consistency
    const reliability =
      0.5 * p.discipline +
      0.25 * p.integrity +
      0.25 * p.stability;

    return { talent, leadership, reliability };
  }

  // Tier multipliers by role rank (executives matter more)
  function tierMultiplier(rank: number): number {
    if (rank <= 1) return 1.4; // President / VP
    if (rank <= 5) return 1.15; // managers / mid-tier
    return 1.0; // workers / staff
  }

  const upserts: {
    companyId: number;
    worldId: number;
    year: number;
    talentScore: number;
    leadershipScore: number;
    reliabilityScore: number;
    outputScore: number;
  }[] = [];

  for (const company of companies) {
    const companyPositions = positionsByCompany.get(company.id) ?? [];

    if (companyPositions.length === 0) {
      // No one in the ladder → zero performance
      upserts.push({
        companyId: company.id,
        worldId,
        year,
        talentScore: 0,
        leadershipScore: 0,
        reliabilityScore: 0,
        outputScore: 0,
      });
      continue;
    }

    let talentSum = 0;
    let leadershipSum = 0;
    let reliabilitySum = 0;

    for (const pos of companyPositions) {
      const person: Person | null = pos.person;
      const role: IndustryRole | null = pos.role;
      if (!person || !role) continue;

      const { talent, leadership, reliability } = computeComponents(person);
      const mult = tierMultiplier(role.rank);

      talentSum += talent * mult;
      leadershipSum += leadership * mult;
      reliabilitySum += reliability * mult;
    }

    const outputScore =
      0.5 * talentSum + 0.3 * leadershipSum + 0.2 * reliabilitySum;

    upserts.push({
      companyId: company.id,
      worldId,
      year,
      talentScore: talentSum,
      leadershipScore: leadershipSum,
      reliabilityScore: reliabilitySum,
      outputScore,
    });
  }

  // Upsert per (company, year)
  await Promise.all(
    upserts.map((row) =>
      prisma.companyYearPerformance.upsert({
        where: {
          companyId_year: {
            companyId: row.companyId,
            year: row.year,
          },
        },
        create: {
          worldId: row.worldId,
          companyId: row.companyId,
          year: row.year,
          talentScore: row.talentScore,
          leadershipScore: row.leadershipScore,
          reliabilityScore: row.reliabilityScore,
          outputScore: row.outputScore,
        },
        update: {
          talentScore: row.talentScore,
          leadershipScore: row.leadershipScore,
          reliabilityScore: row.reliabilityScore,
          outputScore: row.outputScore,
        },
      }),
    ),
  );
}


// ============================================================================
// MAIN YEARLY SIM
// ============================================================================

export async function tickYear(worldId: number) {
  const world = await prisma.world.findUnique({
    where: { id: worldId },
    include: {
      people: {
        where: { isAlive: true },
      },
    },
  });

  if (!world) throw new Error(`World ${worldId} not found`);

  const newYear = world.currentYear + 1;

  // quick lookup for living people at start of tick
  const personById = new Map<number, (typeof world.people)[number]>();
  for (const p of world.people) personById.set(p.id, p);

  // ---------- AGE + DEATH + STATS (BBGM-style dev) ----------
  const updates = world.people.map((p) => {
    const newAge = p.age + 1;
    const died = Math.random() < deathProbability(newAge);

    // start with current stats
    let newStats: PersonStats = {} as PersonStats;
    for (const key of STAT_KEYS) {
      // @ts-expect-error dynamic
      newStats[key] = p[key];
    }

    if (!died && newAge >= 5 && newAge <= 80) {
      // apply dev only for reasonable ages
      newStats = applyYearlyDevelopment(p, newAge);
    }

    const prestige = p.prestige;

    return {
      id: p.id,
      age: newAge,
      isAlive: !died,
      prestige,
      ...newStats,
    };
  });

  // Build a quick lookup from personId → updated state
  const updatedById = new Map<number, (typeof updates)[number]>();
  for (const u of updates) updatedById.set(u.id, u);

  // ---------- MARRIAGES: track ongoing & spouse map ----------
  const ongoingMarriages = await prisma.marriage.findMany({
    where: { endYear: null },
  });

  const spouseMap = new Map<number, number[]>();
  for (const m of ongoingMarriages) {
    const aList = spouseMap.get(m.personAId) || [];
    aList.push(m.personBId);
    spouseMap.set(m.personAId, aList);

    const bList = spouseMap.get(m.personBId) || [];
    bList.push(m.personAId);
    spouseMap.set(m.personBId, bList);
  }

  // ---------- BIRTHS ----------
  const fertile = world.people.filter((p) => p.age >= 20 && p.age <= 40);
  const births: any[] = [];

  const statFromParents = (p1Val: number, p2Val: number | null, noise = 10) => {
    const avg = p2Val == null ? p1Val : (p1Val + p2Val) / 2;
    const noisy = avg + randInt(-noise, noise);
    return Math.max(10, Math.min(99, noisy));
  };

  for (const parent1 of fertile) {
    if (Math.random() < 0.05) {
      // choose spouse first, if any
      let parent2: (typeof world.people)[number] | null = null;
      const spouseIds = spouseMap.get(parent1.id);

      if (spouseIds && spouseIds.length > 0) {
        const spouseId = pickRandom(spouseIds);
        const s = personById.get(spouseId);
        if (s && s.isAlive && s.age >= 20 && s.age <= 50) {
          parent2 = s;
        }
      }

      // if no spouse found, optionally pick a random co-parent
      if (!parent2) {
        const candidates = fertile.filter(
          (p) =>
            p.id !== parent1.id &&
            p.countryId === parent1.countryId &&
            Math.abs(p.age - parent1.age) <= 10,
        );
        if (candidates.length > 0) {
          parent2 = pickRandom(candidates);
        }
      }

      const babyName = randomName();
      const p2 = parent2;

      const babyStats: PersonStats = {
        // Cognitive
        intelligence: statFromParents(parent1.intelligence, p2 ? p2.intelligence : null),
        memory:       statFromParents(parent1.memory,       p2 ? p2.memory       : null),
        creativity:   statFromParents(parent1.creativity,   p2 ? p2.creativity   : null),
        discipline:   statFromParents(parent1.discipline,   p2 ? p2.discipline   : null),
        judgment:     statFromParents(parent1.judgment,     p2 ? p2.judgment     : null),
        adaptability: statFromParents(parent1.adaptability, p2 ? p2.adaptability : null),

        // Social / Influence
        charisma:      statFromParents(parent1.charisma,      p2 ? p2.charisma      : null),
        leadership:    statFromParents(parent1.leadership,    p2 ? p2.leadership    : null),
        empathy:       statFromParents(parent1.empathy,       p2 ? p2.empathy       : null),
        communication: statFromParents(parent1.communication, p2 ? p2.communication : null),
        confidence:    statFromParents(parent1.confidence,    p2 ? p2.confidence    : null),
        negotiation:   statFromParents(parent1.negotiation,   p2 ? p2.negotiation   : null),

        // Physical
        strength:    statFromParents(parent1.strength,    p2 ? p2.strength    : null),
        endurance:   statFromParents(parent1.endurance,   p2 ? p2.endurance   : null),
        athleticism: statFromParents(parent1.athleticism, p2 ? p2.athleticism : null),
        vitality:    statFromParents(parent1.vitality,    p2 ? p2.vitality    : null),
        reflexes:    statFromParents(parent1.reflexes,    p2 ? p2.reflexes    : null),
        appearance:  statFromParents(parent1.appearance,  p2 ? p2.appearance  : null),

        // Personality
        ambition:      statFromParents(parent1.ambition,      p2 ? p2.ambition      : null),
        integrity:     statFromParents(parent1.integrity,     p2 ? p2.integrity     : null),
        riskTaking:    statFromParents(parent1.riskTaking,    p2 ? p2.riskTaking    : null),
        patience:      statFromParents(parent1.patience,      p2 ? p2.patience      : null),
        agreeableness: statFromParents(parent1.agreeableness, p2 ? p2.agreeableness : null),
        stability:     statFromParents(parent1.stability,     p2 ? p2.stability     : null),
      };

      const babyOverall   = computeOverallRating(babyStats);
      const babyDevStyle  = generateDevelopmentStyle();
      const babyPeakAge   = generatePeakAge(babyDevStyle);
      const babyPotential = generatePotentialOverall(babyOverall);

      const { archetype: babyArchetype, subtype: babySubtype } =
        generatePersonalityFromStats(babyStats);

      births.push({
        worldId,
        countryId: parent1.countryId,
        name: babyName,
        birthYear: newYear,
        age: 0,
        isAlive: true,
        isPlayer: false,
        parent1Id: parent1.id,
        parent2Id: parent2 ? parent2.id : null,

        potentialOverall: babyPotential,
        peakAge: babyPeakAge,
        developmentStyle: babyDevStyle,

        personalityArchetype: babyArchetype,
        personalitySubtype: babySubtype.label,

        ...babyStats,
      });
    }
  }

  // ---------- EDUCATION + JOB + SOCIAL SYSTEMS ----------

  const schools = await prisma.school.findMany({
    where: { worldId },
  });

  const schoolsByCountryLevel = new Map<string, typeof schools>();
  for (const s of schools) {
    const key = `${s.countryId}-${s.level}`;
    const arr = schoolsByCountryLevel.get(key) || [];
    arr.push(s);
    schoolsByCountryLevel.set(key, arr);
  }

  const peopleFull = await prisma.person.findMany({
    where: { worldId },
    include: {
      country: true,
      employments: true,
      enrollments: {
        include: { school: true },
      },
    },
  });

  const companies = await prisma.company.findMany({
    where: { worldId },
  });

  const companiesByCountry = new Map<number, typeof companies>();
  for (const c of companies) {
    const arr = companiesByCountry.get(c.countryId) || [];
    arr.push(c);
    companiesByCountry.set(c.countryId, arr);
  }

  const friendships = await prisma.friendship.findMany({});

  const offices = await prisma.office.findMany({
    where: { worldId },
    include: { terms: true },
  });

  const jobTxs: any[] = [];
  const eduTxs: any[] = [];
  const marriageTxs: any[] = [];
  const friendshipTxs: any[] = [];
  const officeTxs: any[] = [];

  // ---------- MARRIAGE UPDATES ----------
  const endedMarriageIds = new Set<number>();

  for (const m of ongoingMarriages) {
    const a = updatedById.get(m.personAId);
    const b = updatedById.get(m.personBId);

    const aDied = a && !a.isAlive;
    const bDied = b && !b.isAlive;

    if (aDied || bDied) {
      endedMarriageIds.add(m.id);
      marriageTxs.push(
        prisma.marriage.update({
          where: { id: m.id },
          data: { endYear: newYear },
        }),
      );
      continue;
    }

    const ageA = a?.age;
    const ageB = b?.age;

    if (
      ageA != null &&
      ageB != null &&
      ageA >= 25 &&
      ageB >= 25 &&
      ageA <= 75 &&
      ageB <= 75
    ) {
      if (Math.random() < 0.01) {
        endedMarriageIds.add(m.id);
        marriageTxs.push(
          prisma.marriage.update({
            where: { id: m.id },
            data: { endYear: newYear },
          }),
        );
      }
    }
  }

  // ---------- NEW MARRIAGES ----------
  const marriedIds = new Set<number>();
  for (const m of ongoingMarriages) {
    if (endedMarriageIds.has(m.id)) continue;
    marriedIds.add(m.personAId);
    marriedIds.add(m.personBId);
  }

  const singleAdultsByCountry = new Map<number, typeof peopleFull>();

  for (const person of peopleFull) {
    const upd = updatedById.get(person.id);
    if (!upd || !upd.isAlive) continue;
    if (!person.countryId) continue;
    if (upd.age < 20 || upd.age > 40) continue;
    if (marriedIds.has(person.id)) continue;

    const arr = singleAdultsByCountry.get(person.countryId) || [];
    arr.push(person);
    singleAdultsByCountry.set(person.countryId, arr);
  }

  for (const [countryId, singles] of singleAdultsByCountry.entries()) {
    const pool = shuffle(singles);

    for (let i = 0; i + 1 < pool.length; i += 2) {
      const a = pool[i];
      const b = pool[i + 1];
      if (a.id === b.id) continue;

      if (Math.random() < 0.05) {
        marriageTxs.push(
          prisma.marriage.create({
            data: {
              personAId: a.id,
              personBId: b.id,
              startYear: newYear,
            },
          }),
        );
      }
    }
  }

  // ---------- FRIENDSHIP EVOLUTION ----------
  for (const f of friendships) {
    const a = updatedById.get(f.personAId);
    const b = updatedById.get(f.personBId);
    if (!a || !b || !a.isAlive || !b.isAlive) continue;

    const delta = randInt(-5, 5);
    const newStrength = Math.max(1, Math.min(100, f.strength + delta));

    friendshipTxs.push(
      prisma.friendship.update({
        where: { id: f.id },
        data: { strength: newStrength },
      }),
    );
  }

  // ---------- ELECTIONS ----------
  for (const office of offices) {
    const currentTerm =
      office.terms.find((t) => t.endYear === null) || null;

    const needElection =
      !currentTerm || newYear - currentTerm.startYear >= office.termLength;

    if (!needElection) continue;

    const candidates = peopleFull.filter((p) => {
      const upd = updatedById.get(p.id);
      if (!upd || !upd.isAlive) return false;
      if (upd.age < 30 || upd.age > 75) return false;

      if (office.level === 'Country') {
        if (!office.countryId || p.countryId !== office.countryId) return false;
      }
      return true;
    });

    if (candidates.length === 0) continue;

    const scored = candidates.map((p) => {
      const upd = updatedById.get(p.id)!;
      const charisma = upd.charisma;
      const leadership = upd.leadership;
      const prestige = upd.prestige ?? 0;

      const score =
        0.6 * charisma +
        0.4 * leadership +
        0.5 * prestige;

      return {
        person: p,
        score: Math.max(0.1, score),
      };
    });

    const total = scored.reduce((sum, s) => sum + s.score, 0);
    let r = Math.random() * total;
    let winner = scored[0].person;
    for (const s of scored) {
      r -= s.score;
      if (r <= 0) {
        winner = s.person;
        break;
      }
    }

    if (currentTerm) {
      officeTxs.push(
        prisma.term.update({
          where: { id: currentTerm.id },
          data: { endYear: newYear },
        }),
      );
    }

    officeTxs.push(
      prisma.term.create({
        data: {
          officeId: office.id,
          personId: winner.id,
          startYear: newYear,
        },
      }),
    );

    const updWinner = updatedById.get(winner.id);
    if (updWinner) {
      updWinner.charisma = clampStat(updWinner.charisma + 1);
      updWinner.leadership = clampStat(updWinner.leadership + 2);
      updWinner.prestige = clampPrestige(
        (updWinner.prestige ?? 0) + office.prestige / 5,
      );
    }
  }

  // ---------- PER-PERSON: education + jobs ----------
  for (const person of peopleFull) {
    const upd = updatedById.get(person.id);
    if (!upd) continue;

    const age = upd.age;

    const currentJob =
      person.employments.find((e) => e.endYear === null) || null;
    const currentEnrollment =
      person.enrollments.find((e) => e.endYear === null) || null;

    const hasCompletedPrimary = person.enrollments.some(
      (e) => e.school.level === 'Primary' && e.endYear !== null,
    );
    const hasCompletedSecondary = person.enrollments.some(
      (e) => e.school.level === 'Secondary' && e.endYear !== null,
    );
    const hasCompletedUniversity = person.enrollments.some(
      (e) => e.school.level === 'University' && e.endYear !== null,
    );

    if (!upd.isAlive) {
      if (currentJob) {
        jobTxs.push(
          prisma.employment.update({
            where: { id: currentJob.id },
            data: { endYear: newYear },
          }),
        );
      }
      if (currentEnrollment) {
        eduTxs.push(
          prisma.enrollment.update({
            where: { id: currentEnrollment.id },
            data: { endYear: newYear },
          }),
        );
      }
      continue;
    }

    // EDUCATION progression
    let stillEnrolled = currentEnrollment;

    if (currentEnrollment) {
      const level = currentEnrollment.school.level;

      if (level === 'Primary' && age >= 12) {
        eduTxs.push(
          prisma.enrollment.update({
            where: { id: currentEnrollment.id },
            data: { endYear: newYear },
          }),
        );
        stillEnrolled = null;
      } else if (level === 'Secondary' && age >= 18) {
        eduTxs.push(
          prisma.enrollment.update({
            where: { id: currentEnrollment.id },
            data: { endYear: newYear },
          }),
        );
        stillEnrolled = null;
      } else if (
        level === 'University' &&
        ((newYear - currentEnrollment.startYear) >= 4 || age >= 23)
      ) {
        eduTxs.push(
          prisma.enrollment.update({
            where: { id: currentEnrollment.id },
            data: { endYear: newYear },
          }),
        );
        stillEnrolled = null;
      } else {
        if (level === 'University' && Math.random() < 0.03) {
          eduTxs.push(
            prisma.enrollment.update({
              where: { id: currentEnrollment.id },
              data: { endYear: newYear },
            }),
          );
          stillEnrolled = null;
        }
      }
    }

    if (!stillEnrolled && person.countryId) {
      const countryId = person.countryId;
      const keyPrimary = `${countryId}-Primary`;
      const keySecondary = `${countryId}-Secondary`;
      const keyUniversity = `${countryId}-University`;

      if (age >= 6 && age <= 11 && !hasCompletedPrimary) {
        const candidates = schoolsByCountryLevel.get(keyPrimary);
        if (candidates && candidates.length > 0) {
          const school = pickRandom(candidates);
          eduTxs.push(
            prisma.enrollment.create({
              data: {
                personId: person.id,
                schoolId: school.id,
                startYear: newYear,
              },
            }),
          );
        }
      } else if (age >= 12 && age <= 17 && hasCompletedPrimary && !hasCompletedSecondary) {
        const candidates = schoolsByCountryLevel.get(keySecondary);
        if (candidates && candidates.length > 0) {
          const school = pickRandom(candidates);
          eduTxs.push(
            prisma.enrollment.create({
              data: {
                personId: person.id,
                schoolId: school.id,
                startYear: newYear,
              },
            }),
          );
        }
      } else if (
        age >= 18 &&
        age <= 22 &&
        hasCompletedSecondary &&
        !hasCompletedUniversity
      ) {
        const candidates = schoolsByCountryLevel.get(keyUniversity);
        if (candidates && candidates.length > 0) {
          const academic = (upd.intelligence + upd.discipline) / 2;
          const uniChance = 0.25 + (academic - 20) * (0.4 / 60);
          if (Math.random() < Math.max(0, Math.min(0.7, uniChance))) {
            const school = pickRandom(candidates);
            eduTxs.push(
              prisma.enrollment.create({
                data: {
                  personId: person.id,
                  schoolId: school.id,
                  startYear: newYear,
                },
              }),
            );
          }
        }
      }
    }

    // JOB SYSTEM
    const job = currentJob;

    if (age > 75 && job) {
      jobTxs.push(
        prisma.employment.update({
          where: { id: job.id },
          data: { endYear: newYear },
        }),
      );
      continue;
    }

    if (job) {
      if (Math.random() < 0.02) {
        jobTxs.push(
          prisma.employment.update({
            where: { id: job.id },
            data: { endYear: newYear },
          }),
        );
        continue;
      }

      const promoFactor = (upd.discipline + upd.leadership) / 160;
      if (Math.random() < 0.05 * promoFactor) {
        const newTitle = nextJobTitle(job.title);
        const newSalary = Math.round(job.salary * (1.1 + Math.random() * 0.05));

        jobTxs.push(
          prisma.employment.update({
            where: { id: job.id },
            data: { endYear: newYear },
          }),
        );

        jobTxs.push(
          prisma.employment.create({
            data: {
              personId: person.id,
              companyId: job.companyId,
              title: newTitle,
              salary: newSalary,
              startYear: newYear,
            },
          }),
        );
      } else {
        const newSalary = Math.round(job.salary * (1.02 + Math.random() * 0.02));
        jobTxs.push(
          prisma.employment.update({
            where: { id: job.id },
            data: { salary: newSalary },
          }),
        );
      }

      continue;
    }

    if (age < 18 || age > 65) continue;

    const countryCompanies =
      (person.countryId && companiesByCountry.get(person.countryId)) || companies;
    if (!countryCompanies || countryCompanies.length === 0) continue;

    const skill =
      (upd.intelligence + upd.discipline + upd.charisma) / 3;

    const eduBoost = hasCompletedUniversity ? 0.1 : 0;
    const baseHireChance = 0.05 + (skill - 20) * (0.25 / 60) + eduBoost;
    const hireChance = Math.max(0, Math.min(0.4, baseHireChance));

    if (Math.random() < hireChance) {
      const company = pickRandom(countryCompanies);
      const title = pickRandom(JOB_LADDER.slice(0, 3));
      const salary = computeBaseSalary({
        intelligence: upd.intelligence,
        discipline: upd.discipline,
        charisma: upd.charisma,
      });

      jobTxs.push(
        prisma.employment.create({
          data: {
            personId: person.id,
            companyId: company.id,
            title,
            salary,
            startYear: newYear,
          },
        }),
      );
    }
  }

  // ---------- WRITE TO DB ----------
  await prisma.$transaction([
    prisma.world.update({
      where: { id: worldId },
      data: { currentYear: newYear },
    }),

    ...updates.map((u) =>
      prisma.person.update({
        where: { id: u.id },
        data: {
          age: u.age,
          isAlive: u.isAlive,
          prestige: u.prestige,

          intelligence: u.intelligence,
          memory: u.memory,
          creativity: u.creativity,
          discipline: u.discipline,
          judgment: u.judgment,
          adaptability: u.adaptability,

          charisma: u.charisma,
          leadership: u.leadership,
          empathy: u.empathy,
          communication: u.communication,
          confidence: u.confidence,
          negotiation: u.negotiation,

          strength: u.strength,
          endurance: u.endurance,
          athleticism: u.athleticism,
          vitality: u.vitality,
          reflexes: u.reflexes,
          appearance: u.appearance,

          ambition: u.ambition,
          integrity: u.integrity,
          riskTaking: u.riskTaking,
          patience: u.patience,
          agreeableness: u.agreeableness,
          stability: u.stability,
        },
      }),
    ),

    ...(births.length ? [prisma.person.createMany({ data: births })] : []),

    ...eduTxs,
    ...marriageTxs,
    ...friendshipTxs,
    ...officeTxs,
    ...jobTxs,
  ]);

  // ---------- INDUSTRY HIERARCHY MAINTENANCE (v0) ----------
  await cleanInvalidCompanyPositions();
  await fillIndustryHierarchiesForWorld(worldId);
  await validateCompanyPositions();

  // ---------- COMPANY YEARLY PERFORMANCE (v0) ----------
  await computeCompanyYearPerformance(worldId, newYear);

  return {
    newYear,
    deaths: updates.filter((u) => !u.isAlive).length,
    births: births.length,
  };
}


