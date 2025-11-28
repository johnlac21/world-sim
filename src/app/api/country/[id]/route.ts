import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  // 👇 unwrap the params Promise
  const { id } = await context.params;

  const numId = Number(id);
  if (Number.isNaN(numId)) {
    return NextResponse.json({ error: 'Invalid country id' }, { status: 400 });
  }

  const country = await prisma.country.findUnique({
    where: { id: numId },
    include: {
      world: true,
      offices: {
        include: {
          terms: {
            include: {
              person: true,
            },
            orderBy: { startYear: 'desc' },
          },
        },
      },
    },
  });

  if (!country) {
    return NextResponse.json({ error: 'Country not found' }, { status: 404 });
  }

  const offices = country.offices.map((office) => {
    const currentTerm = office.terms.find((t) => t.endYear === null) || null;
    const pastTerms = office.terms.filter((t) => t.endYear !== null);

    return {
      id: office.id,
      name: office.name,
      level: office.level,
      termLength: office.termLength,
      prestige: office.prestige,
      currentTerm: currentTerm
        ? {
            id: currentTerm.id,
            personId: currentTerm.personId,
            personName: currentTerm.person.name,
            startYear: currentTerm.startYear,
          }
        : null,
      pastTerms: pastTerms.map((t) => ({
        id: t.id,
        personId: t.personId,
        personName: t.person.name,
        startYear: t.startYear,
        endYear: t.endYear,
      })),
    };
  });

  const payload = {
    id: country.id,
    name: country.name,
    worldId: country.worldId,
    worldName: country.world.name,
    offices,
  };

  return NextResponse.json(payload);
}
