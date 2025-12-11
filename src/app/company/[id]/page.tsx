// src/app/company/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { TalentSearchModal } from "@/components/TalentSearchModal";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/Panel";
import { SectionHeader } from "@/components/ui/SectionHeader";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  Th,
  Td,
} from "@/components/ui/Table";
import { DepthChartRow } from "@/components/ui/DepthChartRow";

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

  const [editMode, setEditMode] = useState(false);
  const [candidatesByRole, setCandidatesByRole] = useState<
    Record<number, PositionCandidate[]>
  >({});
  const [roleLoading, setRoleLoading] = useState<Record<number, boolean>>({});
  const [savingRole, setSavingRole] = useState<Record<number, boolean>>({});
  const [uiMessage, setUiMessage] = useState<string | null>(null);

  const [showTalentSearch, setShowTalentSearch] = useState(false);

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
            "Failed to load company hierarchy / performance",
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
    if (candidatesByRole[roleId]) return;

    try {
      setRoleLoadingFlag(roleId, true);
      setUiMessage(null);

      const res = await fetch(
        `/api/player/companies/${data.company.id}/positions/${roleId}/candidates`,
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          body.error || `Failed to load candidates (status ${res.status})`,
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
        err?.message ?? "Failed to load candidates for this role.",
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
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ personId, locked }),
        },
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          body.error || `Failed to assign position (status ${res.status})`,
        );
      }

      setHierarchy((hierarchy) =>
        hierarchy.map((slot) => {
          if (slot.roleId !== roleId) return slot;

          if (personId === null) {
            return {
              ...slot,
              occupied: false,
              locked: false,
              person: null,
            };
          }

          const candidates = candidatesByRole[roleId] ?? [];
          const chosen =
            candidates.find((c) => c.id === personId) ?? null;

          if (!chosen) {
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
        err?.message ?? "Failed to update company hierarchy slot.",
      );
    } finally {
      setRoleSavingFlag(roleId, false);
    }
  };

  if (loading) {
    return (
      <main className="p-4">
        <p className="text-sm text-gray-600">Loading company…</p>
      </main>
    );
  }

  if (error || !data || (data as any).error) {
    return (
      <main className="p-4 space-y-2">
        <p className="text-sm text-red-600">
          Company not found or failed to load.
        </p>
        <Link href="/" className="text-blue-600 underline text-sm">
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
        <SectionHeader
          eyebrow="Company"
          title={company.name}
          description={
            <>
              Industry: <span className="font-semibold">{company.industry}</span>
            </>
          }
          action={
            <Link
              href={`/world/${company.worldId}/standings`}
              className="text-xs text-blue-600 hover:underline"
            >
              ← Back to standings
            </Link>
          }
        />

        <Panel>
          <PanelHeader
            title="Company Overview"
            subtitle="Leadership hierarchy in the sidebar; simulated yearly performance and industry context below."
          />
          <PanelBody>
            <p className="text-sm text-gray-600">
              This page shows the company&apos;s current leadership hierarchy and
              its simulated yearly performance within the world.
            </p>
          </PanelBody>
        </Panel>

        {/* PERFORMANCE (CURRENT YEAR) */}
        <Panel>
          <PanelHeader title="Performance (Current Year)" />
          <PanelBody className="space-y-3">
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
                    Output Score:{" "}
                    <span className="font-semibold">
                      {latestPerformance.outputScore.toFixed(1)}
                    </span>
                  </p>
                </div>

                <div className="text-sm text-gray-700 space-y-1">
                  <p className="font-medium">Breakdown</p>
                  <p>
                    Talent:{" "}
                    <span className="font-mono">
                      {latestPerformance.talentScore.toFixed(1)}
                    </span>
                  </p>
                  <p>
                    Leadership:{" "}
                    <span className="font-mono">
                      {latestPerformance.leadershipScore.toFixed(1)}
                    </span>
                  </p>
                  <p>
                    Reliability:{" "}
                    <span className="font-mono">
                      {latestPerformance.reliabilityScore.toFixed(1)}
                    </span>
                  </p>
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-gray-200 mt-2">
              <Link
                href={`/world/${company.worldId}/standings`}
                className="text-sm text-blue-600 hover:underline"
              >
                View Country &amp; World Rankings →
              </Link>
            </div>
          </PanelBody>
        </Panel>

        {/* INDUSTRY BENCHMARK */}
        <Panel>
          <PanelHeader title="Industry Benchmark" />
          <PanelBody className="space-y-2">
            {!showBenchmark ? (
              <p className="text-sm text-gray-600">
                No benchmark data yet — simulate a year to compare this company
                to its industry.
              </p>
            ) : (
              <>
                <p className="text-sm text-gray-700 font-medium">
                  Year {industryBenchmark.year} — {company.industry}
                </p>
                <p className="text-sm text-gray-700">
                  This company:{" "}
                  <span className="font-mono font-semibold">
                    {industryBenchmark.companyOutput!.toFixed(1)}
                  </span>
                </p>
                <p className="text-sm text-gray-700">
                  Industry average:{" "}
                  <span className="font-mono">
                    {industryBenchmark.industryAverage!.toFixed(1)}
                  </span>
                </p>
                {industryBenchmark.industryRank && (
                  <p className="text-xs text-gray-600">
                    Rank {industryBenchmark.industryRank} of{" "}
                    {industryBenchmark.totalCompanies} companies in this
                    industry.
                  </p>
                )}
              </>
            )}
          </PanelBody>
        </Panel>

        {/* INDUSTRY PEERS */}
        <Panel>
          <PanelHeader
            title="Industry Peers"
            subtitle={
              hasPeers && peersYear !== null
                ? `Year ${peersYear} — ${industryPeers.length} companies`
                : undefined
            }
          />
          <PanelBody>
            {!hasPeers ? (
              <p className="text-sm text-gray-600">
                No peer data yet — simulate a year to see other companies in
                this industry.
              </p>
            ) : (
              <Table dense>
                <TableHead>
                  <tr>
                    <Th>Rank</Th>
                    <Th>Company</Th>
                    <Th>Country</Th>
                    <Th align="right">Output</Th>
                  </tr>
                </TableHead>
                <TableBody>
                  {industryPeers.map((peer) => {
                    const isSelf = peer.isThisCompany;
                    return (
                      <TableRow key={peer.companyId} highlight={isSelf}>
                        <Td>{peer.rank}</Td>
                        <Td>
                          {peer.companyName}
                          {isSelf && (
                            <span className="ml-1 text-[10px] text-blue-600">
                              (you)
                            </span>
                          )}
                        </Td>
                        <Td className="text-gray-700">
                          {peer.countryName}
                        </Td>
                        <Td align="right" className="font-mono">
                          {peer.outputScore.toFixed(1)}
                        </Td>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </PanelBody>
        </Panel>

        {/* PERFORMANCE HISTORY */}
        <Panel>
          <PanelHeader
            title="Performance History"
            subtitle={
              historyCount > 0
                ? `Last ${historyCount} year${historyCount === 1 ? "" : "s"}`
                : undefined
            }
          />
          <PanelBody>
            {historyCount === 0 || !hasHistoryTrend ? (
              <p className="text-sm text-gray-600">
                Not enough history yet — simulate more years to see a
                performance trend.
              </p>
            ) : (
              <div className="mt-1">
                <div className="flex items-end gap-2" style={{ height: 120 }}>
                  {performanceHistory.map((row) => {
                    const rawOutput = Number.isFinite(row.outputScore)
                      ? row.outputScore
                      : 0;

                    const max = maxOutput > 0 ? maxOutput : rawOutput || 1;
                    let barHeight = Math.round((rawOutput / max) * 110);

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
          </PanelBody>
        </Panel>
      </section>

      {/* SIDEBAR: HIERARCHY */}
      <aside className="w-full max-w-xs border-t border-gray-200 bg-gray-50/80 px-4 py-4 md:border-l md:border-t-0 md:px-5 md:py-5 md:sticky md:top-0 md:h-screen md:overflow-y-auto">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Company Hierarchy
          </h2>

          <div className="flex items-center gap-1">
            {isEditable && (
              <button
                type="button"
                onClick={() => setEditMode((v) => !v)}
                className="rounded-full border border-gray-300 bg-white px-2 py-0.5 text-[11px] font-medium text-gray-700 hover:bg-gray-100"
              >
                {editMode ? "Done" : "Edit"}
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowTalentSearch(true)}
              className="rounded-full border border-blue-500 bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 hover:bg-blue-100"
            >
              Talent
            </button>
          </div>
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
                <DepthChartRow
                  key={slot.roleId}
                  title={slot.roleName}
                  rankLabel={`Rank ${slot.rank}`}
                  muted={!slot.occupied}
                >
                  {!editMode && (
                    <>
                      {slot.occupied && slot.person ? (
                        <>
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
                            Int {slot.person.intelligence} · Lead{" "}
                            {slot.person.leadership} · Disc{" "}
                            {slot.person.discipline} · Cha{" "}
                            {slot.person.charisma}
                          </p>
                        </>
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
                              ? "Loading…"
                              : candidates.length === 0
                              ? "Load candidates"
                              : "Refresh"}
                          </button>
                        </div>

                        {candidates.length > 0 && (
                          <select
                            className="mt-1 w-full rounded border border-gray-300 bg-white px-2 py-1 text-[11px]"
                            value={slot.person?.id ?? ""}
                            onChange={async (e) => {
                              const val = e.target.value;
                              const personId =
                                val === "" ? null : Number(val) || null;
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
                                  : ""}
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
                </DepthChartRow>
              );
            })}
          </ul>
        )}
      </aside>

      {/* TALENT SEARCH MODAL */}
      {showTalentSearch && (
        <TalentSearchModal
          worldId={company.worldId}
          defaultCountryId={company.countryId}
          defaultIndustry={company.industry}
          isOpen={showTalentSearch}
          onClose={() => setShowTalentSearch(false)}
          onSelectPerson={(person) => {
            window.open(`/person/${person.id}`, "_blank");
          }}
          selectLabel="View profile"
        />
      )}
    </main>
  );
}
