'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import { SectionHeader } from '@/components/ui/SectionHeader';
import { Panel } from '@/components/ui/Panel';

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
    return <main className="px-3 py-4 md:px-4">Loading global leaders…</main>;
  }

  if (!data || (data as any).error) {
    return (
      <main className="px-3 py-4 md:px-4 space-y-2">
        <p>Could not load leaders.</p>
        <Link href="/" className="text-blue-600 underline">
          ← Back to world
        </Link>
      </main>
    );
  }

  return (
    <main className="px-3 py-4 md:px-4 md:py-6 space-y-6">
      <SectionHeader
        title="Global Leaders"
        eyebrow="World overview"
        description={`World: ${data.worldName}`}
        backHref="/"
        backLabel="Back to world"
      >
        <p className="mt-1 text-sm text-gray-600">
          World-level offices and their recent term history.
        </p>
      </SectionHeader>

      {data.offices.length === 0 ? (
        <Panel title="Offices">
          <p className="text-sm text-gray-600">
            No world-level offices defined yet.
          </p>
        </Panel>
      ) : (
        <div className="space-y-4">
          {data.offices.map((office) => (
            <Panel
              key={office.id}
              title={office.name}
              subtitle={`Level: ${office.level} · Term length: ${office.termLength} years · Prestige: ${office.prestige}${
                office.countryName ? ` · Country: ${office.countryName}` : ''
              }`}
              actions={
                <Link
                  href={`/office/${office.id}`}
                  className="text-xs text-blue-600 hover:underline"
                >
                  View office history →
                </Link>
              }
            >
              <div>
                <h3 className="font-semibold text-sm mb-1">Recent terms</h3>
                {office.terms.length === 0 ? (
                  <p className="text-sm text-gray-600">No terms yet.</p>
                ) : (
                  <ul className="list-disc ml-6 text-sm space-y-0.5">
                    {office.terms.slice(0, 5).map((t) => (
                      <li key={t.id}>
                        {t.personName} — {t.startYear}
                        {t.endYear != null ? `–${t.endYear}` : '–present'}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Panel>
          ))}
        </div>
      )}
    </main>
  );
}
