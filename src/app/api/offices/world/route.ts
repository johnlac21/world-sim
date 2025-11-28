import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  // Assume one active world (like you do on /api/world)
  const world = await prisma.world.findFirst({
    orderBy: { id: 'asc' },
  });

  if (!world) {
    return NextResponse.json({ error: 'No world found' }, { status: 404 });
  }

  const offices = await prisma.office.findMany({
    where: {
      worldId: world.id,
      level: 'World',
    },
    include: {
      terms: {
        include: {
          person: true,
        },
        orderBy: { startYear: 'desc' },
      },
      country: true,
    },
    orderBy: { id: 'asc' },
  });

  const payload = {
    worldId: world.id,
    worldName: world.name,
    offices: offices.map((o) => ({
      id: o.id,
      name: o.name,
      level: o.level,
      termLength: o.termLength,
      prestige: o.prestige,
      countryName: o.country?.name ?? null,
      terms: o.terms.map((t) => ({
        id: t.id,
        personId: t.personId,
        personName: t.person.name,
        startYear: t.startYear,
        endYear: t.endYear,
      })),
    })),
  };

  return NextResponse.json(payload);
}
