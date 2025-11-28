// src/lib/stats.ts

export const STAT_KEYS = [
  // Cognitive
  "intelligence",
  "memory",
  "creativity",
  "discipline",
  "judgment",
  "adaptability",
  // Social / Influence
  "charisma",
  "leadership",
  "empathy",
  "communication",
  "confidence",
  "negotiation",
  // Physical
  "strength",
  "endurance",
  "athleticism",
  "vitality",
  "reflexes",
  "appearance",
  // Personality
  "ambition",
  "integrity",
  "riskTaking",
  "patience",
  "agreeableness",
  "stability",
] as const;

export type StatKey = (typeof STAT_KEYS)[number];

export type PersonStats = Record<StatKey, number>;

/**
 * Generate one stat using a normal-ish distribution.
 * mean ~ 50, sd ~ 15, clamped to [20, 80] by default.
 *
 * This is BBGM-style: 50 average adult, 60 good, 70 elite, >80 rare.
 */
export function generateStat(
  mean = 50,
  sd = 15,
  min = 20,
  max = 80,
  random = Math.random
): number {
  // Box–Muller transform for normal distribution
  let u = 0, v = 0;
  while (u === 0) u = random();
  while (v === 0) v = random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);

  const value = mean + sd * z;
  const clamped = Math.min(max, Math.max(min, Math.round(value)));
  return clamped;
}

/**
 * Generate a full stat profile for a person.
 * Later we can tweak per-category means, sds, or special distributions.
 */
export function generateBaseStats(random = Math.random): PersonStats {
  const stats: Partial<PersonStats> = {};

  for (const key of STAT_KEYS) {
    // Right now all stats share the same distribution.
    // In the future we can switch on key and vary mean/sd.
    stats[key] = generateStat(50, 15, 20, 80, random);
  }

  return stats as PersonStats;
}
