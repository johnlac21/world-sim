// src/app/player/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { TalentSearchModal } from '@/components/TalentSearchModal';

type IndustryRow = {
  industry: string;
  numCompanies: number;
  totalOutput: number;
  averageOutput: number | null;
};

type TopCompanyRow = {
  companyId: number;
  name: string;
  industry: string;
  outputScore: number;
};

type CountryPerformanceSummary = {
  countryId: number;
  year: number;
  overall: {
    numCompanies: number;
    totalOutput: number;
    averageOutput: number | null;
  };
  industries: IndustryRow[];
  topCompanies: TopCompanyRow[];
};

type GovernmentOfficeRow = {
  id: number;
  name: string;
  prestige: number;
  holderId: number | null;
  holderName: string | null;
  fitScore: number | null; // 0–100 if holder exists
  termYearsRemaining: number | null; // null if unknown
};

type PlayerCountryPayload = {
  name: string;
  worldName: string;
  population: number;
  companies: number;
  schools: number;
  employed: number;
  unemployed: number;
  offices: GovernmentOfficeRow[];
  // New: optional performance summary
  performance?: CountryPerformanceSummary | null;
  // NEW: ids so we can scope Talent Search
  worldId?: number;
  countryId?: number;
};

type OfficeCandidate = {
  id: number;
  name: string;
  age: number;
  fitScore: number | null;
  currentOfficeName: string | null;
  isCurrentHolder: boolean;
};

