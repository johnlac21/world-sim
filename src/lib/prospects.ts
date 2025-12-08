// src/lib/prospects.ts
import type { Person } from '@prisma/client';

function clamp0to100(v: number): number {
  return Math.max(0, Math.min(100, v));
}

export type ProspectScoreResult = {
  prospectScore: number; // 0–100
  prospectGrade: 'A' | 'B' | 'C' | 'D';
};

/**
 * Compute a simple youth "prospect score" and letter grade
 * from potential + a few key stats.
 *
 * Assumes stats are roughly in the 0–100 range.
 */
export function computeProspectScoreAndGrade(
  person: Pick<
    Person,
    | 'potentialOverall'
    | 'intelligence'
    | 'creativity'
    | 'discipline'
    | 'leadership'
    | 'charisma'
    | 'ambition'
    | 'stability'
  >,
): ProspectScoreResult {
  const {
    potentialOverall,
    intelligence,
    creativity,
    discipline,
    leadership,
    charisma,
    ambition,
    stability,
  } = person;

  const coreTalent = (intelligence + creativity + discipline) / 3;
  const leadershipBlock = (leadership + charisma) / 2;
  const personalityBlock = (ambition + stability) / 2;

  const raw =
    0.5 * potentialOverall +
    0.3 * coreTalent +
    0.15 * leadershipBlock +
    0.05 * personalityBlock;

  const prospectScore = clamp0to100(Math.round(raw));

  let prospectGrade: 'A' | 'B' | 'C' | 'D' = 'D';
  if (prospectScore >= 85) prospectGrade = 'A';
  else if (prospectScore >= 70) prospectGrade = 'B';
  else if (prospectScore >= 55) prospectGrade = 'C';

  return { prospectScore, prospectGrade };
}
