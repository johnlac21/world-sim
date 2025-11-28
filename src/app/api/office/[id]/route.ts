import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params; // params is a Promise in app router
  const officeId = Number(id);

  if (Number.isNaN(officeId)) {
    return NextResponse.json({ error: 'Invalid office id' }, { status: 400 });
  }

  const office = await prisma.office.findUnique({
    where: { id: officeId },
    include: {
      world: true,
      country: true,
      terms: {
        include: { person: true },
        orderBy: { startYear: 'desc' },
      },
    },
  });

  if (!office) {
    return NextResponse.json({ error: 'Office not found' }, { status: 404 });
  }

  const payload = {
    id: office.id,
    name: office.name,
    level: office.level,
    termLength: office.termLength,
    prestige: office.prestige,
    worldId: office.worldId,
    worldName: office.world.name,
    countryId: office.countryId,
    countryName: office.country?.name ?? null,
    terms: office.terms.map((t) => ({
      id: t.id,
      personId: t.personId,
      personName: t.person.name,
      startYear: t.startYear,
      endYear: t.endYear,
    })),
  };

  return NextResponse.json(payload);
}
