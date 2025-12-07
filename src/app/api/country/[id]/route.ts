// app/api/country/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCountryPerformanceSummary } from '@/lib/performance';

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  // 👇 Next.js 15+ dynamic API params must be awaited
  const { id: rawId } = await context.params;
  const countryId = Number(rawId);

  if (Number.isNaN(countryId)) {
    return NextResponse.json(
      { error: 'Invalid country id' },
      { status: 400 },
    );
  }

  try {
    // Single world assumption, same as other endpoints
    const world = await prisma.world.findFirst({
      include: {
        countries: true,
      },
    });

    if (!world) {
      return NextResponse.json(
        { error: 'No world found' },
        { status: 200 },
      );
    }

    // Resolve the country from the world's countries
    const country = world.countries.find((c) => c.id === countryId);

    if (!country) {
      return NextResponse.json(
        { error: 'Country not found' },
        { status: 200 },
      );
    }

    const worldId = world.id;
    const currentYear = world.currentYear;

    // Offices + terms for this country
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

    // Performance summary
    const performance = await getCountryPerformanceSummary(
      worldId,
      countryId,
      currentYear,
    );

    return NextResponse.json(
      {
        id: country.id,
        name: country.name,
        worldId: world.id,
        worldName: world.name,
        offices: officePayload,
        performance,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error('[API] /api/country/[id] failed:', err);
    return NextResponse.json(
      { error: 'Failed to load country' },
      { status: 500 },
    );
  }
}
