// src/lib/personality.ts

import { PersonStats } from "./stats";

// ---------- Types ----------

export type PersonalityArchetype =
  | "Visionary"
  | "Leader"
  | "Pragmatist"
  | "Caregiver"
  | "Rebel"
  | "Analyst"
  | "Opportunist"
  | "Traditionalist";

export interface PersonalitySubtypeDef {
  id: string;          // internal key, e.g. "VISIONARY_DREAM_ARCHITECT"
  label: string;       // what we show & store in DB, e.g. "Dream Architect"
  description: string; // short UI flavor text
  weight: number;      // relative frequency within archetype
}

// ---------- Subtype tables ----------

const VISIONARY_SUBTYPES: PersonalitySubtypeDef[] = [
  {
    id: "VISIONARY_DREAM_ARCHITECT",
    label: "Dream Architect",
    description: "Builds worlds in their head, not afraid to reshape reality.",
    weight: 3,
  },
  {
    id: "VISIONARY_CULTURAL_VISIONARY",
    label: "Cultural Visionary",
    description: "Shifts values and norms through art, speech, or storytelling.",
    weight: 3,
  },
  {
    id: "VISIONARY_PHILOSOPHER_BUILDER",
    label: "Philosopher-Builder",
    description: "Deep thinker who pairs lofty ideas with practical frameworks.",
    weight: 2,
  },
  {
    id: "VISIONARY_FUTURIST_OPTIMIST",
    label: "Futurist Optimist",
    description: "Always looking toward what society can become.",
    weight: 3,
  },
  {
    id: "VISIONARY_RADICAL_REFORMER",
    label: "Radical Reformer",
    description: "Sees flaws everywhere and wants to correct them immediately.",
    weight: 2,
  },
  {
    id: "VISIONARY_IDEALISTIC_REBEL",
    label: "Idealistic Rebel",
    description: "Believes the system must be challenged for progress.",
    weight: 1,
  },
  {
    id: "VISIONARY_INVENTIVE_TINKERER",
    label: "Inventive Tinkerer",
    description: "Obsessed with improving systems through small clever changes.",
    weight: 3,
  },
];

const LEADER_SUBTYPES: PersonalitySubtypeDef[] = [
  {
    id: "LEADER_CHARISMATIC_DIPLOMAT",
    label: "Charismatic Diplomat",
    description: "Wins hearts through charm and tact.",
    weight: 3,
  },
  {
    id: "LEADER_COMMANDING_PRESENCE",
    label: "Commanding Presence",
    description: "Controls a room with confidence.",
    weight: 3,
  },
  {
    id: "LEADER_UNSHAKABLE_STRATEGIST",
    label: "Unshakable Strategist",
    description: "Cold, calm, and deeply tactical.",
    weight: 2,
  },
  {
    id: "LEADER_PEOPLES_CHAMPION",
    label: "People's Champion",
    description: "Popular among ordinary citizens.",
    weight: 2,
  },
  {
    id: "LEADER_AMBITIOUS_POWER_SEEKER",
    label: "Ambitious Power-Seeker",
    description: "Values influence above all else.",
    weight: 2,
  },
  {
    id: "LEADER_HEROIC_ICON",
    label: "Heroic Icon",
    description: "A symbol of hope, willing to sacrifice for others.",
    weight: 1,
  },
  {
    id: "LEADER_IRON_WILLED_NEGOTIATOR",
    label: "Iron-Willed Negotiator",
    description: "Never yields under pressure.",
    weight: 2,
  },
];

const PRAGMATIST_SUBTYPES: PersonalitySubtypeDef[] = [
  {
    id: "PRAGMATIST_BUREAUCRATIC_MASTERMIND",
    label: "Bureaucratic Mastermind",
    description: "Thrives in structured organizations.",
    weight: 3,
  },
  {
    id: "PRAGMATIST_COLD_RATIONALIST",
    label: "Cold Rationalist",
    description: "Deals only in facts, not emotion.",
    weight: 2,
  },
  {
    id: "PRAGMATIST_SYSTEM_TECHNICIAN",
    label: "System Technician",
    description: "Understands how institutions truly operate.",
    weight: 3,
  },
  {
    id: "PRAGMATIST_DUTY_BOUND_STABILIZER",
    label: "Duty-Bound Stabilizer",
    description: "Keeps society glued together.",
    weight: 3,
  },
  {
    id: "PRAGMATIST_RELUCTANT_ADMINISTRATOR",
    label: "Reluctant Administrator",
    description: "Does the job well, but without passion.",
    weight: 2,
  },
  {
    id: "PRAGMATIST_EFFICIENT_OPERATOR",
    label: "Efficient Operator",
    description: "Optimizes processes relentlessly.",
    weight: 3,
  },
  {
    id: "PRAGMATIST_POLICY_MECHANIC",
    label: "Policy Mechanic",
    description: "Fixes government like an engineer fixes machines.",
    weight: 2,
  },
];

