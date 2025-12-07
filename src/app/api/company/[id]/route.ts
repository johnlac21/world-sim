import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: Request, context: RouteContext) {
  // 👇 unwrap params (it's a Promise in Next 16)
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
    include: {
      world: true,
      performances: {
        orderBy: { year: 'asc' },
      },
    },
  });

  if (!company) {
    return NextResponse.json(
      { error: 'Company not found' },
      { status: 404 },
    );
  }

  const { world, performances } = company;
  const currentYear = world.currentYear;
  const currentPerformance =
    performances.find((p) => p.year === currentYear) ?? null;

  return NextResponse.json({
    company: {
      id: company.id,
      name: company.name,
      industry: company.industry,
      countryId: company.countryId,
    },
    currentYear,
    currentPerformance:
      currentPerformance === null
        ? null
        : {
            year: currentPerformance.year,
            talentScore: currentPerformance.talentScore,
            leadershipScore: currentPerformance.leadershipScore,
            reliabilityScore: currentPerformance.reliabilityScore,
            outputScore: currentPerformance.outputScore,
          },
    history: performances.map((p) => ({
      year: p.year,
      talentScore: p.talentScore,
      leadershipScore: p.leadershipScore,
      reliabilityScore: p.reliabilityScore,
      outputScore: p.outputScore,
    })),
  });
}
