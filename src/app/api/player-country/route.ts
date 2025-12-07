// app/api/player-country/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCountryPerformanceSummary } from '@/lib/performance';

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

    // Offices + current / past terms
    const offices = await prisma.office.findMany({
      where: {
        worldId,
        countryId,
      },
      include: {
        terms: {
          orderBy: { startYear: 'asc' },
          include: {
            person: true,
          },
        },
      },
    });

    const officePayload = offices.map((office) => {
      const currentTerm =
        office.terms.find((t) => t.endYear === null) ?? null;
      const pastTerms = office.terms.filter((t) => t.endYear !== null);

      return {
        id: office.id,
        name: office.name,
        level: office.level,
        termLength: office.termLength,
        prestige: office.prestige,
        currentTerm: currentTerm
          ? {
              id: currentTerm.id,
              personId: currentTerm.personId,
              personName: currentTerm.person.name,
              startYear: currentTerm.startYear,
            }
          : null,
        pastTerms: pastTerms.map((t) => ({
          id: t.id,
          personId: t.personId,
          personName: t.person.name,
          startYear: t.startYear,
          endYear: t.endYear,
        })),
      };
    });

    // NEW: performance summary for this country + year
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
        performance, // 👈 what the client now reads
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
