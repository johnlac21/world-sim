// src/app/api/player/youth/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { computeProspectScoreAndGrade } from '@/lib/prospects';

const YOUTH_MIN_AGE = 15;
const YOUTH_MAX_AGE = 23;

// Keep this in sync with the constant in sim.ts
const UNIVERSITY_SLOTS_PER_SCHOOL = 50;

type EducationLevel =
  | 'Primary'
  | 'Secondary'
  | 'University'
  | 'OutOfSchool'
  | 'NotInSchool';

type YouthProspect = {
  id: number;
  name: string;
  age: number;
  potentialOverall: number;
  developmentStyle: string | null;
  peakAge: number | null;
  educationLevel: EducationLevel;
  educationLabel: string;
  prospectScore: number; // 0–100
  prospectGrade: 'A' | 'B' | 'C' | 'D';
  isEligibleForUniversityThisYear: boolean;
  chosenForUniversityNextYear: boolean;
  justEnrolledThisYear: boolean;
};

type PlayerYouthResponse = {
  worldId: number;
  countryId: number;
  youthMinAge: number;
  youthMaxAge: number;
  prospects: YouthProspect[];
  currentYear: number;
  universitySlotsPerYear: number;
  chosenCount: number;
};

function mapEducationLevel(age: number, schoolLevel: string | null): {
  educationLevel: EducationLevel;
  educationLabel: string;
} {
  if (schoolLevel === 'Primary') {
    return { educationLevel: 'Primary', educationLabel: 'Primary school' };
  }
  if (schoolLevel === 'Secondary') {
    return { educationLevel: 'Secondary', educationLabel: 'Secondary school' };
  }
  if (schoolLevel === 'University') {
    return { educationLevel: 'University', educationLabel: 'University' };
  }

  if (age < 18) {
    return { educationLevel: 'OutOfSchool', educationLabel: 'Out of school' };
  }
  return { educationLevel: 'NotInSchool', educationLabel: 'Not in school' };
}

