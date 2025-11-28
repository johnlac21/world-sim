// scripts/seedWorld.mjs
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const COUNTRY_NAMES = ['Alboria', 'Zentara', 'Kirell', 'Thessis', 'Vandria'];

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const FIRST = ['Lena', 'Kai', 'Mara', 'Jace', 'Noa', 'Theo', 'Iris', 'Ravi'];
const LAST  = ['Halden', 'Kerr', 'Novak', 'Saeed', 'Kato', 'Silva', 'Ibrahim'];

function randomName() {
  const first = FIRST[randInt(0, FIRST.length - 1)];
  const last  = LAST[randInt(0, LAST.length - 1)];
  return `${first} ${last}`;
}

async function main() {
  console.log('Seeding world…');

  // wipe old data (order matters due to FK constraints)
  await prisma.person.deleteMany();
  await prisma.country.deleteMany();
  await prisma.world.deleteMany();

  const world = await prisma.world.create({
    data: {
      name: 'SimWorld 1',
      currentYear: 0,
    },
  });

  const countries = await Promise.all(
    COUNTRY_NAMES.map((name) =>
      prisma.country.create({
        data: {
          name,
          worldId: world.id,
        },
      }),
    ),
  );

  const peopleToCreate = 2000;

  const peopleData = Array.from({ length: peopleToCreate }).map(() => {
    const country = countries[randInt(0, countries.length - 1)];
    const birthYear = randInt(-60, 0);
    const age = -birthYear;

    const baseStat = () => randInt(20, 80);

    return {
      worldId: world.id,
      countryId: country.id,
      name: randomName(),
      birthYear,
      age,
      intelligence: baseStat(),
      wit: baseStat(),
      discipline: baseStat(),
      charisma: baseStat(),
      leadership: baseStat(),
      empathy: baseStat(),
      strength: baseStat(),
      athleticism: baseStat(),
      endurance: baseStat(),
      isPlayer: false,
    };
  });

  await prisma.person.createMany({ data: peopleData });

  // create player character
  await prisma.person.create({
    data: {
      worldId: world.id,
      countryId: countries[0].id,
      name: 'Player One',
      birthYear: 0,
      age: 0,
      intelligence: 60,
      wit: 55,
      discipline: 50,
      charisma: 50,
      leadership: 40,
      empathy: 45,
      strength: 50,
      athleticism: 50,
      endurance: 50,
      isPlayer: true,
    },
  });

  console.log(
    `Seeded world ${world.id} with ${countries.length} countries and ${
      peopleToCreate + 1
    } people (including player).`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
