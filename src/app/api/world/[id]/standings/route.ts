// app/api/world/[id]/standings/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Trend = 'up' | 'down' | 'same' | 'new';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params; // await the promise

  const worldIdParam = Number(id);
  const worldId = Number.isFinite(worldIdParam) ? worldIdParam : NaN;

  let world = null;

  if (!Number.isNaN(worldId)) {
    world = await prisma.world.findUnique({
      where: { id: worldId },
    });
  }

  // Fallback: if bad id or not found, just use the first world
  if (!world) {
    world = await prisma.world.findFirst();
  }

  if (!world) {
    return NextResponse.json(
      {
        world: null,
        standings: [],
        error: 'No world found in database',
      },
      { status: 200 },
    );
  }

  const currentYear = world.currentYear;
  const minYear = Math.max(0, currentYear - 4); // last ~5 seasons

  const perfRows = await prisma.countryYearPerformance.findMany({
    where: {
      worldId: world.id,
      year: {
        gte: minYear,
        lte: currentYear,
      },
    },
    include: {
      country: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (perfRows.length === 0) {
    return NextResponse.json(
      {
        world: {
          id: world.id,
          name: world.name,
          currentYear,
          controlledCountryId: world.controlledCountryId ?? null,
        },
        standings: [],
      },
      { status: 200 },
    );
  }

  // Group history by country
  type HistoryEntry = { year: number; totalScore: number };

  const historyByCountry = new Map<
    number,
    {
      countryId: number;
      countryName: string;
      history: HistoryEntry[];
    }
  >();

  for (const row of perfRows) {
    const countryId = row.countryId;
    const key = countryId;

    let bucket = historyByCountry.get(key);
    if (!bucket) {
      bucket = {
        countryId,
        countryName: row.country.name,
        history: [],
      };
      historyByCountry.set(key, bucket);
    }

    bucket.history.push({
      year: row.year,
      totalScore: row.totalScore,
    });
  }

  // Compute ranks per year: year -> countryId -> rank
  const yearRank = new Map<number, Map<number, number>>();

  for (let year = minYear; year <= currentYear; year++) {
    const rowsForYear = perfRows.filter((r) => r.year === year);
    if (rowsForYear.length === 0) continue;

    rowsForYear.sort((a, b) => {
      if (b.totalScore !== a.totalScore) {
        return b.totalScore - a.totalScore;
      }
      return a.countryId - b.countryId; // deterministic tie-break
    });

    const rankMap = new Map<number, number>();
    rowsForYear.forEach((row, index) => {
      rankMap.set(row.countryId, index + 1);
    });

    yearRank.set(year, rankMap);
  }

  // Build standings from current year only (countries with current-year data)
  const standings = Array.from(historyByCountry.values())
    .map((bucket) => {
      const currentRank =
        yearRank.get(currentYear)?.get(bucket.countryId) ?? null;

      if (currentRank == null) {
        // Country has some history but no current-year row; omit from standings.
        return null;
      }

      const lastYearRank =
        yearRank.get(currentYear - 1)?.get(bucket.countryId) ?? null;

      let trend: Trend;
      if (lastYearRank == null) {
        trend = 'new';
      } else if (currentRank < lastYearRank) {
        trend = 'up';
      } else if (currentRank > lastYearRank) {
        trend = 'down';
      } else {
        trend = 'same';
      }

      const currentEntry = bucket.history.find(
        (h) => h.year === currentYear,
      );
      const totalScore = currentEntry?.totalScore ?? 0;

      const history = bucket.history.slice(); // already filtered 5-year window

      return {
        countryId: bucket.countryId,
        countryName: bucket.countryName,
        currentRank,
        lastYearRank,
        trend,
        totalScore,
        history,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null)
    .sort((a, b) => a.currentRank - b.currentRank);

  return NextResponse.json(
    {
      world: {
        id: world.id,
        name: world.name,
        currentYear,
        controlledCountryId: world.controlledCountryId ?? null,
      },
      standings,
    },
    { status: 200 },
  );
}
