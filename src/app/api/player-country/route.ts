// app/api/player-country/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCountryPerformanceSummary } from '@/lib/performance';

function clamp0to100(v: number): number {
  return Math.max(0, Math.min(100, v));
}

// Simple v1 "fit" score for officeholders
function computeOfficeFit(person: {
  leadership: number;
  judgment: number;
  integrity: number;
  charisma: number;
}): number {
  const raw =
    0.3 * person.leadership +
    0.3 * person.judgment +
    0.2 * person.integrity +
    0.2 * person.charisma;

  return clamp0to100(raw);
}

export async function GET() {
  try {
    // Single world assumption, same as standings
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

    const controlledCountry = await prisma.country.findUnique({
      where: { id: world.controlledCountryId },
    });

    if (!controlledCountry) {
      return NextResponse.json(
        { error: 'Controlled country not found' },
        { status: 200 },
      );
    }

    const countryId = controlledCountry.id;
    const worldId = world.id;
    const currentYear = world.currentYear;

    // Basic aggregates (same semantics as your existing player page)
    const [population, companies, schools] = await Promise.all([
      prisma.person.count({
        where: {
          worldId,
          countryId,
          isAlive: true,
        },
      }),
      prisma.company.count({
        where: {
          worldId,
          countryId,
        },
      }),
      prisma.school.count({
        where: {
          worldId,
          countryId,
        },
      }),
    ]);

    // Employed = has an active employment at a company in this country
    const employed = await prisma.person.count({
      where: {
        worldId,
        countryId,
        isAlive: true,
        employments: {
          some: {
            endYear: null,
            company: {
              countryId,
            },
          },
        },
      },
    });

    // Unemployed = alive, in this country, no active employment
    const unemployed = await prisma.person.count({
      where: {
        worldId,
        countryId,
        isAlive: true,
        employments: {
          none: {
            endYear: null,
            company: {
              countryId,
            },
          },
        },
      },
    });

    // High-level offices: country-level, for this country, top by prestige
    const offices = await prisma.office.findMany({
      where: {
        worldId,
        countryId,
        level: 'Country',
      },
      include: {
        terms: {
          where: { endYear: null }, // active term only
          include: {
            person: true,
          },
        },
      },
      orderBy: {
        prestige: 'desc',
      },
      take: 8, // top N cabinet roles
    });

    const officePayload = offices.map((office) => {
      const activeTerm = office.terms[0] ?? null;
      const holder = activeTerm?.person ?? null;

      let fitScore: number | null = null;
      let termYearsRemaining: number | null = null;

      if (holder) {
        fitScore = computeOfficeFit({
          leadership: holder.leadership,
          judgment: holder.judgment,
          integrity: holder.integrity,
          charisma: holder.charisma,
        });
      }

      if (activeTerm && office.termLength && office.termLength > 0) {
        const yearsServed = currentYear - activeTerm.startYear;
        termYearsRemaining = Math.max(0, office.termLength - yearsServed);
      }

      return {
        id: office.id,
        name: office.name,
        prestige: office.prestige,
        holderId: holder ? holder.id : null,
        holderName: holder ? holder.name : null,
        fitScore,
        termYearsRemaining,
      };
    });

    // Performance summary for this country + year
    const performance = await getCountryPerformanceSummary(
      worldId,
      countryId,
      currentYear,
    );

    return NextResponse.json(
      {
        name: controlledCountry.name,
        worldName: world.name,
        population,
        companies,
        schools,
        employed,
        unemployed,
        offices: officePayload,
        performance,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error('[API] /api/player-country failed:', err);
    return NextResponse.json(
      { error: 'Failed to load player country' },
      { status: 500 },
    );
  }
}
