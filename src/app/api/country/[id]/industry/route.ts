import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const INDUSTRIES = ['TECH', 'FINANCE', 'RESEARCH'] as const;

type ParamsContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: Request, context: ParamsContext) {
  const { id } = await context.params;
  const countryId = Number(id);

  if (Number.isNaN(countryId)) {
    return NextResponse.json(
      { error: 'Invalid country id' },
      { status: 400 },
    );
  }

  const country = await prisma.country.findUnique({
    where: { id: countryId },
    include: {
      world: true,
    },
  });

  if (!country) {
    return NextResponse.json(
      { error: 'Country not found' },
      { status: 404 },
    );
  }

  // All companies in this country
  const companies = await prisma.company.findMany({
    where: { countryId },
    orderBy: { name: 'asc' },
  });

  const companyIds = companies.map((c) => c.id);

  // All roles for our known industries
  const roles = await prisma.industryRole.findMany({
    where: {
      industry: {
        in: [...INDUSTRIES],
      },
    },
    orderBy: {
      rank: 'asc',
    },
  });

  const rolesByIndustry = new Map<string, typeof roles>();
  for (const role of roles) {
    const arr = rolesByIndustry.get(role.industry) ?? [];
    arr.push(role);
    rolesByIndustry.set(role.industry, arr);
  }

  // All positions for companies in this country
  const positions =
    companyIds.length === 0
      ? []
      : await prisma.companyPosition.findMany({
          where: {
            companyId: {
              in: companyIds,
            },
          },
          include: {
            person: true,
          },
        });

  // companyId -> roleId -> position
  const positionsByCompanyAndRole = new Map<
    number,
    Map<number, (typeof positions)[number]>
  >();

  for (const pos of positions) {
    let byRole = positionsByCompanyAndRole.get(pos.companyId);
    if (!byRole) {
      byRole = new Map();
      positionsByCompanyAndRole.set(pos.companyId, byRole);
    }
    // validateCompanyPositions() should already prevent duplicates,
    // but we defensively only keep the first.
    if (!byRole.has(pos.roleId)) {
      byRole.set(pos.roleId, pos);
    }
  }

  const industriesPayload = INDUSTRIES.map((industry) => {
    const companiesForIndustry = companies.filter(
      (c) => c.industry === industry,
    );

    const rolesForIndustry = rolesByIndustry.get(industry) ?? [];

    const companiesPayload = companiesForIndustry.map((company) => {
      const byRole =
        positionsByCompanyAndRole.get(company.id) ?? new Map();

      const hierarchy = rolesForIndustry.map((role) => {
        const pos = byRole.get(role.id);
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

      return {
        id: company.id,
        name: company.name,
        industry: company.industry,
        countryId: company.countryId,
        hierarchy,
      };
    });

    return {
      industry,
      companies: companiesPayload,
    };
  });

  return NextResponse.json({
    country: {
      id: country.id,
      name: country.name,
    },
    world: {
      id: country.worldId,
      name: country.world.name,
      currentYear: country.world.currentYear,
    },
    industries: industriesPayload,
  });
}
