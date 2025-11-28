'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

type StatBlock = {
  intelligence: number;
  wit: number;
  discipline: number;
  charisma: number;
  leadership: number;
  empathy: number;
  strength: number;
  athleticism: number;
  endurance: number;
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
          {data.name} {data.isPlayer && <span className="text-sm">(Player)</span>}
        </h1>
        <p>
          Age {data.age} {data.isAlive ? '' : '(deceased)'}
        </p>
        <p className="text-sm text-gray-600">
          World: {data.worldName}
          {data.countryName ? ` · Country: ${data.countryName}` : ''}
        </p>
        <p className="text-sm text-gray-600">Born in year {data.birthYear}</p>
      </header>

      <section>
        <h2 className="text-xl font-semibold mb-2">Attributes</h2>
        <ul className="list-disc ml-6 text-sm">
          <li>Intelligence: {stats.intelligence}</li>
          <li>Wit: {stats.wit}</li>
          <li>Discipline: {stats.discipline}</li>
          <li>Charisma: {stats.charisma}</li>
          <li>Leadership: {stats.leadership}</li>
          <li>Empathy: {stats.empathy}</li>
          <li>Strength: {stats.strength}</li>
          <li>Athleticism: {stats.athleticism}</li>
          <li>Endurance: {stats.endurance}</li>
        </ul>
      </section>

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
