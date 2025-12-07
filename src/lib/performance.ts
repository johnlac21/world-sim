// src/lib/performance.ts
import { prisma } from './prisma';

const CORE_INDUSTRIES = ['TECH', 'FINANCE', 'RESEARCH'] as const;
type CoreIndustry = (typeof CORE_INDUSTRIES)[number];

// We’ll bucket any non-core industries into "OTHER" so they don’t vanish.
function bucketIndustry(industry: string): string {
  if (CORE_INDUSTRIES.includes(industry as CoreIndustry)) {
    return industry;
  }
  return 'OTHER';
}

export type CountryPerformanceSummary = {
  countryId: number;
  year: number;
  overall: {
    numCompanies: number;
    totalOutput: number;
    averageOutput: number | null;
  };
  industries: {
    industry: string;
    numCompanies: number;
    totalOutput: number;
    averageOutput: number | null;
  }[];
  topCompanies: {
    companyId: number;
    name: string;
    industry: string;
    outputScore: number;
  }[];
};

/**
 * Aggregate company performance for a given country + year.
 *
 * Uses:
 *  - Company (worldId, countryId)
 *  - CompanyYearPerformance (companyId, year)
 *
 * Non-core industries (not TECH/FINANCE/RESEARCH) are grouped into an "OTHER" bucket.
 */
export async function getCountryPerformanceSummary(
  worldId: number,
  countryId: number,
  year: number,
): Promise<CountryPerformanceSummary> {
  // Fetch companies for this world + country
  const companies = await prisma.company.findMany({
    where: {
      worldId,
      countryId,
    },
    include: {
      performances: {
        where: { year },
      },
    },
  });

  // One performance row per company (unique (companyId, year))
  type CompanyWithPerf = (typeof companies)[number];

  // Overall + per-industry aggregation
  const industryBuckets = new Map<
    string,
    { numCompanies: number; totalOutput: number }
  >();

  let totalOutput = 0;
  let numCompaniesWithPerf = 0;

  const topCompanyCandidates: {
    companyId: number;
    name: string;
    industry: string;
    outputScore: number;
  }[] = [];

  for (const company of companies as CompanyWithPerf[]) {
    const perf = company.performances[0]; // 0 or 1 row due to @@unique(companyId, year)
    if (!perf) continue;

    const bucket = bucketIndustry(company.industry);
    const bucketEntry =
      industryBuckets.get(bucket) ?? { numCompanies: 0, totalOutput: 0 };

    bucketEntry.numCompanies += 1;
    bucketEntry.totalOutput += perf.outputScore;

    industryBuckets.set(bucket, bucketEntry);

    totalOutput += perf.outputScore;
    numCompaniesWithPerf += 1;

    topCompanyCandidates.push({
      companyId: company.id,
      name: company.name,
      industry: company.industry,
      outputScore: perf.outputScore,
    });
  }

  const overallAverage =
    numCompaniesWithPerf === 0
      ? null
      : totalOutput / numCompaniesWithPerf;

  // Build industry array, including empty core buckets for consistency
  const allIndustryKeys = new Set<string>();

  for (const core of CORE_INDUSTRIES) {
    allIndustryKeys.add(core);
  }
  // Also include any non-core that appeared
  for (const key of industryBuckets.keys()) {
    allIndustryKeys.add(key);
  }

  const industries = Array.from(allIndustryKeys).map((industry) => {
    const entry = industryBuckets.get(industry) ?? {
      numCompanies: 0,
      totalOutput: 0,
    };
    const avg =
      entry.numCompanies === 0
        ? null
        : entry.totalOutput / entry.numCompanies;

    return {
      industry,
      numCompanies: entry.numCompanies,
      totalOutput: entry.totalOutput,
      averageOutput: avg,
    };
  });

  industries.sort((a, b) => {
    if (b.totalOutput !== a.totalOutput) {
      return b.totalOutput - a.totalOutput;
    }
    return a.industry.localeCompare(b.industry);
  });

  // Top N companies by outputScore
  const topCompanies = topCompanyCandidates
    .slice()
    .sort((a, b) => b.outputScore - a.outputScore)
    .slice(0, 5);

  return {
    countryId,
    year,
    overall: {
      numCompanies: numCompaniesWithPerf,
      totalOutput,
      averageOutput: overallAverage,
    },
    industries,
    topCompanies,
  };
}
