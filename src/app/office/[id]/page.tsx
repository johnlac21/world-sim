'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

type OfficeTerm = {
  id: number;
  personId: number;
  personName: string;
  startYear: number;
  endYear: number | null;
};

type OfficePayload = {
  id: number;
  name: string;
  level: string;
  termLength: number;
  prestige: number;
  worldId: number;
  worldName: string;
  countryId: number | null;
  countryName: string | null;
  terms: OfficeTerm[];
};

export default function OfficePage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [data, setData] = useState<OfficePayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        const res = await fetch(`/api/office/${id}`);
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
    return <main className="p-4">Loading office…</main>;
  }

  if (!data || (data as any).error) {
    return (
      <main className="p-4 space-y-2">
        <p>Office not found.</p>
        <Link href="/leaders" className="text-blue-600 underline">
          ← Back to leaders
        </Link>
      </main>
    );
  }

  return (
    <main className="p-4 space-y-6">
      <header className="space-y-1">
        <div className="flex gap-4 text-sm">
          <Link href="/" className="text-blue-600 underline">
            ← World
          </Link>
          <Link href="/leaders" className="text-blue-600 underline">
            ← Leaders
          </Link>
        </div>
        <h1 className="text-2xl font-bold">{data.name}</h1>
        <p className="text-sm text-gray-600">
          World: {data.worldName}
          {data.countryName ? ` · Country: ${data.countryName}` : ''}
        </p>
        <p className="text-sm text-gray-600">
          Level: {data.level} · Term length: {data.termLength} years ·
          Prestige: {data.prestige}
        </p>
      </header>

      <section>
        <h2 className="text-xl font-semibold mb-2">Term history</h2>
        {data.terms.length === 0 ? (
          <p className="text-sm text-gray-600">No terms recorded yet.</p>
        ) : (
          <ul className="list-disc ml-6 text-sm space-y-1">
            {data.terms.map((t) => (
              <li key={t.id}>
                {t.personName} — {t.startYear}
                {t.endYear != null ? `–${t.endYear}` : '–present'}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
