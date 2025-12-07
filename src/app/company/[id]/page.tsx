'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

type HierarchyPerson = {
  id: number;
  name: string;
  age: number;
  countryId: number | null;
  intelligence: number;
  leadership: number;
  discipline: number;
  charisma: number;
};

type HierarchyRole = {
  roleId: number;
  roleName: string;
  rank: number;
  occupied: boolean;
  locked: boolean;
  person: HierarchyPerson | null;
};

type CompanyInfo = {
  id: number;
  name: string;
  industry: string;
  countryId: number;
  worldId: number;
};

type LatestPerformance = {
  year: number;
  talentScore: number;
  leadershipScore: number;
  reliabilityScore: number;
  outputScore: number;
} | null;

type PerformanceRow = {
  year: number;
  talentScore: number;
  leadershipScore: number;
  reliabilityScore: number;
  outputScore: number;
};

type IndustryBenchmark = {
  year: number | null;
  companyOutput: number | null;
  industryAverage: number | null;
  industryRank: number | null;
  totalCompanies: number;
};

type IndustryPeer = {
  companyId: number;
  companyName: string;
  countryId: number;
  countryName: string;
  outputScore: number;
  rank: number;
  isThisCompany: boolean;
};

// Candidate from /api/player/companies/[companyId]/positions/[roleId]/candidates
type PositionCandidate = {
  id: number;
  name: string;
  age: number;
  currentRoleName: string | null;
  currentRoleRank: number | null;
  isCurrentOccupant: boolean;
  roleFitScore: number;
};

type CompanyHierarchyPayload = {
  company: CompanyInfo;
  hierarchy: HierarchyRole[];
  latestPerformance: LatestPerformance;
  performanceHistory: PerformanceRow[];
  industryBenchmark: IndustryBenchmark;
  industryPeers: IndustryPeer[];
  isEditable: boolean;
};

