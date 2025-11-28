// app/api/world/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const world = await prisma.world.findFirst({
    include: {
      countries: true,
      people: {
        orderBy: { id: "asc" },
        take: 20,
      },
      companies: true,
    },
  });

  if (!world) {
    return NextResponse.json({ error: "World not found" }, { status: 404 });
  }

  // Total people in this world
  const totalPeople = await prisma.person.count({
    where: { worldId: world.id },
  });

  // All currently-employed persons in this world
  const currentEmployments = await prisma.employment.findMany({
    where: {
      endYear: null,
      person: {
        worldId: world.id,
      },
    },
    select: { personId: true },
  });

  const employedIds = new Set(currentEmployments.map((e) => e.personId));
  const employedCount = employedIds.size;
  const unemployedCount = totalPeople - employedCount;

  return NextResponse.json({
    // core world fields
    id: world.id,
    name: world.name,
    currentYear: world.currentYear,
    createdAt: world.createdAt,

    // original relations
    countries: world.countries,
    samplePeople: world.people, // <= 20 people, same as before but explicit
    companies: world.companies,

    // NEW: summary stats
    peopleCount: totalPeople,
    countriesCount: world.countries.length,
    companiesCount: world.companies.length,
    employedCount,
    unemployedCount,
  });
}