const CAREGIVER_SUBTYPES: PersonalitySubtypeDef[] = [
  {
    id: "CAREGIVER_NURTURING_ADVOCATE",
    label: "Nurturing Advocate",
    description: "Fights for vulnerable groups.",
    weight: 3,
  },
  {
    id: "CAREGIVER_COMMUNITY_ORGANIZER",
    label: "Community Organizer",
    description: "Connects citizens and builds social cohesion.",
    weight: 3,
  },
  {
    id: "CAREGIVER_GENTLE_MEDIATOR",
    label: "Gentle Mediator",
    description: "Defuses conflicts with calm understanding.",
    weight: 3,
  },
  {
    id: "CAREGIVER_ALTRUISTIC_HEALER",
    label: "Altruistic Healer",
    description: "Puts others above themselves.",
    weight: 1,
  },
  {
    id: "CAREGIVER_DIPLOMATIC_LISTENER",
    label: "Diplomatic Listener",
    description: "Understands perspectives deeply before acting.",
    weight: 2,
  },
  {
    id: "CAREGIVER_PATIENT_STEWARD",
    label: "Patient Steward",
    description: "Manages slow, long-term improvement.",
    weight: 3,
  },
  {
    id: "CAREGIVER_MORAL_COMPASS",
    label: "Moral Compass",
    description: "Guided by strong internal ethics.",
    weight: 1,
  },
];

const REBEL_SUBTYPES: PersonalitySubtypeDef[] = [
  {
    id: "REBEL_ICONOCLAST",
    label: "Iconoclast",
    description: "Destroys sacred cows; challenges narratives.",
    weight: 2,
  },
  {
    id: "REBEL_CHAOTIC_INNOVATOR",
    label: "Chaotic Innovator",
    description: "Brilliant but unpredictable.",
    weight: 2,
  },
  {
    id: "REBEL_DISSIDENT_AGITATOR",
    label: "Dissident Agitator",
    description: "Pushes aggressively for rapid change.",
    weight: 2,
  },
  {
    id: "REBEL_UNDERGROUND_ORGANIZER",
    label: "Underground Organizer",
    description: "Builds movements away from the public eye.",
    weight: 2,
  },
  {
    id: "REBEL_RADICAL_THEORIST",
    label: "Radical Theorist",
    description: "Extreme ideological thinker.",
    weight: 1,
  },
  {
    id: "REBEL_DEFIANT_CYNIC",
    label: "Defiant Cynic",
    description: "Believes society is fundamentally corrupt.",
    weight: 2,
  },
  {
    id: "REBEL_HEROIC_DISSENTER",
    label: "Heroic Dissenter",
    description: "Risks everything to challenge injustice.",
    weight: 1,
  },
];

const ANALYST_SUBTYPES: PersonalitySubtypeDef[] = [
  {
    id: "ANALYST_DATA_ENGINEER_MIND",
    label: "Data Engineer Mind",
    description: "Thinks in systems and abstractions.",
    weight: 3,
  },
  {
    id: "ANALYST_METICULOUS_EVALUATOR",
    label: "Meticulous Evaluator",
    description: "Never acts without perfect information.",
    weight: 3,
  },
  {
    id: "ANALYST_SILENT_OBSERVER",
    label: "Silent Observer",
    description: "Learns quietly; rarely intervenes.",
    weight: 3,
  },
  {
    id: "ANALYST_PATTERN_FORECASTER",
    label: "Pattern Forecaster",
    description: "Predicts trends better than others.",
    weight: 2,
  },
  {
    id: "ANALYST_SKEPTICAL_CRITIC",
    label: "Skeptical Critic",
    description: "Finds flaws and inconsistencies.",
    weight: 2,
  },
  {
    id: "ANALYST_LOGICAL_PURIST",
    label: "Logical Purist",
    description: "Rejects emotional reasoning entirely.",
    weight: 2,
  },
  {
    id: "ANALYST_ARCHIVIST",
    label: "The Archivist",
    description: "Obsessed with documenting everything.",
    weight: 2,
  },
];

