'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import { SectionHeader } from '@/components/ui/SectionHeader';
import { Panel } from '@/components/ui/Panel';
import { StatBadge } from '@/components/ui/StatBadge';
// at the top of src/app/person/[id]/page.tsx
import { StatPill } from '@/components/ui/StatPill';


// === STAT BLOCK ===
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
  companyName: string;
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

  personalityArchetype: string;
  personalitySubtype: string;

  stats: StatBlock;

  currentJob: {
    title: string;
    companyId: number;
    companyName: string;
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
const STAT_LAYOUT: Record<string, { key: keyof StatBlock; label: string }[]> = {
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
    return <main className="px-3 py-4 md:px-4">Loading person…</main>;
  }

  if (!data || (data as any).error) {
    return (
      <main className="px-3 py-4 md:px-4 space-y-2">
        <p>Person not found.</p>
        <Link href="/" className="text-blue-600 underline">
          ← Back to world
        </Link>
      </main>
    );
  }

  const { stats } = data;

  const descriptionPieces: string[] = [];
  descriptionPieces.push(`Age ${data.age}${data.isAlive ? '' : ' (deceased)'}`);
  descriptionPieces.push(`World: ${data.worldName}`);
  if (data.countryName) descriptionPieces.push(`Country: ${data.countryName}`);
  descriptionPieces.push(`Born in year ${data.birthYear}`);

  return (
    <main className="px-3 py-4 md:px-4 md:py-6 space-y-6">
      <SectionHeader
        title={data.name}
        eyebrow={data.isPlayer ? 'Player-controlled person' : 'Person'}
        description={descriptionPieces.join(' · ')}
        backHref="/"
        backLabel="Back to world"
      >
        <p className="mt-1 text-sm text-gray-700">
          <span className="font-semibold">Personality:</span>{' '}
          {data.personalityArchetype} — {data.personalitySubtype}
        </p>
      </SectionHeader>

      {/* ===== Attributes ===== */}
      <section>
        <h2 className="text-xl font-semibold mb-2">Attributes</h2>

        <div className="grid gap-4 md:grid-cols-2">
          {Object.entries(STAT_LAYOUT).map(([groupName, groupStats]) => (
            <div key={groupName} className="rounded-xl border border-gray-200 bg-white/80 p-3">
              <h3 className="font-semibold text-xs mb-2 text-gray-600 uppercase tracking-wide">
                {groupName}
              </h3>
              <div className="space-y-1">
                {groupStats.map(({ key, label }) => (
                  <StatPill
                    key={key}
                    label={label}
                    value={stats[key]}
                    max={20} // your stat scale
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>


      {/* ===== Career ===== */}
      <Panel title="Career">
        {data.currentJob ? (
          <p className="text-sm mb-2">
            Current job: {data.currentJob.title} at{' '}
            <Link
              href={`/company/${data.currentJob.companyId}`}
              className="text-blue-600 hover:underline"
            >
              {data.currentJob.companyName}
            </Link>{' '}
            — salary {data.currentJob.salary.toLocaleString()} — since year{' '}
            {data.currentJob.startYear}
          </p>
        ) : (
          <p className="text-sm mb-2">Currently unemployed.</p>
        )}

        {data.pastJobs.length > 0 && (
          <>
            <h3 className="font-semibold text-sm mt-2 mb-1">Job history</h3>
            <ul className="list-disc ml-6 text-sm space-y-0.5">
              {data.pastJobs.map((j) => (
                <li key={j.id}>
                  {j.title} at{' '}
                  <Link
                    href={`/company/${j.companyId}`}
                    className="text-blue-600 hover:underline"
                  >
                    {j.companyName}
                  </Link>{' '}
                  — {j.startYear}
                  {j.endYear != null ? `–${j.endYear}` : ''}
                </li>
              ))}
            </ul>
          </>
        )}
      </Panel>

      {/* ===== Education ===== */}
      <Panel title="Education">
        {data.currentEnrollment ? (
          <p className="text-sm mb-2">
            Currently at {data.currentEnrollment.schoolName} (
            {data.currentEnrollment.level}) — since year{' '}
            {data.currentEnrollment.startYear}
          </p>
        ) : (
          <p className="text-sm mb-2">Not currently enrolled.</p>
        )}

        {data.pastEnrollments.length > 0 && (
          <>
            <h3 className="font-semibold text-sm mt-2 mb-1">Past schools</h3>
            <ul className="list-disc ml-6 text-sm space-y-0.5">
              {data.pastEnrollments.map((e) => (
                <li key={e.id}>
                  {e.schoolName} ({e.level}) — {e.startYear}
                  {e.endYear != null ? `–${e.endYear}` : ''}
                </li>
              ))}
            </ul>
          </>
        )}
      </Panel>

      {/* ===== Relationships ===== */}
      <Panel title="Relationships">
        {data.spouses.length === 0 ? (
          <p className="text-sm">No recorded marriages.</p>
        ) : (
          <ul className="list-disc ml-6 text-sm space-y-0.5">
            {data.spouses.map((s) => (
              <li key={s.marriageId}>
                <Link
                  href={`/person/${s.spouseId}`}
                  className="text-blue-600 hover:underline"
                >
                  {s.spouseName}
                </Link>{' '}
                — married {s.startYear}
                {s.endYear != null ? `–${s.endYear}` : ''}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </main>
  );
}
