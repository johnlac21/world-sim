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

  // Merge marriages where this person is A or B
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

    stats: {
      intelligence: person.intelligence,
      wit: person.wit,
      discipline: person.discipline,
      charisma: person.charisma,
      leadership: person.leadership,
      empathy: person.empathy,
      strength: person.strength,
      athleticism: person.athleticism,
      endurance: person.endurance,
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