export async function GET() {
  try {
    // Single-world assumption, same as /api/player-country
    const world = await prisma.world.findFirst();
    if (!world || !world.controlledCountryId) {
      return NextResponse.json(
        { error: 'No controlled country in world' },
        { status: 200 },
      );
    }

    const worldId = world.id;
    const countryId = world.controlledCountryId;
    const currentYear = world.currentYear;

    // Decisions already made by the player for NEXT year (currentYear + 1)
    const decisions = await prisma.playerUniversityDecision.findMany({
      where: {
        worldId,
        countryId,
        startYear: currentYear + 1,
      },
      select: {
        personId: true,
      },
    });
    const chosenSet = new Set(decisions.map((d) => d.personId));

    // How many university slots this country gets per year
    const universitiesCount = await prisma.school.count({
      where: {
        worldId,
        countryId,
        level: 'University',
      },
    });
    const universitySlotsPerYear =
      universitiesCount * UNIVERSITY_SLOTS_PER_SCHOOL;

    const people = await prisma.person.findMany({
      where: {
        worldId,
        countryId,
        isAlive: true,
        age: {
          gte: YOUTH_MIN_AGE,
          lte: YOUTH_MAX_AGE,
        },
      },
      include: {
        // include all enrollments so we can detect completion + "just enrolled this year"
        enrollments: {
          include: {
            school: true,
          },
        },
      },
    });

    const prospects: YouthProspect[] = people.map((p) => {
      const activeEnrollment =
        p.enrollments.find((e) => e.endYear === null) ?? null;
      const schoolLevel = activeEnrollment?.school.level ?? null;

      const hasCompletedSecondary = p.enrollments.some(
        (e) => e.school.level === 'Secondary' && e.endYear !== null,
      );
      const hasCompletedUniversity = p.enrollments.some(
        (e) => e.school.level === 'University' && e.endYear !== null,
      );

      const justEnrolledThisYear =
        !!activeEnrollment &&
        activeEnrollment.school.level === 'University' &&
        activeEnrollment.startYear === currentYear;

      const isEligibleForUniversityThisYear =
        p.age === 18 &&
        hasCompletedSecondary &&
        !hasCompletedUniversity &&
        !activeEnrollment;

      const { educationLevel, educationLabel } = mapEducationLevel(
        p.age,
        schoolLevel,
      );

      const { prospectScore, prospectGrade } = computeProspectScoreAndGrade({
        potentialOverall: p.potentialOverall,
        intelligence: p.intelligence,
        creativity: p.creativity,
        discipline: p.discipline,
        leadership: p.leadership,
        charisma: p.charisma,
        ambition: p.ambition,
        stability: p.stability,
      });

      return {
        id: p.id,
        name: p.name,
        age: p.age,
        potentialOverall: p.potentialOverall,
        developmentStyle: p.developmentStyle ?? null,
        peakAge: p.peakAge ?? null,
        educationLevel,
        educationLabel,
        prospectScore,
        prospectGrade,
        isEligibleForUniversityThisYear,
        chosenForUniversityNextYear: chosenSet.has(p.id),
        justEnrolledThisYear,
      };
    });

    // Sort by potential desc, then prospectScore desc, then age asc
    prospects.sort((a, b) => {
      if (b.potentialOverall !== a.potentialOverall) {
        return b.potentialOverall - a.potentialOverall;
      }
      if (b.prospectScore !== a.prospectScore) {
        return b.prospectScore - a.prospectScore;
      }
      if (a.age !== b.age) {
        return a.age - b.age;
      }
      return a.id - b.id;
    });

    const payload: PlayerYouthResponse = {
      worldId,
      countryId,
      youthMinAge: YOUTH_MIN_AGE,
      youthMaxAge: YOUTH_MAX_AGE,
      prospects,
      currentYear,
      universitySlotsPerYear,
      chosenCount: decisions.length,
    };

    return NextResponse.json(payload, { status: 200 });
  } catch (err) {
    console.error('[API] /api/player/youth GET failed:', err);
    return NextResponse.json(
      { error: 'Failed to load youth pipeline' },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const personIds: number[] = Array.isArray(body.personIds)
      ? body.personIds
      : [];

    const world = await prisma.world.findFirst({
      include: {
        countries: true,
      },
    });

    if (!world || !world.controlledCountryId) {
      return NextResponse.json(
        { error: 'No controlled country in world' },
        { status: 200 },
      );
    }

    const worldId = world.id;
    const countryId = world.controlledCountryId;
    const currentYear = world.currentYear;

    // Compute cap based on universities in this country
    const universitiesCount = await prisma.school.count({
      where: {
        worldId,
        countryId,
        level: 'University',
      },
    });
    const cap = universitiesCount * UNIVERSITY_SLOTS_PER_SCHOOL;

    if (cap === 0) {
      // No universities → no point in saving decisions
      await prisma.playerUniversityDecision.deleteMany({
        where: {
          worldId,
          countryId,
          startYear: currentYear + 1,
        },
      });

      return NextResponse.json(
        { ok: true, savedCount: 0, cap: 0 },
        { status: 200 },
      );
    }

    // Validate that candidates are real 18-year-olds in this country
    const candidates = await prisma.person.findMany({
      where: {
        worldId,
        countryId,
        isAlive: true,
        age: 18,
        id: {
          in: personIds,
        },
      },
      select: {
        id: true,
      },
    });

    const validIds = candidates.map((c) => c.id);
    const limitedIds = validIds.slice(0, cap);

    await prisma.$transaction([
      // Clear existing decisions for next year
      prisma.playerUniversityDecision.deleteMany({
        where: {
          worldId,
          countryId,
          startYear: currentYear + 1,
        },
      }),
      // Insert new decisions
      ...limitedIds.map((personId) =>
        prisma.playerUniversityDecision.create({
          data: {
            worldId,
            countryId,
            personId,
            startYear: currentYear + 1,
          },
        }),
      ),
    ]);

    return NextResponse.json(
      { ok: true, savedCount: limitedIds.length, cap },
      { status: 200 },
    );
  } catch (err) {
    console.error('[API] /api/player/youth POST failed:', err);
    return NextResponse.json(
      { error: 'Failed to save university admissions' },
      { status: 500 },
    );
  }
}
