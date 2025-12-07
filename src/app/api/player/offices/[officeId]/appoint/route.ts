import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const MIN_OFFICE_AGE = 30;

export async function POST(
  req: Request,
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

    const body = await req.json().catch(() => null);
    const personId = body?.personId as number | undefined;

    if (!personId || Number.isNaN(Number(personId))) {
      return NextResponse.json(
        { error: 'Missing or invalid personId' },
        { status: 400 },
      );
    }

    const world = await prisma.world.findFirst();
    if (!world || !world.controlledCountryId) {
      return NextResponse.json(
        { error: 'No controlled country in world' },
        { status: 400 },
      );
    }

    const worldId = world.id;
    const currentYear = world.currentYear;
    const controlledCountryId = world.controlledCountryId;

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

    const person = await prisma.person.findUnique({
      where: { id: personId },
    });

    if (!person) {
      return NextResponse.json(
        { error: 'Candidate not found' },
        { status: 400 },
      );
    }

    // Basic eligibility checks
    if (!person.isAlive) {
      return NextResponse.json(
        { error: 'Candidate must be alive' },
        { status: 400 },
      );
    }

    if (person.worldId !== worldId) {
      return NextResponse.json(
        { error: 'Candidate must be from this world' },
        { status: 400 },
      );
    }

    if (person.countryId !== controlledCountryId) {
      return NextResponse.json(
        { error: 'Candidate must be from the controlled country' },
        { status: 400 },
      );
    }

    if (person.age < MIN_OFFICE_AGE) {
      return NextResponse.json(
        { error: `Candidate must be at least ${MIN_OFFICE_AGE}` },
        { status: 400 },
      );
    }

    // Candidate must not currently hold another active office
    const conflictingTerm = await prisma.term.findFirst({
      where: {
        personId: person.id,
        endYear: null,
        NOT: {
          officeId: office.id,
        },
      },
      include: {
        office: true,
      },
    });

    if (conflictingTerm) {
      return NextResponse.json(
        {
          error: `Candidate already holds an active office (${conflictingTerm.office.name})`,
        },
        { status: 400 },
      );
    }

    // Apply appointment inside a transaction
    const result = await prisma.$transaction(async (tx) => {
      const activeTerm = await tx.term.findFirst({
        where: {
          officeId: office.id,
          endYear: null,
        },
      });

      if (activeTerm) {
        await tx.term.update({
          where: { id: activeTerm.id },
          data: {
            endYear: currentYear,
          },
        });
      }

      const newTerm = await tx.term.create({
        data: {
          officeId: office.id,
          personId: person.id,
          startYear: currentYear,
          endYear: null,
          playerLocked: true,
        },
      });

      return newTerm;
    });

    return NextResponse.json(
      {
        success: true,
        officeId: office.id,
        personId: person.id,
        newTermId: result.id,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error(
      '[API] /api/player/offices/[officeId]/appoint failed:',
      err,
    );
    return NextResponse.json(
      { error: 'Failed to appoint officeholder' },
      { status: 500 },
    );
  }
}
