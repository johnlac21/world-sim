import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: Request, context: RouteContext) {
  // Next.js 15 style: params is async
  const { id } = await context.params;
  const worldId = Number(id);

  if (Number.isNaN(worldId)) {
    return NextResponse.json(
      { error: 'Invalid world id' },
      { status: 400 },
    );
  }

  try {
    // Look up this specific world; fall back to first world if not found
    let world = await prisma.world.findUnique({
      where: { id: worldId },
    });

    if (!world) {
      world = await prisma.world.findFirst();
    }

    if (!world) {
      return NextResponse.json(
        { error: 'No world found' },
        { status: 200 },
      );
    }

    const currentYear = world.currentYear;

    // Top N companies by outputScore for this world + year
    const performances = await prisma.companyYearPerformance.findMany({
      where: {
        worldId: world.id,
        year: currentYear,
      },
      include: {
        company: {
          include: {
            country: true,
          },
        },
      },
      orderBy: {
        outputScore: 'desc',
      },
      take: 10,
    });

    const companies = performances.map((perf) => ({
      companyId: perf.companyId,
      name: perf.company.name,
      industry: perf.company.industry,
      countryId: perf.company.countryId,
      countryName: perf.company.country.name,
      outputScore: perf.outputScore,
    }));

    return NextResponse.json(
      {
        world: {
          id: world.id,
          name: world.name,
          currentYear,
        },
        companies,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error('[API] /api/world/[id]/top-companies failed:', err);
    return NextResponse.json(
      { error: 'Failed to load top companies' },
      { status: 500 },
    );
  }
}
