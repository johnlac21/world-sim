'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

type CountryOffice = {
  id: number;
  name: string;
  level: string;
  termLength: number;
  prestige: number;
  currentTerm: {
    id: number;
    personId: number;
    personName: string;
    startYear: number;
  } | null;
  pastTerms: {
    id: number;
    personId: number;
    personName: string;
    startYear: number;
    endYear: number | null;
  }[];
};

type CountryPayload = {
  id: number;
  name: string;
  worldId: number;
  worldName: string;
  offices: CountryOffice[];
};

export default function CountryPage() {
  const params = useParams<{ id: string }>();
  const id = params.id; // 👈 this is "62" etc

  const [data, setData] = useState<CountryPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!id) return; // defensive

      try {
        const res = await fetch(`/api/country/${id}`);
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
    return <main className="p-4">Loading country…</main>;
  }

  if (!data || (data as any).error) {
    return (
      <main className="p-4 space-y-2">
        <p>Country not found.</p>
        <Link href="/" className="text-blue-600 underline">
          ← Back to world
        </Link>
      </main>
    );
  }

  return (
    <main className="p-4 space-y-6">
      <header className="space-y-1">
        <Link href="/" className="text-blue-600 underline">
          ← Back to world
        </Link>
        <h1 className="text-2xl font-bold">
          {data.name} — Political History
        </h1>
        <p className="text-sm text-gray-600">
          World: {data.worldName}
        </p>
      </header>

      {data.offices.length === 0 ? (
        <p>No political offices defined for this country.</p>
      ) : (
        data.offices.map((office) => (
          <section key={office.id} className="space-y-2">
            <h2 className="text-xl font-semibold">{office.name}</h2>
            <p className="text-sm text-gray-600">
              Level: {office.level} · Term length: {office.termLength} years ·
              Prestige: {office.prestige}
            </p>

            <div className="mt-2">
              <h3 className="font-semibold">Current office holder</h3>
              {office.currentTerm ? (
                <p>
                  {office.currentTerm.personName} (since year{' '}
                  {office.currentTerm.startYear})
                </p>
              ) : (
                <p>No current office holder.</p>
              )}
            </div>

            <div className="mt-3">
              <h3 className="font-semibold">Past terms</h3>
              {office.pastTerms.length === 0 ? (
                <p className="text-sm text-gray-600">No past terms yet.</p>
              ) : (
                <ul className="list-disc ml-6 text-sm">
                  {office.pastTerms.map((t) => (
                    <li key={t.id}>
                      {t.personName} — {t.startYear}
                      {t.endYear != null ? `–${t.endYear}` : ''}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        ))
      )}
    </main>
  );
}
