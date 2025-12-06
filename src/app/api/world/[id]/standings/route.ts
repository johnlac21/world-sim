// app/api/world/[id]/standings/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Keep it as a const union to match your industries
const INDUSTRIES = ['TECH', 'FINANCE', 'RESEARCH'] as const;

export async function GET() {
  console.log('[STANDINGS API] handler hit');

  // For now, ignore [id] and just use the single active world,
  // same pattern as /api/world.
  const worlds = await prisma.world.findMany({
    include: {
      countries: true,
    },
  });

  console.log('[STANDINGS API] worlds found:', worlds.length);

  if (worlds.length === 0) {
    // Even here, **do not 404** – return debug info with 200
    return NextResponse.json(
      {
        debug: 'No worlds in database',
        world: null,
        standings: [],
      },
      { status: 200 },
    );
  }

  const world = worlds[0];
  const worldId = world.id;
  const currentYear = world.currentYear;
  const countries = world.countries;

  console.log('[STANDINGS API] using worldId:', worldId, 'year:', currentYear);

  if (countries.length === 0) {
    return NextResponse.json(
      {
        world: {
          id: world.id,
          name: world.name,
          currentYear,
        },
        standings: [],
        debug: 'World has no countries',
      },
      { status: 200 },
    );
  }

  const countryIds = countries.map((c) => c.id);

  const companies = await prisma.company.findMany({
    where: {
      worldId,
      countryId: { in: countryIds },
    },
  });

  console.log(
    '[STANDINGS API] companies found:',
    companies.length,
    'for countries:',
    countryIds,
  );

  const companyIds = companies.map((c) => c.id);

  const performances =
    companyIds.length === 0
      ? []
      : await prisma.companyYearPerformance.findMany({
          where: {
            worldId,
            year: currentYear,
            companyId: { in: companyIds },
          },
        });

  console.log(
    '[STANDINGS API] performances found for current year:',
    performances.length,
  );

  const perfByCompanyId = new Map<number, (typeof performances)[number]>();
  for (const perf of performances) {
    perfByCompanyId.set(perf.companyId, perf);
  }

  type IndustryAgg = {
    totalOutput: number;
    count: number;
  };

  type CountryAgg = {
    countryId: number;
    industries: Map<string, IndustryAgg>;
  };

  const countryAggs = new Map<number, CountryAgg>();

  for (const country of countries) {
    const indMap = new Map<string, IndustryAgg>();
    for (const ind of INDUSTRIES) {
      indMap.set(ind, { totalOutput: 0, count: 0 });
    }
    countryAggs.set(country.id, {
      countryId: country.id,
      industries: indMap,
    });
  }

  for (const company of companies) {
    const perf = perfByCompanyId.get(company.id);
    if (!perf) continue;

    const countryId = company.countryId;
    const industry = company.industry;

    const aggContainer = countryAggs.get(countryId);
    if (!aggContainer) continue;

    if (!INDUSTRIES.includes(industry as (typeof INDUSTRIES)[number])) {
      continue;
    }

    const indAgg = aggContainer.industries.get(industry)!;
    indAgg.totalOutput += perf.outputScore;
    indAgg.count += 1;
  }

  const standings = countries.map((country) => {
    const agg = countryAggs.get(country.id)!;

    let overallTotalOutput = 0;
    let overallCount = 0;

    const industries = INDUSTRIES.map((industry) => {
      const entry = agg.industries.get(industry)!;
      overallTotalOutput += entry.totalOutput;
      overallCount += entry.count;

      const averageOutput =
        entry.count === 0 ? null : entry.totalOutput / entry.count;

      return {
        industry,
        numCompanies: entry.count,
        totalOutput: entry.totalOutput,
        averageOutput,
      };
    });

    const overallAverageOutput =
      overallCount === 0 ? null : overallTotalOutput / overallCount;

    return {
      country: {
        id: country.id,
        name: country.name,
      },
      overall: {
        totalOutput: overallTotalOutput,
        averageOutput: overallAverageOutput,
      },
      industries,
    };
  });

  standings.sort((a, b) => {
    if (b.overall.totalOutput !== a.overall.totalOutput) {
      return b.overall.totalOutput - a.overall.totalOutput;
    }
    const aAvg = a.overall.averageOutput ?? 0;
    const bAvg = b.overall.averageOutput ?? 0;
    if (bAvg !== aAvg) {
      return bAvg - aAvg;
    }
    return a.country.name.localeCompare(b.country.name);
  });

  return NextResponse.json(
    {
      world: {
        id: world.id,
        name: world.name,
        currentYear,
      },
      standings,
      debug: 'OK',
    },
    { status: 200 },
  );
}
