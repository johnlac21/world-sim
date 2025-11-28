import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const personId = Number(id);

  if (Number.isNaN(personId)) {
    return NextResponse.json({ error: 'Invalid person id' }, { status: 400 });
  }

  const person = await prisma.person.findUnique({
    where: { id: personId },
    include: {
      world: true,
      country: true,
      employments: {
        orderBy: { startYear: 'asc' },
      },
      enrollments: {
        include: { school: true },
        orderBy: { startYear: 'asc' },
      },
      marriagesA: {
        include: { personB: true },
      },
      marriagesB: {
        include: { personA: true },
      },
    },
  });

  if (!person) {
    return NextResponse.json({ error: 'Person not found' }, { status: 404 });
  }

  const spouses = [
    ...person.marriagesA.map((m) => ({
      marriageId: m.id,
      spouseId: m.personB.id,
      spouseName: m.personB.name,
      startYear: m.startYear,
      endYear: m.endYear,
    })),
    ...person.marriagesB.map((m) => ({
      marriageId: m.id,
      spouseId: m.personA.id,
      spouseName: m.personA.name,
      startYear: m.startYear,
      endYear: m.endYear,
    })),
  ].sort((a, b) => a.startYear - b.startYear);

  const currentJob = person.employments.find((e) => e.endYear === null) ?? null;
  const pastJobs = person.employments.filter((e) => e.endYear !== null);

  const currentEnrollment =
    person.enrollments.find((e) => e.endYear === null) ?? null;
  const pastEnrollments = person.enrollments.filter((e) => e.endYear !== null);

  const payload = {
    id: person.id,
    name: person.name,
    worldName: person.world.name,
    countryName: person.country?.name ?? null,
    birthYear: person.birthYear,
    age: person.age,
    isAlive: person.isAlive,
    isPlayer: person.isPlayer,

    // 🔥 NEW: full 24-stat block
    stats: {
      // Cognitive
      intelligence: person.intelligence,
      memory: person.memory,
      creativity: person.creativity,
      discipline: person.discipline,
      judgment: person.judgment,
      adaptability: person.adaptability,

      // Social / Influence
      charisma: person.charisma,
      leadership: person.leadership,
      empathy: person.empathy,
      communication: person.communication,
      confidence: person.confidence,
      negotiation: person.negotiation,

      // Physical
      strength: person.strength,
      endurance: person.endurance,
      athleticism: person.athleticism,
      vitality: person.vitality,
      reflexes: person.reflexes,
      appearance: person.appearance,

      // Personality
      ambition: person.ambition,
      integrity: person.integrity,
      riskTaking: person.riskTaking,
      patience: person.patience,
      agreeableness: person.agreeableness,
      stability: person.stability,
    },

    currentJob: currentJob
      ? {
          title: currentJob.title,
          companyId: currentJob.companyId,
          salary: currentJob.salary,
          startYear: currentJob.startYear,
        }
      : null,
    pastJobs: pastJobs.map((j) => ({
      id: j.id,
      title: j.title,
      companyId: j.companyId,
      salary: j.salary,
      startYear: j.startYear,
      endYear: j.endYear,
    })),

    currentEnrollment: currentEnrollment
      ? {
          schoolName: currentEnrollment.school.name,
          level: currentEnrollment.school.level,
          startYear: currentEnrollment.startYear,
        }
      : null,
    pastEnrollments: pastEnrollments.map((e) => ({
      id: e.id,
      schoolName: e.school.name,
      level: e.school.level,
      startYear: e.startYear,
      endYear: e.endYear,
    })),

    spouses,
  };

  return NextResponse.json(payload);
}