export default function CompanyPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [data, setData] = useState<CompanyHierarchyPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // edit-mode state
  const [editMode, setEditMode] = useState(false);
  const [candidatesByRole, setCandidatesByRole] = useState<
    Record<number, PositionCandidate[]>
  >({});
  const [roleLoading, setRoleLoading] = useState<Record<number, boolean>>({});
  const [savingRole, setSavingRole] = useState<Record<number, boolean>>({});
  const [uiMessage, setUiMessage] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/company/${id}/hierarchy`);

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(
            body.error || `Hierarchy request failed (${res.status})`,
          );
        }

        const json = (await res.json()) as CompanyHierarchyPayload;
        setData(json);
        setUiMessage(null);
        setEditMode(false);
        setCandidatesByRole({});
        setRoleLoading({});
        setSavingRole({});
      } catch (err: any) {
        console.error(err);
        setError(
          err?.message ??
            'Failed to load company hierarchy / performance',
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const setHierarchy = (updater: (h: HierarchyRole[]) => HierarchyRole[]) => {
    setData((prev) =>
      prev ? { ...prev, hierarchy: updater(prev.hierarchy) } : prev,
    );
  };

  const setRoleSavingFlag = (roleId: number, value: boolean) => {
    setSavingRole((prev) => ({ ...prev, [roleId]: value }));
  };

  const setRoleLoadingFlag = (roleId: number, value: boolean) => {
    setRoleLoading((prev) => ({ ...prev, [roleId]: value }));
  };

  const loadCandidatesForRole = async (roleId: number) => {
    if (!data) return;
    if (candidatesByRole[roleId]) return; // already loaded

    try {
      setRoleLoadingFlag(roleId, true);
      setUiMessage(null);

      const res = await fetch(
        `/api/player/companies/${data.company.id}/positions/${roleId}/candidates`,
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          body.error ||
            `Failed to load candidates (status ${res.status})`,
        );
      }

      const json = await res.json();
      const candidates = (json.candidates ?? []) as PositionCandidate[];

      setCandidatesByRole((prev) => ({
        ...prev,
        [roleId]: candidates,
      }));
    } catch (err: any) {
      console.error(err);
      setUiMessage(
        err?.message ?? 'Failed to load candidates for this role.',
      );
    } finally {
      setRoleLoadingFlag(roleId, false);
    }
  };

  const assignRole = async ({
    roleId,
    personId,
    locked,
  }: {
    roleId: number;
    personId: number | null;
    locked: boolean;
  }) => {
    if (!data) return;

    try {
      setRoleSavingFlag(roleId, true);
      setUiMessage(null);

      const res = await fetch(
        `/api/player/companies/${data.company.id}/positions/${roleId}/assign`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ personId, locked }),
        },
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          body.error ||
            `Failed to assign position (status ${res.status})`,
        );
      }

      // Update local hierarchy state
      setHierarchy((hierarchy) =>
        hierarchy.map((slot) => {
          if (slot.roleId !== roleId) return slot;

          if (personId === null) {
            return {
              ...slot,
              occupied: false,
              locked: false, // clearing slot also clears lock
              person: null,
            };
          }

          const candidates = candidatesByRole[roleId] ?? [];
          const chosen =
            candidates.find((c) => c.id === personId) ?? null;

          if (!chosen) {
            // fallback: keep same person ID but update locked flag
            return {
              ...slot,
              locked,
            };
          }

          return {
            ...slot,
            occupied: true,
            locked,
            person: {
              id: chosen.id,
              name: chosen.name,
              age: chosen.age,
              countryId: data.company.countryId,
              intelligence: slot.person?.intelligence ?? 0,
              leadership: slot.person?.leadership ?? 0,
              discipline: slot.person?.discipline ?? 0,
              charisma: slot.person?.charisma ?? 0,
            },
          };
        }),
      );
    } catch (err: any) {
      console.error(err);
      setUiMessage(
        err?.message ?? 'Failed to update company hierarchy slot.',
      );
    } finally {
      setRoleSavingFlag(roleId, false);
    }
  };

  if (loading) {
    return <main className="p-4">Loading company…</main>;
  }

  if (error || !data || (data as any).error) {
    return (
      <main className="p-4 space-y-2">
        <p>Company not found or failed to load.</p>
        <Link href="/" className="text-blue-600 underline">
          ← Back to world
        </Link>
      </main>
    );
  }

  const {
    company,
    hierarchy,
    latestPerformance,
    performanceHistory,
    industryBenchmark,
    industryPeers,
    isEditable,
  } = data;

  // For history chart
  const historyCount = performanceHistory.length;
  const hasHistoryTrend = historyCount >= 2;
  const outputs = performanceHistory
    .map((p) => p.outputScore)
    .filter((v) => Number.isFinite(v));

  const maxOutput = outputs.length > 0 ? Math.max(...outputs) : 0;

  const showBenchmark =
    industryBenchmark.year !== null &&
    industryBenchmark.companyOutput !== null &&
    industryBenchmark.industryAverage !== null &&
    industryBenchmark.totalCompanies > 0;

  const hasPeers = industryPeers.length > 0;
  const peersYear = latestPerformance?.year ?? industryBenchmark.year ?? null;

  return (
    <main className="flex flex-col md:flex-row">
      {/* MAIN CONTENT */}
      <section className="flex-1 p-4 space-y-6 md:p-6">
        <header className="space-y-1">
          <Link href="/" className="text-blue-600 underline">
            ← Back to world
          </Link>
          <h1 className="text-2xl font-bold">{company.name}</h1>
          <p className="text-sm text-gray-600">
            Industry:{' '}
            <span className="font-medium">{company.industry}</span>
          </p>
        </header>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Company Overview</h2>
          <p className="text-sm text-gray-600">
            This page shows the company&apos;s current leadership hierarchy
            in the sidebar and its simulated yearly performance below.
          </p>
        </section>

        {/* PERFORMANCE (CURRENT YEAR) PANEL */}
        <section className="border border-gray-200 rounded-lg bg-gray-50 p-4 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold">Performance (Current Year)</h2>

          {latestPerformance === null ? (
            <p className="text-sm text-gray-600">
              No performance data yet — simulate a year to generate company
              output.
            </p>
          ) : (
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium">
                  Performance — Year {latestPerformance.year}
                </p>
                <p className="mt-1 text-sm">
                  Output Score:{' '}
                  <span className="font-semibold">
                    {latestPerformance.outputScore.toFixed(1)}
                  </span>
                </p>
              </div>

              <div className="text-sm text-gray-700 space-y-1">
                <p className="font-medium">Breakdown:</p>
                <p>
                  Talent:{' '}
                  <span className="font-mono">
                    {latestPerformance.talentScore.toFixed(1)}
                  </span>
                </p>
                <p>
                  Leadership:{' '}
                  <span className="font-mono">
                    {latestPerformance.leadershipScore.toFixed(1)}
                  </span>
                </p>
                <p>
                  Reliability:{' '}
                  <span className="font-mono">
                    {latestPerformance.reliabilityScore.toFixed(1)}
                  </span>
                </p>
              </div>
            </div>
          )}

          {/* View in standings */}
          <div className="pt-2 border-t border-gray-200 mt-2">
            <Link
              href={`/world/${company.worldId}/standings`}
              className="text-sm text-blue-600 hover:underline"
            >
              View Country &amp; World Rankings →
            </Link>
          </div>
        </section>

        {/* INDUSTRY BENCHMARK PANEL */}
        <section className="border border-gray-200 rounded-lg bg-gray-50 p-4 shadow-sm space-y-3">
          <h2 className="text-lg font-semibold">Industry Benchmark</h2>

          {!showBenchmark ? (
            <p className="text-sm text-gray-600">
              No benchmark data yet — simulate a year to compare this company
              to its industry.
            </p>
          ) : (
            <div className="space-y-2 text-sm text-gray-700">
              <p className="font-medium">
                Year {industryBenchmark.year} — {company.industry}
              </p>
              <p>
                This company:{' '}
                <span className="font-mono font-semibold">
                  {industryBenchmark.companyOutput!.toFixed(1)}
                </span>
              </p>
              <p>
                Industry average:{' '}
                <span className="font-mono">
                  {industryBenchmark.industryAverage!.toFixed(1)}
                </span>
              </p>
              {industryBenchmark.industryRank && (
                <p className="text-xs text-gray-600">
                  Rank {industryBenchmark.industryRank} of{' '}
                  {industryBenchmark.totalCompanies} companies in this
                  industry.
                </p>
              )}
            </div>
          )}
        </section>

        {/* INDUSTRY PEERS PANEL */}
        <section className="border border-gray-200 rounded-lg bg-gray-50 p-4 shadow-sm space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-semibold">Industry Peers</h2>
            {hasPeers && peersYear !== null && (
              <p className="text-xs text-gray-500">
                Year {peersYear} — {industryPeers.length} companies
              </p>
            )}
          </div>

          {!hasPeers ? (
            <p className="text-sm text-gray-600">
              No peer data yet — simulate a year to see other companies in
              this industry.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead className="border-b border-gray-200 text-gray-500">
                  <tr>
                    <th className="py-1 pr-3 text-left">Rank</th>
                    <th className="py-1 pr-3 text-left">Company</th>
                    <th className="py-1 pr-3 text-left">Country</th>
                    <th className="py-1 text-right">Output</th>
                  </tr>
                </thead>
                <tbody>
                  {industryPeers.map((peer) => {
                    const isSelf = peer.isThisCompany;
                    return (
                      <tr
                        key={peer.companyId}
                        className={
                          'border-b border-gray-100' +
                          (isSelf ? ' bg-blue-50/70 font-medium' : '')
                        }
                      >
                        <td className="py-1 pr-3">{peer.rank}</td>
                        <td className="py-1 pr-3">
                          {peer.companyName}
                          {isSelf && (
                            <span className="ml-1 text-[10px] text-blue-600">
                              (you)
                            </span>
                          )}
                        </td>
                        <td className="py-1 pr-3 text-gray-700">
                          {peer.countryName}
                        </td>
                        <td className="py-1 text-right font-mono">
                          {peer.outputScore.toFixed(1)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* PERFORMANCE HISTORY PANEL */}
        <section className="border border-gray-200 rounded-lg bg-gray-50 p-4 shadow-sm space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-semibold">Performance History</h2>
            {historyCount > 0 && (
              <p className="text-xs text-gray-500">
                Last {historyCount} year{historyCount === 1 ? '' : 's'}
              </p>
            )}
          </div>

          {historyCount === 0 || !hasHistoryTrend ? (
            <p className="text-sm text-gray-600">
              Not enough history yet — simulate more years to see a
              performance trend.
            </p>
          ) : (
            <div className="mt-1">
              {/* fixed chart height in px */}
              <div className="flex items-end gap-2" style={{ height: 120 }}>
                {performanceHistory.map((row) => {
                  const rawOutput = Number.isFinite(row.outputScore)
                    ? row.outputScore
                    : 0;

                  const max = maxOutput > 0 ? maxOutput : rawOutput || 1;
                  let barHeight = Math.round((rawOutput / max) * 110); // <=110px

                  if (barHeight > 0 && barHeight < 8) barHeight = 8;
                  if (barHeight < 0) barHeight = 0;

                  return (
                    <div
                      key={row.year}
                      className="flex flex-col items-center flex-1"
                    >
                      <div
                        className="w-3 rounded-t bg-blue-500"
                        style={{ height: barHeight }}
                        aria-label={`Year ${row.year} output ${rawOutput.toFixed(
                          1,
                        )}`}
                      />
                      <div className="mt-1 text-[10px] text-gray-600">
                        Y{row.year}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </section>

      {/* SIDEBAR: HIERARCHY */}
      <aside className="w-full max-w-xs border-t border-gray-200 bg-gray-50/80 px-4 py-4 md:border-l md:border-t-0 md:px-5 md:py-5 md:sticky md:top-0 md:h-screen md:overflow-y-auto">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Company Hierarchy
          </h2>

          {isEditable && (
            <button
              type="button"
              onClick={() => setEditMode((v) => !v)}
              className="ml-2 rounded-full border border-gray-300 bg-white px-2 py-0.5 text-[11px] font-medium text-gray-700 hover:bg-gray-100"
            >
              {editMode ? 'Done' : 'Edit'}
            </button>
          )}
        </div>

        <p className="text-xs text-gray-500 mb-3">
          Roles from President down to Worker, maintained by the yearly
          promotion &amp; hiring logic.
        </p>

        {uiMessage && (
          <p className="mb-2 text-[11px] text-red-600">{uiMessage}</p>
        )}

        {hierarchy.length === 0 ? (
          <p className="text-xs text-gray-500 italic">
            No hierarchy roles defined for this company&apos;s industry yet.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {hierarchy.map((slot) => {
              const roleId = slot.roleId;
              const candidates = candidatesByRole[roleId] ?? [];
              const isRoleLoading = roleLoading[roleId] ?? false;
              const isRoleSaving = savingRole[roleId] ?? false;

              return (
                <li
                  key={slot.roleId}
                  className="rounded-md border border-gray-200 bg-white px-3 py-2 shadow-sm"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs font-semibold text-gray-800">
                      {slot.roleName}
                    </span>
                    <span className="text-[10px] text-gray-400 uppercase">
                      Rank {slot.rank}
                    </span>
                  </div>

                  {!editMode && (
                    <>
                      {slot.occupied && slot.person ? (
                        <div className="mt-1">
                          <p className="text-xs font-medium text-gray-800">
                            {slot.person.name}
                            <span className="ml-1 text-[10px] text-gray-500">
                              ({slot.person.age})
                            </span>
                            {slot.locked && (
                              <span className="ml-1 text-[10px] text-amber-600">
                                🔒
                              </span>
                            )}
                          </p>
                          <p className="mt-0.5 text-[11px] text-gray-600">
                            Int {slot.person.intelligence} · Lead{' '}
                            {slot.person.leadership} · Disc{' '}
                            {slot.person.discipline} · Cha{' '}
                            {slot.person.charisma}
                          </p>
                        </div>
                      ) : (
                        <p className="mt-1 text-xs italic text-gray-400">
                          Vacant — will be filled next sim year if candidates
                          are available.
                        </p>
                      )}
                    </>
                  )}

                  {editMode && (
                    <div className="mt-2 space-y-2">
                      {/* Lock toggle (only when occupied) */}
                      <div className="flex items-center justify-between gap-2">
                        <label className="flex items-center gap-1 text-[11px] text-gray-600">
                          <input
                            type="checkbox"
                            className="h-3 w-3"
                            disabled={!slot.occupied || isRoleSaving}
                            checked={slot.locked}
                            onChange={async (e) => {
                              const nextLocked = e.target.checked;
                              await assignRole({
                                roleId,
                                personId: slot.person ? slot.person.id : null,
                                locked: nextLocked,
                              });
                            }}
                          />
                          <span>Lock slot</span>
                        </label>
                        {isRoleSaving && (
                          <span className="text-[10px] text-gray-400">
                            Saving…
                          </span>
                        )}
                      </div>

                      {/* Candidate selector */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] text-gray-600">
                            Assignment
                          </span>
                          <button
                            type="button"
                            onClick={() => loadCandidatesForRole(roleId)}
                            disabled={isRoleLoading}
                            className="rounded-full border border-gray-300 bg-gray-50 px-2 py-0.5 text-[10px] text-gray-700 hover:bg-gray-100"
                          >
                            {isRoleLoading
                              ? 'Loading…'
                              : candidates.length === 0
                              ? 'Load candidates'
                              : 'Refresh'}
                          </button>
                        </div>

                        {candidates.length > 0 && (
                          <select
                            className="mt-1 w-full rounded border border-gray-300 bg-white px-2 py-1 text-[11px]"
                            value={slot.person?.id ?? ''}
                            onChange={async (e) => {
                              const val = e.target.value;
                              const personId =
                                val === '' ? null : Number(val) || null;
                              await assignRole({
                                roleId,
                                personId,
                                locked: slot.locked,
                              });
                            }}
                            disabled={isRoleSaving}
                          >
                            <option value="">
                              Vacant (auto-fill next year)
                            </option>
                            {candidates.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name} ({c.age}) — fit {c.roleFitScore}
                                {c.currentRoleName
                                  ? `, currently ${c.currentRoleName}`
                                  : ''}
                              </option>
                            ))}
                          </select>
                        )}

                        {candidates.length === 0 && !isRoleLoading && (
                          <p className="mt-1 text-[11px] text-gray-400">
                            Load candidates to manually assign this role.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </aside>
    </main>
  );
}
