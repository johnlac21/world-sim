'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type OfficeTerm = {
  id: number;
  personId: number;
  personName: string;
  startYear: number;
  endYear: number | null;
};

type OfficeSummary = {
  id: number;
  name: string;
  level: string;
  termLength: number;
  prestige: number;
  countryName: string | null;
  terms: OfficeTerm[];
};

type LeadersPayload = {
  worldId: number;
  worldName: string;
  offices: OfficeSummary[];
};

export default function LeadersPage() {
  const [data, setData] = useState<LeadersPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/offices/world');
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return <main className="p-4">Loading global leaders…</main>;
  }

  if (!data || (data as any).error) {
    return (
      <main className="p-4 space-y-2">
        <p>Could not load leaders.</p>
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
          Global Leaders — {data.worldName}
        </h1>
        <p className="text-sm text-gray-600">
          World-level offices and their full term history.
        </p>
      </header>

      {data.offices.length === 0 ? (
        <p>No world-level offices defined yet.</p>
      ) : (
        data.offices.map((office) => (
          <section key={office.id} className="space-y-2 border-b pb-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-xl font-semibold">{office.name}</h2>
                <p className="text-sm text-gray-600">
                  Level: {office.level} · Term length: {office.termLength} years
                  · Prestige: {office.prestige}
                  {office.countryName ? ` · Country: ${office.countryName}` : ''}
                </p>
              </div>
              <Link
                href={`/office/${office.id}`}
                className="text-sm text-blue-600 underline"
              >
                View office history →
              </Link>
            </div>

            <div>
              <h3 className="font-semibold text-sm">Recent terms</h3>
              {office.terms.length === 0 ? (
                <p className="text-sm text-gray-600">No terms yet.</p>
              ) : (
                <ul className="list-disc ml-6 text-sm">
                  {office.terms.slice(0, 5).map((t) => (
                    <li key={t.id}>
                      {t.personName} — {t.startYear}
                      {t.endYear != null ? `–${t.endYear}` : '–present'}
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
