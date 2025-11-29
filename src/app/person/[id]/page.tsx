'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

// === NEW STAT BLOCK ===
type StatBlock = {
  // Cognitive
  intelligence: number;
  memory: number;
  creativity: number;
  discipline: number;
  judgment: number;
  adaptability: number;

  // Social / Influence
  charisma: number;
  leadership: number;
  empathy: number;
  communication: number;
  confidence: number;
  negotiation: number;

  // Physical
  strength: number;
  endurance: number;
  athleticism: number;
  vitality: number;
  reflexes: number;
  appearance: number;

  // Personality
  ambition: number;
  integrity: number;
  riskTaking: number;
  patience: number;
  agreeableness: number;
  stability: number;
};

type Job = {
  id: number;
  title: string;
  companyId: number;
  salary: number;
  startYear: number;
  endYear: number | null;
};

type Enrollment = {
  id: number;
  schoolName: string;
  level: string;
  startYear: number;
  endYear: number | null;
};

type Spouse = {
  marriageId: number;
  spouseId: number;
  spouseName: string;
  startYear: number;
  endYear: number | null;
};

type PersonPayload = {
  id: number;
  name: string;
  worldName: string;
  countryName: string | null;
  birthYear: number;
  age: number;
  isAlive: boolean;
  isPlayer: boolean;
  // ⭐ NEW
  personalityArchetype: string;
  personalitySubtype: string;
  stats: StatBlock;
  currentJob: {
    title: string;
    companyId: number;
    salary: number;
    startYear: number;
  } | null;
  pastJobs: Job[];
  currentEnrollment: {
    schoolName: string;
    level: string;
    startYear: number;
  } | null;
  pastEnrollments: Enrollment[];
  spouses: Spouse[];
};

// layout for grouped rendering
const STAT_LAYOUT: Record<
  string,
  { key: keyof StatBlock; label: string }[]
> = {
  Cognitive: [
    { key: 'intelligence', label: 'Intelligence' },
    { key: 'memory', label: 'Memory' },
    { key: 'creativity', label: 'Creativity' },
    { key: 'discipline', label: 'Discipline' },
    { key: 'judgment', label: 'Judgment' },
    { key: 'adaptability', label: 'Adaptability' },
  ],
  'Social / Influence': [
    { key: 'charisma', label: 'Charisma' },
    { key: 'leadership', label: 'Leadership' },
    { key: 'empathy', label: 'Empathy' },
    { key: 'communication', label: 'Communication' },
    { key: 'confidence', label: 'Confidence' },
    { key: 'negotiation', label: 'Negotiation' },
  ],
  Physical: [
    { key: 'strength', label: 'Strength' },
    { key: 'endurance', label: 'Endurance' },
    { key: 'athleticism', label: 'Athleticism' },
    { key: 'vitality', label: 'Vitality' },
    { key: 'reflexes', label: 'Reflexes' },
    { key: 'appearance', label: 'Appearance' },
  ],
  Personality: [
    { key: 'ambition', label: 'Ambition' },
    { key: 'integrity', label: 'Integrity' },
    { key: 'riskTaking', label: 'Risk taking' },
    { key: 'patience', label: 'Patience' },
    { key: 'agreeableness', label: 'Agreeableness' },
    { key: 'stability', label: 'Emotional stability' },
  ],
};

export default function PersonPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [data, setData] = useState<PersonPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        const res = await fetch(`/api/person/${id}`);
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return <main className="p-4">Loading person…</main>;
  }

  if (!data || (data as any).error) {
    return (
      <main className="p-4 space-y-2">
        <p>Person not found.</p>
        <Link href="/" className="text-blue-600 underline">
          ← Back to world
        </Link>
      </main>
    );
  }

  const { stats } = data;

  return (
    <main className="p-4 space-y-6">
      <header className="space-y-1">
        <div className="flex gap-4 text-sm">
          <Link href="/" className="text-blue-600 underline">
            ← World
          </Link>
          <Link href="/player" className="text-blue-600 underline">
            Player
          </Link>
        </div>
        <h1 className="text-2xl font-bold">
          {data.name}{' '}
          {data.isPlayer && <span className="text-sm text-gray-600">(Player)</span>}
        </h1>
        <p>
          Age {data.age} {data.isAlive ? '' : '(deceased)'}
        </p>
        <p className="text-sm text-gray-600">
          World: {data.worldName}
          {data.countryName ? ` · Country: ${data.countryName}` : ''}
        </p>
        <p className="text-sm text-gray-600">Born in year {data.birthYear}</p>

        {/* ⭐ NEW: Personality summary */}
        <p className="text-sm text-gray-700 mt-1">
          <span className="font-semibold">Personality:</span>{' '}
          {data.personalityArchetype} — {data.personalitySubtype}
        </p>
      </header>

      {/* ===== Attributes ===== */}
      <section>
        <h2 className="text-xl font-semibold mb-2">Attributes</h2>

        <div className="grid gap-4 md:grid-cols-2">
          {Object.entries(STAT_LAYOUT).map(([groupName, groupStats]) => (
            <div key={groupName}>
              <h3 className="font-semibold text-sm mb-1">{groupName}</h3>
              <ul className="list-disc ml-6 text-sm">
                {groupStats.map(({ key, label }) => (
                  <li key={key}>
                    {label}: {stats[key]}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ===== Career ===== */}
      <section>
        <h2 className="text-xl font-semibold mb-2">Career</h2>
        {data.currentJob ? (
          <p className="text-sm mb-2">
            Current job: {data.currentJob.title} (company {data.currentJob.companyId}) —
            salary {data.currentJob.salary.toLocaleString()} — since year{' '}
            {data.currentJob.startYear}
          </p>
        ) : (
          <p className="text-sm mb-2">Currently unemployed.</p>
        )}

        {data.pastJobs.length > 0 && (
          <>
            <h3 className="font-semibold text-sm mt-2">Job history</h3>
            <ul className="list-disc ml-6 text-sm">
              {data.pastJobs.map((j) => (
                <li key={j.id}>
                  {j.title} (company {j.companyId}) — {j.startYear}
                  {j.endYear != null ? `–${j.endYear}` : ''}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      {/* ===== Education ===== */}
      <section>
        <h2 className="text-xl font-semibold mb-2">Education</h2>
        {data.currentEnrollment ? (
          <p className="text-sm mb-2">
            Currently at {data.currentEnrollment.schoolName} (
            {data.currentEnrollment.level}) — since year {data.currentEnrollment.startYear}
          </p>
        ) : (
          <p className="text-sm mb-2">Not currently enrolled.</p>
        )}

        {data.pastEnrollments.length > 0 && (
          <>
            <h3 className="font-semibold text-sm mt-2">Past schools</h3>
            <ul className="list-disc ml-6 text-sm">
              {data.pastEnrollments.map((e) => (
                <li key={e.id}>
                  {e.schoolName} ({e.level}) — {e.startYear}
                  {e.endYear != null ? `–${e.endYear}` : ''}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      {/* ===== Relationships ===== */}
      <section>
        <h2 className="text-xl font-semibold mb-2">Relationships</h2>
        {data.spouses.length === 0 ? (
          <p className="text-sm">No recorded marriages.</p>
        ) : (
          <ul className="list-disc ml-6 text-sm">
            {data.spouses.map((s) => (
              <li key={s.marriageId}>
                <a
                  href={`/person/${s.spouseId}`}
                  className="text-blue-600 underline"
                >
                  {s.spouseName}
                </a>{' '}
                — married {s.startYear}
                {s.endYear != null ? `–${s.endYear}` : ''}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
