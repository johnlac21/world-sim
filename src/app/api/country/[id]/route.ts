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

    // Offices + terms for this country (with people, for leader lookup)
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

    // Helper: who was leader in this country for a given year?
    // We pick the first office with a term covering that year; in practice this
    // should be the main "President of X" office, but if you add more, this
    // still returns *a* leader for that year.
    const getLeaderNameForYear = (year: number): string | null => {
      for (const office of offices) {
        const term = office.terms.find(
          (t) =>
            t.startYear <= year &&
            (t.endYear === null || t.endYear >= year),
        );
        if (term) {
          return term.person.name;
        }
      }
      return null;
    };

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

    // Performance summary (per-company / per-industry breakdown, current year)
    const performance = await getCountryPerformanceSummary(
      worldId,
      countryId,
      currentYear,
    );

    // ===== COUNTRY HISTORY (CountryYearPerformance) =====
    // We want: for each year, this country's totalScore, rank, isChampion, leaderName.
    // Rank is computed per-year across all countries in that world.
    const allPerf = await prisma.countryYearPerformance.findMany({
      where: {
        worldId,
      },
      orderBy: [
        { year: 'asc' },
        { totalScore: 'desc' },
        { countryId: 'asc' },
      ],
    });

    type PerfRow = (typeof allPerf)[number];

    const byYear = new Map<number, PerfRow[]>();

    for (const row of allPerf) {
      const arr = byYear.get(row.year) ?? [];
      arr.push(row);
      byYear.set(row.year, arr);
    }

    const history: {
      year: number;
      totalScore: number;
      rank: number | null;
      isChampion: boolean;
      leaderName: string | null;
    }[] = [];

    const sortedYears = Array.from(byYear.keys()).sort((a, b) => a - b);

    for (const year of sortedYears) {
      const rows = byYear.get(year)!;

      // Sort rows within the year by totalScore desc, then countryId asc for tie-breaks
      rows.sort(
        (a, b) =>
          b.totalScore - a.totalScore || a.countryId - b.countryId,
      );

      rows.forEach((row, idx) => {
        if (row.countryId !== countryId) return;

        const rank = idx + 1;
        const leaderName = getLeaderNameForYear(year);

        history.push({
          year,
          totalScore: row.totalScore,
          rank,
          isChampion: row.isChampion,
          leaderName,
        });
      });
    }

    return NextResponse.json(
      {
        id: country.id,
        name: country.name,
        worldId: world.id,
        worldName: world.name,
        offices: officePayload,
        performance,
        history,
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
