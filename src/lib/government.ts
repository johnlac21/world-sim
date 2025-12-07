// src/lib/government.ts
import type { Person } from '@prisma/client';
import { prisma } from './prisma';

export type GovernmentOfficeSummary = {
  officeId: number;
  officeName: string;
  prestige: number;

  holderId: number | null;
  holderName: string | null;

  fitScore: number | null; // 0–100 if holder exists, else null

  termLength: number | null;
  termStartYear: number | null;
  termEndYear: number | null; // null = ongoing
  termYearsServed: number | null;
  termYearsRemaining: number | null; // null if no term / no termLength
};

function clamp0to100(v: number): number {
  return Math.max(0, Math.min(100, v));
}

// Simple v1 "fit" for any high-level office.
// If you later want office-specific formulas, you can add a switch on office.name.
function computeOfficeFit(person: Person): number {
  const raw =
    0.3 * person.leadership +
    0.3 * person.judgment +
    0.2 * person.integrity +
    0.2 * person.charisma;

  return clamp0to100(raw);
}

/**
 * Get a list of high-level offices + active holder info for a country.
 *
 * High-level in v1 = top N by prestige (default 8), country-level offices only.
 */
export async function getGovernmentOverviewForCountry(
  worldId: number,
  countryId: number,
  currentYear: number,
  maxOffices = 8,
): Promise<GovernmentOfficeSummary[]> {
  const offices = await prisma.office.findMany({
    where: {
      worldId,
      countryId,
      level: 'Country',
    },
    include: {
      terms: {
        where: { endYear: null }, // active term only
        include: {
          person: true,
        },
      },
    },
    orderBy: {
      prestige: 'desc',
    },
    take: maxOffices,
  });

  const summaries: GovernmentOfficeSummary[] = [];

  for (const office of offices) {
    const prestige = office.prestige ?? 0;

    const activeTerm = office.terms[0] ?? null;
    const holder = activeTerm?.person ?? null;

    let fitScore: number | null = null;
    let termYearsServed: number | null = null;
    let termYearsRemaining: number | null = null;

    if (holder) {
      fitScore = computeOfficeFit(holder as Person);
    }

    if (activeTerm) {
      const termLength = office.termLength ?? null;
      const served = currentYear - activeTerm.startYear;

      termYearsServed = served;

      if (termLength != null && termLength > 0) {
        termYearsRemaining = Math.max(0, termLength - served);
      } else {
        termYearsRemaining = null;
      }
    }

    summaries.push({
      officeId: office.id,
      officeName: office.name,
      prestige,

      holderId: holder ? holder.id : null,
      holderName: holder ? holder.name : null,

      fitScore,

      termLength: office.termLength ?? null,
      termStartYear: activeTerm ? activeTerm.startYear : null,
      termEndYear: activeTerm ? activeTerm.endYear : null,
      termYearsServed,
      termYearsRemaining,
    });
  }

  return summaries;
}
