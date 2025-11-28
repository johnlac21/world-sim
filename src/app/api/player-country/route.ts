// src/app/api/player-country/route.ts (new)
// or you can keep /api/player and just change the payload

import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  const world = await prisma.world.findFirst({
    include: {
      countries: true,
    },
  });

  if (!world || !world.controlledCountryId) {
    return NextResponse.json({ error: 'No world or controlled country set' }, { status: 404 });
  }

  const country = await prisma.country.findUnique({
    where: { id: world.controlledCountryId },
    include: {
      people: true,
      companies: true,
      schools: true,
      offices: {
        include: {
          terms: {
            include: { person: true },
            orderBy: { startYear: 'desc' },
          },
        },
      },
    },
  });

  if (!country) {
    return NextResponse.json({ error: 'Controlled country not found' }, { status: 404 });
  }

  // simple metrics for now; can get fancier later
  const population = country.people.filter((p) => p.isAlive).length;
  const employed = await prisma.employment.count({
    where: {
      person: { countryId: country.id, isAlive: true },
      endYear: null,
    },
  });

  const payload = {
    id: country.id,
    name: country.name,
    worldName: world.name,
    population,
    companies: country.companies.length,
    schools: country.schools.length,
    employed,
    unemployed: Math.max(population - employed, 0),
    offices: country.offices.map((o) => ({
      id: o.id,
      name: o.name,
      level: o.level,
      currentHolder: o.terms.find((t) => t.endYear === null)?.person.name ?? null,
    })),
  };

  return NextResponse.json(payload);
}
