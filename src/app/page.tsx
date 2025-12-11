'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import { SectionHeader } from '@/components/ui/SectionHeader';
import { Panel } from '@/components/ui/Panel';

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
    if (!confirm('Reset world? This will delete and regenerate everything.')) {
      return;
    }

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

  if (loading && !world) {
    return <main className="px-3 py-4 md:px-4">Loading world…</main>;
  }
  if (!world) {
    return <main className="px-3 py-4 md:px-4">No world found.</main>;
  }

  const countries = world.countries ?? [];
  const samplePeople = world.samplePeople ?? [];

  return (
    <main className="px-3 py-4 md:px-4 md:py-6 space-y-6">
      <SectionHeader
        title={world.name}
        eyebrow="World overview"
        description={`Year ${world.currentYear} · Countries: ${
          world.countriesCount ?? countries.length
        } · Total people: ${world.peopleCount}`}
        actions={
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={handleSimYear}
              disabled={simulating}
              className="px-3 py-1.5 rounded border border-gray-300 bg-white text-xs font-medium hover:bg-gray-50 disabled:opacity-50"
            >
              {simulating ? 'Simulating…' : 'Sim 1 Year'}
            </button>
            <button
              onClick={handleResetWorld}
              disabled={resetting}
              className="px-3 py-1.5 rounded border border-red-200 bg-red-50 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
            >
              {resetting ? 'Resetting…' : 'Reset World'}
            </button>
          </div>
        }
      >
        <div className="mt-2 text-sm space-x-3">
          <Link href="/player" className="text-blue-600 underline">
            View player →
          </Link>
          <Link href="/leaders" className="text-blue-600 underline">
            View global leaders →
          </Link>
          {world.id && (
            <Link
              href={`/world/${world.id}/standings`}
              className="text-blue-600 underline"
            >
              View national standings →
            </Link>
          )}
        </div>
      </SectionHeader>

      <div className="grid gap-4 md:grid-cols-2">
        <Panel title="Countries">
          {countries.length === 0 ? (
            <p className="text-sm text-gray-600">
              No countries in this world yet.
            </p>
          ) : (
            <ul className="list-disc ml-5 text-sm space-y-0.5">
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
          )}
        </Panel>

        <Panel title="People (sample)">
          {samplePeople.length === 0 ? (
            <p className="text-sm text-gray-600">
              No sample people loaded yet.
            </p>
          ) : (
            <ul className="list-disc ml-5 text-sm space-y-0.5">
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
          )}
        </Panel>
      </div>
    </main>
  );
}
