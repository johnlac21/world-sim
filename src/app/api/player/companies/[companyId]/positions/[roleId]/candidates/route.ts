import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Params = {
  companyId: string;
  roleId: string;
};

export async function GET(
  _req: Request,
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

    const world = await prisma.world.findFirst();
    if (!world || !world.controlledCountryId) {
      return NextResponse.json(
        { error: 'No controlled country in world' },
        { status: 400 },
      );
    }

    const worldId = world.id;
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

    const role = await prisma.industryRole.findUnique({
      where: { id: roleIdNum },
    });

    if (!role || role.industry !== company.industry) {
      return NextResponse.json(
        { error: 'Role not found for this company/industry' },
        { status: 404 },
      );
    }

    // Find current position for this (company, role)
    const currentPosition = await prisma.companyPosition.findFirst({
      where: {
        companyId: companyIdNum,
        roleId: roleIdNum,
      },
      include: {
        person: true,
      },
    });

    const currentPersonId = currentPosition?.personId ?? null;

    // Candidate pool: alive employees with active Employment at this company
    const candidates = await prisma.person.findMany({
      where: {
        worldId,
        isAlive: true,
        employments: {
          some: {
            companyId: companyIdNum,
            endYear: null,
          },
        },
      },
      include: {
        companyPositions: {
          where: { companyId: companyIdNum },
          include: { role: true },
        },
      },
    });

    const payload = candidates.map((p) => {
      const currentSlot = p.companyPositions[0] ?? null;

      const roleFitScore =
        p.intelligence +
        p.discipline +
        p.charisma +
        p.leadership; // quick heuristic

      return {
        id: p.id,
        name: p.name,
        age: p.age,
        currentRoleName: currentSlot?.role?.name ?? null,
        currentRoleRank: currentSlot?.role?.rank ?? null,
        isCurrentOccupant: p.id === currentPersonId,
        roleFitScore,
      };
    });

    return NextResponse.json(
      {
        company: {
          id: company.id,
          name: company.name,
          industry: company.industry,
        },
        role: {
          id: role.id,
          name: role.name,
          rank: role.rank,
        },
        candidates: payload,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error(
      '[API] /api/player/companies/[companyId]/positions/[roleId]/candidates failed:',
      err,
    );
    return NextResponse.json(
      { error: 'Failed to load company position candidates' },
      { status: 500 },
    );
  }
}
