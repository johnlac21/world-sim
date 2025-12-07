import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Params = {
  companyId: string;
  roleId: string;
};

type Body = {
  personId?: number | null;
  locked?: boolean;
};

export async function POST(
  req: Request,
  ctx: { params: Promise<Params> },
) {
  try {
    const { companyId, roleId } = await ctx.params;
    const companyIdNum = Number(companyId);
    const roleIdNum = Number(roleId);

    if (Number.isNaN(companyIdNum) || Number.isNaN(roleIdNum)) {
      return NextResponse.json(
        { error: 'Invalid companyId or roleId' },
        { status: 400 },
      );
    }

    const body = (await req.json().catch(() => null)) as Body | null;
    if (!body) {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 },
      );
    }

    const personIdRaw = body.personId;
    const locked = body.locked;

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

    const company = await prisma.company.findUnique({
      where: { id: companyIdNum },
    });

    if (
      !company ||
      company.worldId !== worldId ||
      company.countryId !== controlledCountryId
    ) {
      return NextResponse.json(
        { error: 'Company not found or not controllable by player' },
        { status: 404 },
      );
    }

    const roleRow = await prisma.industryRole.findUnique({
      where: { id: roleIdNum },
    });

    if (!roleRow || roleRow.industry !== company.industry) {
      return NextResponse.json(
        { error: 'Role not found for this company/industry' },
        { status: 404 },
      );
    }

    // personId = null means: clear this slot (delete any existing position rows)
    if (personIdRaw === null) {
      await prisma.companyPosition.deleteMany({
        where: {
          companyId: companyIdNum,
          roleId: roleIdNum,
        },
      });

      return NextResponse.json(
        { success: true, cleared: true },
        { status: 200 },
      );
    }

    if (personIdRaw === undefined || Number.isNaN(Number(personIdRaw))) {
      return NextResponse.json(
        { error: 'Missing or invalid personId' },
        { status: 400 },
      );
    }

    const personId = Number(personIdRaw);

    const person = await prisma.person.findUnique({
      where: { id: personId },
      include: {
        employments: true,
        companyPositions: true,
      },
    });

    if (!person) {
      return NextResponse.json(
        { error: 'Candidate not found' },
        { status: 400 },
      );
    }

    if (!person.isAlive || person.worldId !== worldId) {
      return NextResponse.json(
        { error: 'Candidate must be alive and from this world' },
        { status: 400 },
      );
    }

    if (person.countryId !== controlledCountryId) {
      return NextResponse.json(
        { error: 'Candidate must be from the controlled country' },
        { status: 400 },
      );
    }

    // Must be employed at this company (active)
    const hasJobAtCompany = person.employments.some(
      (e) => e.companyId === companyIdNum && e.endYear === null,
    );

    if (!hasJobAtCompany) {
      return NextResponse.json(
        { error: 'Candidate must be employed at this company' },
        { status: 400 },
      );
    }

    await prisma.$transaction(async (tx) => {
      // Clear any existing position for this (company, role)
      await tx.companyPosition.deleteMany({
        where: {
          companyId: companyIdNum,
          roleId: roleIdNum,
        },
      });

      // Check if the person already has a position in this company (other role)
      const existingForPerson = await tx.companyPosition.findFirst({
        where: {
          companyId: companyIdNum,
          personId: personId,
        },
      });

      if (existingForPerson) {
        // Treat as a transfer: move to new role, update locked if provided
        await tx.companyPosition.update({
          where: { id: existingForPerson.id },
          data: {
            roleId: roleIdNum,
            locked: locked ?? existingForPerson.locked,
          },
        });
      } else {
        // Fresh assignment
        await tx.companyPosition.create({
          data: {
            companyId: companyIdNum,
            personId: personId,
            roleId: roleIdNum,
            startYear: currentYear,
            endYear: null,
            locked: locked ?? false,
          },
        });
      }
    });

    return NextResponse.json(
      { success: true },
      { status: 200 },
    );
  } catch (err) {
    console.error(
      '[API] /api/player/companies/[companyId]/positions/[roleId]/assign failed:',
      err,
    );
    return NextResponse.json(
      { error: 'Failed to assign company position' },
      { status: 500 },
    );
  }
}
