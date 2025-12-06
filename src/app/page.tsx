// src/app/page.tsx (or wherever HomePage lives)
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function HomePage() {
  const [world, setWorld] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [resetting, setResetting] = useState(false);

  const loadWorld = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/world');
      const data = await res.json();
      setWorld(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorld();
  }, []);

  const handleSimYear = async () => {
    setSimulating(true);
    try {
      await fetch('/api/sim/year', { method: 'POST' });
      await loadWorld();
    } catch (err) {
      console.error(err);
    } finally {
      setSimulating(false);
    }
  };

  const handleResetWorld = async () => {
    if (!confirm('Reset world? This will delete and regenerate everything.')) return;

    setResetting(true);
    try {
      await fetch('/api/world/reset', { method: 'POST' });
      await loadWorld();
    } catch (err) {
      console.error(err);
    } finally {
      setResetting(false);
    }
  };

  if (loading && !world) return <div className="p-4">Loading world…</div>;
  if (!world) return <div className="p-4">No world found.</div>;

  const countries = world.countries ?? [];
  const samplePeople = world.samplePeople ?? [];

  return (
    <main className="p-4 space-y-4">
      <div className="flex items-start gap-6">
        <div>
          <h1 className="text-2xl font-bold">{world.name}</h1>
          <p>Year: {world.currentYear}</p>

          {/* Summary counts coming from /api/world */}
          <p>Countries: {world.countriesCount ?? countries.length}</p>
          <p>Total people: {world.peopleCount}</p>
          <p>Sample people loaded: {samplePeople.length}</p>

          <div className="mt-3 space-y-1 text-sm">
            <p>
              <Link href="/player" className="text-blue-600 underline">
                View player →
              </Link>
            </p>
            <p>
              <Link href="/leaders" className="text-blue-600 underline">
                View global leaders →
              </Link>
            </p>
            <p>
              {world.id && (
                <Link
                  href={`/world/${world.id}/standings`}
                  className="text-blue-600 underline"
                >
                  View national standings →
                </Link>
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={handleSimYear}
            disabled={simulating}
            className="px-4 py-2 border rounded hover:bg-gray-100 disabled:opacity-50"
          >
            {simulating ? 'Simulating…' : 'Sim 1 Year'}
          </button>

          <button
            onClick={handleResetWorld}
            disabled={resetting}
            className="px-4 py-2 border rounded hover:bg-red-50 disabled:opacity-50"
          >
            {resetting ? 'Resetting…' : 'Reset World'}
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold">Countries</h2>
        <ul className="list-disc ml-5">
          {countries.map((c: any) => (
            <li key={c.id}>
              <Link
                href={`/country/${c.id}`}
                className="text-blue-600 underline"
              >
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h2 className="text-xl font-semibold">People (sample)</h2>
        <ul className="list-disc ml-5">
          {samplePeople.map((p: any) => (
            <li key={p.id}>
              <Link
                href={`/person/${p.id}`}
                className="text-blue-600 underline"
              >
                {p.name}
              </Link>{' '}
              — age {p.age} — countryId {p.countryId}
              {!p.isAlive && ' (dead)'}
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
