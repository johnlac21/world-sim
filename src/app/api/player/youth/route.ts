// src/app/api/player/youth/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { computeProspectScoreAndGrade } from '@/lib/prospects';

const YOUTH_MIN_AGE = 15;
const YOUTH_MAX_AGE = 23;

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
};

type PlayerYouthResponse = {
  worldId: number;
  countryId: number;
  youthMinAge: number;
  youthMaxAge: number;
  prospects: YouthProspect[];
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
        enrollments: {
          where: { endYear: null },
          include: {
            school: true,
          },
        },
      },
    });

    const prospects: YouthProspect[] = people.map((p) => {
      const activeEnrollment = p.enrollments[0] ?? null;
      const schoolLevel = activeEnrollment?.school.level ?? null;

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
    };

    return NextResponse.json(payload, { status: 200 });
  } catch (err) {
    console.error('[API] /api/player/youth failed:', err);
    return NextResponse.json(
      { error: 'Failed to load youth pipeline' },
      { status: 500 },
    );
  }
}
