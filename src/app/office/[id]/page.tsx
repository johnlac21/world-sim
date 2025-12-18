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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/office/${id}`);
        const json = (await res.json()) as OfficePayload & { error?: string };

        if (!res.ok || (json as any).error) {
          throw new Error((json as any).error || `Request failed (${res.status})`);
        }

        if (!cancelled) {
          setData(json);
        }
      } catch (err: any) {
        console.error(err);
        if (!cancelled) {
          setError(err?.message ?? 'Failed to load office');
          setData(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return <main className="p-4">Loading office…</main>;
  }

  if (error || !data) {
    return (
      <main className="p-4 space-y-3">
        <p className="text-sm text-red-600">
          {error ?? 'Office not found.'}
        </p>
        <div className="flex gap-4 text-sm">
          <Link href="/" className="text-blue-600 underline">
            ← Back to world
          </Link>
          <Link href="/leaders" className="text-blue-600 underline">
            ← Back to leaders
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="p-4 space-y-6">
      {/* HEADER */}
      <header className="space-y-2">
        <div className="flex gap-4 text-sm">
          <Link href="/" className="text-blue-600 underline">
            ← World
          </Link>
          <Link href="/leaders" className="text-blue-600 underline">
            ← Leaders
          </Link>
        </div>

        <div>
          <h1 className="text-2xl font-bold">{data.name}</h1>
          <p className="text-sm text-gray-600">
            World: {data.worldName}
            {data.countryName ? ` · Country: ${data.countryName}` : ''}
          </p>
          <p className="text-sm text-gray-600">
            Level: {data.level} · Term length: {data.termLength} years · Prestige:{' '}
            {data.prestige}
          </p>
        </div>
      </header>

      {/* TERM HISTORY */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Term history</h2>

        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          {data.terms.length === 0 ? (
            <p className="p-4 text-sm text-gray-600">No terms recorded yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100 text-sm">
              {data.terms.map((t) => (
                <li key={t.id} className="px-4 py-2.5 flex items-baseline justify-between gap-3">
                  <div>
                    <Link
                      href={`/person/${t.personId}`}
                      className="font-medium text-blue-700 hover:underline"
                    >
                      {t.personName}
                    </Link>
                    <span className="ml-2 text-xs text-gray-500">
                      {t.startYear}
                      {t.endYear != null ? `–${t.endYear}` : '–present'}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}
