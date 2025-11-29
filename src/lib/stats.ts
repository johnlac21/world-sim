// src/lib/stats.ts
export const STAT_KEYS = [
  // Cognitive
  'intelligence',
  'memory',
  'creativity',
  'discipline',
  'judgment',
  'adaptability',

  // Social / Influence
  'charisma',
  'leadership',
  'empathy',
  'communication',
  'confidence',
  'negotiation',

  // Physical
  'strength',
  'endurance',
  'athleticism',
  'vitality',
  'reflexes',
  'appearance',

  // Personality
  'ambition',
  'integrity',
  'riskTaking',
  'patience',
  'agreeableness',
  'stability',
] as const;

export type StatKey = (typeof STAT_KEYS)[number];

export type PersonStats = Record<StatKey, number>;

export function generateStat(
  mean = 50,
  sd = 15,
  min = 20,
  max = 80,
  random = Math.random
): number {
  // Box–Muller transform for normal-ish
  let u = 0,
    v = 0;
  while (u === 0) u = random();
  while (v === 0) v = random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);

  const value = mean + sd * z;
  const clamped = Math.min(max, Math.max(min, Math.round(value)));
  return clamped;
}

export function generateBaseStats(random = Math.random): PersonStats {
  const stats: Partial<PersonStats> = {};

  for (const key of STAT_KEYS) {
    stats[key] = generateStat(50, 15, 20, 80, random);
  }

  return stats as PersonStats;
}

/**
 * Approximate an "overall" rating as the average of all stats.
 * Later we can get fancier (weighted averages, category caps, etc.).
 */
export function computeOverallRating(stats: PersonStats): number {
  let sum = 0;
  for (const key of STAT_KEYS) {
    sum += stats[key];
  }
  return Math.round(sum / STAT_KEYS.length);
}

/**
 * Generate a BBGM-style potential.
 * - Most people cluster 40–70
 * - 70–85 are rare elites
 * - 85+ are extremely rare
 */
export function generatePotentialOverall(
  currentOverall: number,
  random = Math.random
): number {
  // Base potential around current overall, with some upside baked in
  // so low-rated kids can still occasionally be monsters.
  const baseMean = Math.max(currentOverall, 45); // don’t go below 45 mean
  const pot = generateStat(baseMean + 5, 12, 40, 99, random);
  return pot;
}

/**
 * Assign a development style:
 * - EARLY  (peaks young)
 * - NORMAL
 * - LATE   (peaks older)
 * - VOLATILE (boom/bust, swingy year-to-year)
 */
export type DevStyle = "EARLY" | "NORMAL" | "LATE" | "VOLATILE";

export function generateDevelopmentStyle(random = Math.random): DevStyle {
  const r = random();
  if (r < 0.2) return "EARLY";
  if (r < 0.7) return "NORMAL";
  if (r < 0.9) return "LATE";
  return "VOLATILE";
}

/**
 * Generate a peak age based on dev style.
 */
export function generatePeakAge(
  devStyle: DevStyle,
  random = Math.random
): number {
  switch (devStyle) {
    case "EARLY":
      // early bloomers: 25–35
      return 25 + Math.floor(random() * 11);
    case "NORMAL":
      // normal: 30–45
      return 30 + Math.floor(random() * 16);
    case "LATE":
      // late bloomers: 40–55
      return 40 + Math.floor(random() * 16);
    case "VOLATILE":
      // anywhere 25–50, but they'll swing a lot anyway
      return 25 + Math.floor(random() * 26);
    default:
      return 35;
  }
}
