import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function clamp0to100(v: number): number {
  return Math.max(0, Math.min(100, v));
}

// Same formula as in /api/player-country
function computeOfficeFit(person: {
  leadership: number;
  judgment: number;
  integrity: number;
  charisma: number;
}): number {
  const raw =
    0.3 * person.leadership +
    0.3 * person.judgment +
    0.2 * person.integrity +
    0.2 * person.charisma;

  return clamp0to100(raw);
}

const MIN_OFFICE_AGE = 30;

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ officeId: string }> },
) {
  try {
    const { officeId: officeIdParam } = await ctx.params;
    const officeId = Number(officeIdParam);
    if (Number.isNaN(officeId)) {
      return NextResponse.json(
        { error: 'Invalid office ID' },
        { status: 400 },
      );
    }

    // Assume one world and one controlled country (same as /api/player-country)
    const world = await prisma.world.findFirst();
    if (!world || !world.controlledCountryId) {
      return NextResponse.json(
        { error: 'No controlled country in world' },
        { status: 400 },
      );
    }

    const controlledCountryId = world.controlledCountryId;
    const worldId = world.id;

    const office = await prisma.office.findUnique({
      where: { id: officeId },
      include: {
        terms: {
          where: { endYear: null },
        },
      },
    });

    if (
      !office ||
      office.worldId !== worldId ||
      office.level !== 'Country' ||
      office.countryId !== controlledCountryId
    ) {
      return NextResponse.json(
        { error: 'Office not found or not controllable by player' },
        { status: 404 },
      );
    }

    const currentTerm = office.terms[0] ?? null;
    const currentHolderId = currentTerm?.personId ?? null;

    const candidates = await prisma.person.findMany({
      where: {
        worldId,
        countryId: controlledCountryId,
        isAlive: true,
        age: { gte: MIN_OFFICE_AGE },
        terms: {
          none: {
            endYear: null,
            NOT: {
              officeId: office.id,
            },
          },
        },
      },
      orderBy: {
        leadership: 'desc',
      },
    });

    const payload = candidates.map((p) => ({
      id: p.id,
      name: p.name,
      age: p.age,
      fitScore: computeOfficeFit({
        leadership: p.leadership,
        judgment: p.judgment,
        integrity: p.integrity,
        charisma: p.charisma,
      }),
      currentOfficeName: null as string | null,
      isCurrentHolder: currentHolderId === p.id,
    }));

    return NextResponse.json(
      {
        office: {
          id: office.id,
          name: office.name,
          prestige: office.prestige,
        },
        candidates: payload,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error(
      '[API] /api/player/offices/[officeId]/candidates failed:',
      err,
    );
    return NextResponse.json(
      { error: 'Failed to load candidates' },
      { status: 500 },
    );
  }
}
