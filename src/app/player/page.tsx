// src/app/player/page.tsx
'use client';

import { useEffect, useState } from 'react';

export default function PlayerCountryPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/player-country');
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

  if (loading) return <main className="p-4">Loading country…</main>;
  if (!data || (data as any).error) {
    return <main className="p-4">No controlled country found.</main>;
  }

  return (
    <main className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">{data.name}</h1>
      <p className="text-sm text-gray-600">World: {data.worldName}</p>

      <section>
        <h2 className="text-xl font-semibold">Overview</h2>
        <ul className="list-disc ml-6 text-sm">
          <li>Population: {data.population}</li>
          <li>Companies: {data.companies}</li>
          <li>Schools: {data.schools}</li>
          <li>Employed: {data.employed}</li>
          <li>Unemployed: {data.unemployed}</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold">Offices</h2>
        {data.offices.length === 0 ? (
          <p className="text-sm text-gray-600">No offices defined.</p>
        ) : (
          <ul className="list-disc ml-6 text-sm">
            {data.offices.map((o: any) => (
              <li key={o.id}>
                {o.name} —{' '}
                {o.currentHolder ? `Current holder: ${o.currentHolder}` : 'Vacant'}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Later: policy sliders, budgets, etc. */}
    </main>
  );
}