export default function PlayerCountryPage() {
  const [data, setData] = useState<PlayerCountryPayload | null>(null);
  const [loading, setLoading] = useState(true);

  // office reassignment modal state
  const [selectedOffice, setSelectedOffice] =
    useState<GovernmentOfficeRow | null>(null);
  const [candidates, setCandidates] = useState<OfficeCandidate[] | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [appointing, setAppointing] = useState(false);

  // Talent Search modal state
  const [showTalentSearch, setShowTalentSearch] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/player-country');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <main className="p-4">Loading country…</main>;
  if (!data || (data as any).error) {
    return <main className="p-4">No controlled country found.</main>;
  }

  const perf = data.performance ?? null;

  const formatFitScore = (score: number | null) =>
    score == null ? '—' : `${Math.round(score)}/100`;

  const formatTermRemaining = (termYearsRemaining: number | null) => {
    if (termYearsRemaining == null) return '—';
    if (termYearsRemaining <= 0) return 'Term ending';
    if (termYearsRemaining === 1) return '1 year left';
    return `${termYearsRemaining} years left`;
  };

  const openReassignModal = async (office: GovernmentOfficeRow) => {
    setSelectedOffice(office);
    setModalError(null);
    setCandidates(null);
    setModalLoading(true);

    try {
      const res = await fetch(`/api/player/offices/${office.id}/candidates`);
      const json = await res.json();
      if (!res.ok || json.error) {
        setModalError(json.error || 'Failed to load candidates');
        setCandidates([]);
      } else {
        setCandidates(json.candidates as OfficeCandidate[]);
      }
    } catch (err) {
      console.error(err);
      setModalError('Failed to load candidates');
      setCandidates([]);
    } finally {
      setModalLoading(false);
    }
  };

  const closeReassignModal = () => {
    setSelectedOffice(null);
    setCandidates(null);
    setModalError(null);
    setModalLoading(false);
    setAppointing(false);
  };

  const handleAppoint = async (candidateId: number) => {
    if (!selectedOffice) return;

    setAppointing(true);
    setModalError(null);

    try {
      const res = await fetch(
        `/api/player/offices/${selectedOffice.id}/appoint`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ personId: candidateId }),
        },
      );

      const json = await res.json();
      if (!res.ok || json.error) {
        setModalError(json.error || 'Failed to appoint officeholder');
        setAppointing(false);
        return;
      }

      // Refresh player-country data so the government card updates
      await load();
      closeReassignModal();
    } catch (err) {
      console.error(err);
      setModalError('Failed to appoint officeholder');
      setAppointing(false);
    }
  };

  return (
    <main className="p-4 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">{data.name}</h1>
        <p className="text-sm text-gray-600">World: {data.worldName}</p>

        <nav className="mt-2 flex items-center gap-3 text-sm">
          <span className="px-2 py-1 rounded bg-blue-600 text-white">
            Overview
          </span>
          <Link
            href="/player/youth"
            className="px-2 py-1 rounded border border-gray-300 bg-gray-50 hover:bg-gray-100"
          >
            Youth Pipeline
          </Link>
        </nav>
      </header>


      {/* Basic overview */}
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

      {/* Talent & Scouting entry point */}
      <section className="border rounded-lg p-4 bg-white shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Talent &amp; Scouting</h2>
          <p className="text-sm text-gray-600">
            Search your population (and beyond) by age, stats, and industry
            experience to find candidates for offices and company roles.
          </p>
        </div>
        <button
          className="px-3 py-1.5 rounded border border-blue-600 text-sm text-blue-700 bg-blue-50 hover:bg-blue-100 disabled:opacity-50"
          onClick={() => setShowTalentSearch(true)}
          disabled={!data.worldId}
        >
          Open Talent Search
        </button>
      </section>

      {/* Government overview card */}
      <section className="border rounded-lg p-4 bg-white shadow-sm space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl font-semibold">Government</h2>
          <span className="text-xs text-gray-500">
            Key offices &amp; leadership quality
          </span>
        </div>

        {data.offices.length === 0 ? (
          <p className="text-sm text-gray-600">
            No government offices defined for this country yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border border-gray-200">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-2 py-1 text-left border-b">Office</th>
                  <th className="px-2 py-1 text-left border-b">Holder</th>
                  <th className="px-2 py-1 text-right border-b">Fit</th>
                  <th className="px-2 py-1 text-right border-b">Term</th>
                  <th className="px-2 py-1 text-right border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.offices.map((o) => (
                  <tr
                    key={o.id}
                    className="odd:bg-white even:bg-gray-50 border-b last:border-0"
                  >
                    <td className="px-2 py-1 align-top">
                      <Link
                        href={`/office/${o.id}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {o.name}
                      </Link>
                      {o.prestige > 0 && (
                        <span className="ml-1 text-xs text-gray-400">
                          (Prestige {o.prestige})
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-1 align-top">
                      {o.holderId && o.holderName ? (
                        <Link
                          href={`/person/${o.holderId}`}
                          className="text-blue-600 hover:underline"
                        >
                          {o.holderName}
                        </Link>
                      ) : (
                        <span className="text-gray-400">Vacant</span>
                      )}
                    </td>
                    <td className="px-2 py-1 text-right align-top text-xs">
                      {formatFitScore(o.fitScore)}
                    </td>
                    <td className="px-2 py-1 text-right align-top text-xs text-gray-600">
                      {formatTermRemaining(o.termYearsRemaining)}
                    </td>
                    <td className="px-2 py-1 text-right align-top text-xs">
                      <button
                        className="px-2 py-1 border rounded text-xs bg-blue-50 hover:bg-blue-100 text-blue-700"
                        onClick={() => openReassignModal(o)}
                      >
                        Reassign
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Country performance panel */}
      <section className="border rounded-lg p-4 bg-white shadow-sm space-y-4">
        <h2 className="text-xl font-semibold">Country Performance</h2>

        {!perf || perf.overall.numCompanies === 0 ? (
          <p className="text-sm text-gray-600">
            No performance data yet for this country — simulate a year to see
            results.
          </p>
        ) : (
          <>
            {/* Overall summary */}
            <div className="space-y-1">
              <p className="text-sm font-medium">
                Year {perf.year} performance:
                <span className="ml-1 text-base font-semibold">
                  {perf.overall.totalOutput.toFixed(1)}
                </span>
              </p>
              <p className="text-xs text-gray-600">
                Companies with performance:{' '}
                <span className="font-medium">
                  {perf.overall.numCompanies}
                </span>{' '}
                · Average output per company:{' '}
                <span className="font-medium">
                  {perf.overall.averageOutput === null
                    ? '—'
                    : perf.overall.averageOutput.toFixed(1)}
                </span>
              </p>
            </div>

            {/* Per-industry table */}
            <div className="pt-2">
              <h3 className="text-sm font-medium mb-2">
                Performance by industry
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs border border-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 py-1 text-left border-b">
                        Industry
                      </th>
                      <th className="px-2 py-1 text-right border-b">
                        Companies
                      </th>
                      <th className="px-2 py-1 text-right border-b">
                        Total Output
                      </th>
                      <th className="px-2 py-1 text-right border-b">
                        Avg Output
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {perf.industries.map((ind) => (
                      <tr
                        key={ind.industry}
                        className="odd:bg-white even:bg-gray-50"
                      >
                        <td className="px-2 py-1 border-b">
                          {ind.industry}
                        </td>
                        <td className="px-2 py-1 text-right border-b">
                          {ind.numCompanies}
                        </td>
                        <td className="px-2 py-1 text-right border-b">
                          {ind.totalOutput.toFixed(1)}
                        </td>
                        <td className="px-2 py-1 text-right border-b">
                          {ind.averageOutput === null
                            ? '—'
                            : ind.averageOutput.toFixed(1)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top companies list */}
            <div className="pt-2">
              <h3 className="text-sm font-medium mb-2">Top companies</h3>
              {perf.topCompanies.length === 0 ? (
                <p className="text-xs text-gray-600">
                  No companies with performance this year.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs border border-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-2 py-1 text-left border-b">
                          Company
                        </th>
                        <th className="px-2 py-1 text-left border-b">
                          Industry
                        </th>
                        <th className="px-2 py-1 text-right border-b">
                          Output
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {perf.topCompanies.map((c) => (
                        <tr
                          key={c.companyId}
                          className="odd:bg-white even:bg-gray-50"
                        >
                          <td className="px-2 py-1 border-b">
                            <Link
                              href={`/company/${c.companyId}`}
                              className="text-blue-600 hover:underline"
                            >
                              {c.name}
                            </Link>
                          </td>
                          <td className="px-2 py-1 border-b">{c.industry}</td>
                          <td className="px-2 py-1 text-right border-b">
                            {c.outputScore.toFixed(1)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </section>

      {/* Reassign Office Modal */}
      {selectedOffice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-4 space-y-3">
            <div className="flex items-baseline justify-between">
              <h3 className="text-lg font-semibold">
                Reassign {selectedOffice.name}
              </h3>
              <button
                className="text-xs text-gray-500 hover:text-gray-800"
                onClick={closeReassignModal}
              >
                Close
              </button>
            </div>

            {modalError && (
              <p className="text-xs text-red-600">{modalError}</p>
            )}

            {modalLoading && (
              <p className="text-sm text-gray-600">Loading candidates…</p>
            )}

            {!modalLoading && candidates && candidates.length === 0 && (
              <p className="text-sm text-gray-600">
                No eligible candidates available for this office.
              </p>
            )}

            {!modalLoading && candidates && candidates.length > 0 && (
              <div className="max-h-64 overflow-y-auto border rounded">
                <table className="min-w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 py-1 text-left border-b">Name</th>
                      <th className="px-2 py-1 text-right border-b">Age</th>
                      <th className="px-2 py-1 text-right border-b">Fit</th>
                      <th className="px-2 py-1 text-right border-b">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {candidates.map((c) => (
                      <tr
                        key={c.id}
                        className="odd:bg-white even:bg-gray-50 border-b last:border-0"
                      >
                        <td className="px-2 py-1">
                          {c.name}
                          {c.isCurrentHolder && (
                            <span className="ml-1 text-[10px] text-gray-400">
                              (current)
                            </span>
                          )}
                        </td>
                        <td className="px-2 py-1 text-right">{c.age}</td>
                        <td className="px-2 py-1 text-right">
                          {c.fitScore == null
                            ? '—'
                            : `${Math.round(c.fitScore)}/100`}
                        </td>
                        <td className="px-2 py-1 text-right">
                          <button
                            className="px-2 py-1 border rounded text-[11px] bg-blue-50 hover:bg-blue-100 text-blue-700 disabled:opacity-50"
                            disabled={appointing}
                            onClick={() => handleAppoint(c.id)}
                          >
                            {appointing ? 'Appointing…' : 'Appoint'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <p className="text-[11px] text-gray-500">
              Manual appointments are treated as player overrides and will not
              be replaced by auto elections while active.
            </p>
          </div>
        </div>
      )}

      {/* Talent Search Modal (global scouting) */}
      {data.worldId && (
        <TalentSearchModal
          worldId={data.worldId}
          defaultCountryId={data.countryId}
          isOpen={showTalentSearch}
          onClose={() => setShowTalentSearch(false)}
          onSelectPerson={(person) => {
            // For now, just open their profile in a new tab
            window.open(`/person/${person.id}`, '_blank');
          }}
          selectLabel="View profile"
        />
      )}

      {/* Later: policy sliders, budgets, etc. */}
    </main>
  );
}
