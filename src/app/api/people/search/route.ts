import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function parseIntParam(value: string | null): number | null {
  if (!value) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

type EmploymentStatusFilter = 'ANY' | 'EMPLOYED' | 'UNEMPLOYED' | 'STUDENT';

function clamp01(x: number) {
  if (Number.isNaN(x)) return 0;
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const worldIdParam = url.searchParams.get('worldId');
  const worldId = parseIntParam(worldIdParam);

  if (!worldId) {
    return NextResponse.json(
      { error: 'worldId query param is required and must be a number' },
      { status: 400 },
    );
  }

  const countryId = parseIntParam(url.searchParams.get('countryId'));
  const minAge = parseIntParam(url.searchParams.get('minAge'));
  const maxAge = parseIntParam(url.searchParams.get('maxAge'));

  const minIntelligence = parseIntParam(
    url.searchParams.get('minIntelligence'),
  );
  const minLeadership = parseIntParam(url.searchParams.get('minLeadership'));

  const employmentStatus =
    (url.searchParams.get('employmentStatus') as EmploymentStatusFilter | null) ??
    'ANY';

  const industry = url.searchParams.get('industry'); // e.g. "TECH", "FINANCE", "RESEARCH"

  const page = parseIntParam(url.searchParams.get('page')) ?? 1;
  const rawPageSize = parseIntParam(url.searchParams.get('pageSize')) ?? 25;
  const pageSize = Math.min(Math.max(rawPageSize, 1), 100);
  const skip = (page - 1) * pageSize;

  // --- Build Prisma where clause ---
  const where: any = {
    worldId,
  };

  if (countryId) {
    where.countryId = countryId;
  }

  if (minAge != null || maxAge != null) {
    where.age = {};
    if (minAge != null) where.age.gte = minAge;
    if (maxAge != null) where.age.lte = maxAge;
  }

  if (minIntelligence != null) {
    where.intelligence = { gte: minIntelligence };
  }

  if (minLeadership != null) {
    where.leadership = { gte: minLeadership };
  }

  const andClauses: any[] = [];

  // Employment status filter
  if (employmentStatus === 'EMPLOYED') {
    andClauses.push({
      employments: {
        some: { endYear: null },
      },
    });
  } else if (employmentStatus === 'UNEMPLOYED') {
    andClauses.push({
      employments: {
        none: { endYear: null }, // no active job
      },
    });
  } else if (employmentStatus === 'STUDENT') {
    andClauses.push({
      enrollments: {
        some: {
          endYear: null,
          school: { level: 'University' },
        },
      },
    });
  }

  // Industry experience filter
  if (industry) {
    andClauses.push({
      OR: [
        {
          employments: {
            some: {
              endYear: null,
              company: {
                industry,
              },
            },
          },
        },
        {
          companyPositions: {
            some: {
              endYear: null,
              role: { industry },
            },
          },
        },
      ],
    });
  }

  if (andClauses.length > 0) {
    where.AND = andClauses;
  }

  // Count first (for pagination)
  const total = await prisma.person.count({ where });

  // Query results
  const people = await prisma.person.findMany({
    where,
    skip,
    take: pageSize,
    orderBy: [
      { potentialOverall: 'desc' },
      { age: 'asc' },
      { id: 'asc' },
    ],
    include: {
      country: true,
      employments: {
        where: { endYear: null }, // active jobs only
        include: { company: true },
      },
      enrollments: {
        where: { endYear: null },
        include: { school: true },
      },
      companyPositions: {
        where: { endYear: null },
        include: {
          company: true,
          role: true,
        },
      },
    },
  });

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const results = people.map((p) => {
    const activeJob = p.employments[0] ?? null;
    const activeEnrollment = p.enrollments[0] ?? null;

    let employmentStatus: 'EMPLOYED' | 'UNEMPLOYED' | 'STUDENT' | 'OTHER' =
      'OTHER';
    if (activeJob) {
      employmentStatus = 'EMPLOYED';
    } else if (
      activeEnrollment &&
      activeEnrollment.school.level === 'University'
    ) {
      employmentStatus = 'STUDENT';
    } else {
      employmentStatus = 'UNEMPLOYED';
    }

    const currentCompanyName = activeJob?.company.name ?? null;
    const currentCompanyIndustry = activeJob?.company.industry ?? null;

    // --- Compute simple fit scores (0–100) ---
    // Assume stats are roughly 0–100. We normalize linearly into [0, 1] then scale.
    const norm = (x: number) => clamp01(x / 100);

    const execFit01 =
      0.30 * norm(p.leadership) +
      0.20 * norm(p.judgment) +
      0.20 * norm(p.charisma) +
      0.15 * norm(p.integrity) +
      0.15 * norm(p.discipline);

    const managerFit01 =
      0.25 * norm(p.leadership) +
      0.20 * norm(p.discipline) +
      0.20 * norm(p.communication) +
      0.20 * norm(p.intelligence) +
      0.15 * norm(p.stability);

    const workerFit01 =
      0.30 * norm(p.intelligence) +
      0.25 * norm(p.discipline) +
      0.20 * norm(p.adaptability) +
      0.15 * norm(p.ambition) +
      0.10 * norm(p.reliability ?? p.stability);

    const execFit = Math.round(execFit01 * 100);
    const managerFit = Math.round(managerFit01 * 100);
    const workerFit = Math.round(workerFit01 * 100);

    let primaryBadge: 'EXEC' | 'MANAGER' | 'WORKER' = 'WORKER';
    const maxFit = Math.max(execFit, managerFit, workerFit);
    if (maxFit === execFit) primaryBadge = 'EXEC';
    else if (maxFit === managerFit) primaryBadge = 'MANAGER';

    return {
      id: p.id,
      name: p.name,
      age: p.age,
      countryId: p.countryId,
      countryName: p.country?.name ?? null,
      currentCompanyName,
      currentCompanyIndustry,
      employmentStatus,
      intelligence: p.intelligence,
      leadership: p.leadership,
      charisma: p.charisma,
      potentialOverall: p.potentialOverall,
      prestige: p.prestige,
      execFit,
      managerFit,
      workerFit,
      primaryBadge,
    };
  });

  return NextResponse.json({
    page,
    pageSize,
    total,
    totalPages,
    results,
  });
}