const OPPORTUNIST_SUBTYPES: PersonalitySubtypeDef[] = [
  {
    id: "OPPORTUNIST_DEALMAKER",
    label: "Dealmaker",
    description: "Makes connections purely for advantage.",
    weight: 3,
  },
  {
    id: "OPPORTUNIST_SILVER_TONGUE_CHARMER",
    label: "Silver-Tongue Charmer",
    description: "Talks their way out of anything.",
    weight: 3,
  },
  {
    id: "OPPORTUNIST_CALCULATION_GAMBLER",
    label: "Calculation Gambler",
    description: "High-stakes moves with huge payoff.",
    weight: 2,
  },
  {
    id: "OPPORTUNIST_CORPORATE_CLIMBER",
    label: "Corporate Climber",
    description: "Flawless at career advancement.",
    weight: 3,
  },
  {
    id: "OPPORTUNIST_MERCENARY_STRATEGIST",
    label: "Mercenary Strategist",
    description: "Aligns with whoever benefits them.",
    weight: 2,
  },
  {
    id: "OPPORTUNIST_VISION_BACKED_OPPORTUNIST",
    label: "Vision-Backed Opportunist",
    description: "Combines ambition with innovative ideas.",
    weight: 2,
  },
  {
    id: "OPPORTUNIST_CRISIS_PROFITEER",
    label: "Crisis Profiteer",
    description: "Thrives during chaos.",
    weight: 1,
  },
];

const TRADITIONALIST_SUBTYPES: PersonalitySubtypeDef[] = [
  {
    id: "TRADITIONALIST_CULTURAL_GUARDIAN",
    label: "Cultural Guardian",
    description: "Preserves heritage and customs.",
    weight: 3,
  },
  {
    id: "TRADITIONALIST_LAW_AND_ORDER_ADVOCATE",
    label: "Law-and-Order Advocate",
    description: "Values stability above all else.",
    weight: 3,
  },
  {
    id: "TRADITIONALIST_DISCIPLINED_CONFORMIST",
    label: "Disciplined Conformist",
    description: "Follows rules without question.",
    weight: 3,
  },
  {
    id: "TRADITIONALIST_COMMUNITY_ELDER",
    label: "Community Elder",
    description: "Upholds traditions through wisdom.",
    weight: 2,
  },
  {
    id: "TRADITIONALIST_STEADFAST_MORALIST",
    label: "Steadfast Moralist",
    description: "Firm ethical foundation; resistant to change.",
    weight: 2,
  },
  {
    id: "TRADITIONALIST_INSTITUTION_LOYALIST",
    label: "Institution Loyalist",
    description: "Believes in the legitimacy of major institutions.",
    weight: 2,
  },
  {
    id: "TRADITIONALIST_CONSERVATIVE_PRAGMATIST",
    label: "Conservative Pragmatist",
    description: "Balances tradition and practicality.",
    weight: 2,
  },
];

const ARCHETYPE_SUBTYPES: Record<PersonalityArchetype, PersonalitySubtypeDef[]> = {
  Visionary: VISIONARY_SUBTYPES,
  Leader: LEADER_SUBTYPES,
  Pragmatist: PRAGMATIST_SUBTYPES,
  Caregiver: CAREGIVER_SUBTYPES,
  Rebel: REBEL_SUBTYPES,
  Analyst: ANALYST_SUBTYPES,
  Opportunist: OPPORTUNIST_SUBTYPES,
  Traditionalist: TRADITIONALIST_SUBTYPES,
};

// ---------- Helpers ----------

function weightedRandom<T extends { weight: number }>(
  arr: T[],
  random = Math.random
): T {
  const total = arr.reduce((sum, x) => sum + x.weight, 0);
  let r = random() * total;
  for (const item of arr) {
    if (r < item.weight) return item;
    r -= item.weight;
  }
  return arr[arr.length - 1];
}

/**
 * Compute category averages from stats to drive archetype selection.
 */
