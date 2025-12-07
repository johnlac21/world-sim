import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  // Match your person route signature: params is a Promise
  const { id } = await context.params;
  const companyId = Number(id);

  if (Number.isNaN(companyId)) {
    return NextResponse.json(
      { error: 'Invalid company id' },
      { status: 400 },
    );
  }

  const company = await prisma.company.findUnique({
    where: { id: companyId },
  });

  if (!company) {
    // This is the 404 that would bubble up as "Request failed (404)" in the company page
    return NextResponse.json(
      { error: 'Company not found' },
      { status: 404 },
    );
  }

  // --- Performance rows (used for latest + history) ---
  const perfRowsDesc = await prisma.companyYearPerformance.findMany({
    where: { companyId },
    orderBy: { year: 'desc' },
    take: 10, // last 10 years at most
  });

  const latestRow = perfRowsDesc[0] ?? null;

  const latestPerformance = latestRow
    ? {
        year: latestRow.year,
        talentScore: latestRow.talentScore,
        leadershipScore: latestRow.leadershipScore,
        reliabilityScore: latestRow.reliabilityScore,
        outputScore: latestRow.outputScore,
      }
    : null;

  const performanceHistory = perfRowsDesc
    .slice()
    .sort((a, b) => a.year - b.year)
    .map((row) => ({
      year: row.year,
      talentScore: row.talentScore,
      leadershipScore: row.leadershipScore,
      reliabilityScore: row.reliabilityScore,
      outputScore: row.outputScore,
    }));

  // Roles for this company's industry
  const roles = await prisma.industryRole.findMany({
    where: { industry: company.industry },
    orderBy: { rank: 'asc' },
  });

  // Positions in this company
  const positions = await prisma.companyPosition.findMany({
    where: { companyId },
    include: {
      role: true,
      person: true,
    },
  });

  const positionsByRoleId = new Map<number, (typeof positions)[number]>();
  for (const p of positions) {
    // In theory validateCompanyPositions() should prevent duplicates
    if (!positionsByRoleId.has(p.roleId)) {
      positionsByRoleId.set(p.roleId, p);
    }
  }

  const hierarchy = roles.map((role) => {
    const pos = positionsByRoleId.get(role.id);
    if (!pos) {
      return {
        roleId: role.id,
        roleName: role.name,
        rank: role.rank,
        occupied: false,
        person: null as null,
      };
    }

    const person = pos.person;

    return {
      roleId: role.id,
      roleName: role.name,
      rank: role.rank,
      occupied: true,
      person: {
        id: person.id,
        name: person.name,
        age: person.age,
        countryId: person.countryId,
        intelligence: person.intelligence,
        leadership: person.leadership,
        discipline: person.discipline,
        charisma: person.charisma,
      },
    };
  });

  return NextResponse.json({
    company: {
      id: company.id,
      name: company.name,
      industry: company.industry,
      countryId: company.countryId,
      worldId: company.worldId, // for "View in Standings" link
    },
    hierarchy,
    latestPerformance,      // single latest year (or null)
    performanceHistory,     // 0–10 rows, ascending by year
  });
}