function computeCategoryScores(stats: PersonStats) {
  const cognitive = (
    stats.intelligence +
    stats.memory +
    stats.creativity +
    stats.discipline +
    stats.judgment +
    stats.adaptability
  ) / 6;

  const social = (
    stats.charisma +
    stats.leadership +
    stats.empathy +
    stats.communication +
    stats.confidence +
    stats.negotiation
  ) / 6;

  const physical = (
    stats.strength +
    stats.endurance +
    stats.athleticism +
    stats.vitality +
    stats.reflexes +
    stats.appearance
  ) / 6;

  const personality = (
    stats.ambition +
    stats.integrity +
    stats.riskTaking +
    stats.patience +
    stats.agreeableness +
    stats.stability
  ) / 6;

  return { cognitive, social, physical, personality };
}

/**
 * FM-style: use stats to bias which archetype a person gets.
 */
export function pickPersonalityArchetypeFromStats(
  stats: PersonStats,
  random = Math.random
): PersonalityArchetype {
  const { cognitive, social, physical, personality } =
    computeCategoryScores(stats);

  // helper to normalize to ~[0,1]
  const norm = (x: number) => (x - 20) / (80 - 20); // roughly 0–1

  const ambition = norm(stats.ambition);
  const integrity = norm(stats.integrity);
  const risk = norm(stats.riskTaking);
  const agree = norm(stats.agreeableness);
  const creativity = norm(stats.creativity);
  const leadership = norm(stats.leadership);
  const charisma = norm(stats.charisma);
  const empathy = norm(stats.empathy);
  const stability = norm(stats.stability);
  const confidence = norm(stats.confidence);
  const patience = norm(stats.patience);
  const memory = norm(stats.memory);

  const weights: { type: PersonalityArchetype; weight: number }[] = [
    {
      type: "Visionary",
      weight:
        norm(cognitive) * 0.6 +
        creativity * 1.0 +
        ambition * 0.4 +
        (1 - norm(physical)) * 0.1,
    },
    {
      type: "Leader",
      weight:
        norm(social) * 0.7 +
        charisma * 0.8 +
        leadership * 1.0 +
        confidence * 0.5,
    },
    {
      type: "Pragmatist",
      weight:
        norm(cognitive) * 0.4 +
        norm(personality) * 0.4 +
        integrity * 0.5 +
        stability * 0.5 +
        risk * -0.3,
    },
    {
      type: "Caregiver",
      weight:
        empathy * 1.0 +
        agree * 0.8 +
        stability * 0.4 +
        integrity * 0.3,
    },
    {
      type: "Rebel",
      weight:
        risk * 0.8 +
        (1 - agree) * 0.7 +
        creativity * 0.4 +
        stability * -0.5,
    },
    {
      type: "Analyst",
      weight:
        norm(cognitive) * 0.8 +
        norm(social) * -0.2 +
        patience * 0.3 +
        memory * 0.5,
    },
    {
      type: "Opportunist",
      weight:
        ambition * 0.9 +
        risk * 0.6 +
        (1 - integrity) * 0.5 +
        charisma * 0.3,
    },
    {
      type: "Traditionalist",
      weight:
        integrity * 0.8 +
        stability * 0.6 +
        patience * 0.5 +
        agree * 0.3 +
        risk * -0.4,
    },
  ];

  // clamp minimum weight to avoid zeros
  const minWeight = 0.05;
  const normalized = weights.map((w) => ({
    type: w.type,
    weight: Math.max(minWeight, w.weight),
  }));

  const total = normalized.reduce((sum, w) => sum + w.weight, 0);
  let r = random() * total;
  for (const w of normalized) {
    if (r < w.weight) return w.type;
    r -= w.weight;
  }
  return "Pragmatist";
}


export function pickPersonalitySubtype(
  archetype: PersonalityArchetype,
  random = Math.random
): PersonalitySubtypeDef {
  const arr = ARCHETYPE_SUBTYPES[archetype];
  return weightedRandom(arr, random);
}

/**
 * Main entry point: given stats, return archetype + subtype metadata.
 */
export function generatePersonalityFromStats(
  stats: PersonStats,
  random = Math.random
): {
  archetype: PersonalityArchetype;
  subtype: PersonalitySubtypeDef;
} {
  const archetype = pickPersonalityArchetypeFromStats(stats, random);
  const subtype = pickPersonalitySubtype(archetype, random);
  return { archetype, subtype };
}
