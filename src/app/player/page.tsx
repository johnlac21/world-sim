// src/app/player/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { GovernmentCard } from "@/components/GovernmentCard";
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
import { StatBadge } from "@/components/ui/StatBadge";

type GovernmentOfficeSummary = {
  officeId: number;
  officeName: string;
  prestige: number;
  holderId: number | null;
  holderName: string | null;
  fitScore: number | null;
  termYearsRemaining: number | null;
};

type CountryPerformanceSummary = {
  year: number;
  totalScore: number;
  companyScore: number;
  governmentScore: number;
  populationScore: number;
  rank?: number | null;
  champion?: boolean | null;
};

type PlayerCountryPayload = {
  name: string;
  worldName: string;
  population: number;
  companies: number;
  schools: number;
  employed: number;
  unemployed: number;
  offices: GovernmentOfficeSummary[];
  performance?: CountryPerformanceSummary | null;
  worldId: number;
  countryId: number;
};

type StandingsRow = {
  countryId: number;
  countryName: string;
  rank: number;
  totalScore: number;
  companyScore: number;
  governmentScore: number;
  populationScore: number;
  rankChange?: number | null;
};

type StandingsResponse = {
  year: number;
  countries: StandingsRow[];
};

type YouthProspect = {
  id: number;
  name: string;
  age: number;
  potentialOverall: number;
  prospectScore: number;
  prospectGrade: string;
  educationLabel: string;
};

type YouthResponse = {
  youthMinAge: number;
  youthMaxAge: number;
  prospects: YouthProspect[];
};

export default function PlayerDashboardPage() {
  const [player, setPlayer] = useState<PlayerCountryPayload | null>(null);
  const [standings, setStandings] = useState<StandingsRow[] | null>(null);
  const [youth, setYouth] = useState<YouthProspect[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [standingsLoading, setStandingsLoading] = useState(false);
  const [youthLoading, setYouthLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [talentOpen, setTalentOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchPlayer() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("/api/player-country");
        const json = (await res.json()) as PlayerCountryPayload & {
          error?: string;
        };

        if (!res.ok || (json as any).error) {
          throw new Error((json as any).error || "Failed to load player country");
        }

        if (!cancelled) {
          setPlayer(json);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message ?? "Failed to load player dashboard");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchPlayer();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!player) return;
    let cancelled = false;

    async function fetchStandings() {
      try {
        setStandingsLoading(true);
        const res = await fetch(`/api/world/${player.worldId}/standings`);
        if (!res.ok) return;
        const json = (await res.json()) as StandingsResponse;
        if (!cancelled) {
          setStandings(json.countries);
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setStandingsLoading(false);
      }
    }

    fetchStandings();
    return () => {
      cancelled = true;
    };
  }, [player]);

  useEffect(() => {
    let cancelled = false;
    async function fetchYouth() {
      try {
        setYouthLoading(true);
        const res = await fetch("/api/player/youth");
        if (!res.ok) return;
        const json = (await res.json()) as YouthResponse;
        if (!cancelled) {
          const top3 = [...json.prospects].slice(0, 3);
          setYouth(top3);
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setYouthLoading(false);
      }
    }

    fetchYouth();
    return () => {
      cancelled = true;
    };
  }, []);

  const controlledStanding = useMemo(() => {
    if (!player || !standings) return null;
    return standings.find((s) => s.countryId === player.countryId) ?? null;
  }, [player, standings]);

  const headlines = useMemo(() => {
    if (!player) return [];
    const items: { tag: string; text: string }[] = [];

    if (player.performance) {
      const p = player.performance;

      const totalLabel =
        typeof p.totalScore === "number" && Number.isFinite(p.totalScore)
          ? Math.round(p.totalScore)
          : "—";

      if (p.champion) {
        items.push({
          tag: "CHAMPION",
          text: `${player.name} is the reigning world champion this year.`,
        });
      } else if (typeof p.rank === "number") {
        items.push({
          tag: "STANDING",
          text: `${player.name} is currently ranked #${p.rank} in the world.`,
        });
      } else {
        items.push({
          tag: "SEASON",
          text: `${player.name} is competing this year with total score ${totalLabel}.`,
        });
      }

      if (p.governmentScore >= 70) {
        items.push({
          tag: "GOVERNMENT",
          text: "Strong cabinet: government score is a major asset this season.",
        });
      } else if (p.governmentScore > 0) {
        items.push({
          tag: "GOVERNMENT",
          text: "Government performance is middling — cabinet changes may help.",
        });
      }
    }

    if (youth && youth.length > 0) {
      const best = youth[0];
      items.push({
        tag: "PROSPECT",
        text: `${best.name} (${best.age}) is emerging as a top prospect (${best.prospectGrade}, ${best.potentialOverall} potential).`,
      });
    }

    return items;
  }, [player, youth]);

  if (loading) {
    return (
      <div className="py-8 text-sm text-gray-600">
        Loading player dashboard…
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className="py-8 text-sm text-red-600">
        {error ?? "Failed to load player dashboard."}
      </div>
    );
  }

  const perf = player.performance;

  return (
    <>
      <SectionHeader
        title={`${player.name} — Country Dashboard`}
        description={`${player.worldName} · Managed country overview, performance, youth pipeline, and government.`}
        action={
          <button
            className="text-xs text-blue-600 hover:underline"
            onClick={() => setTalentOpen(true)}
          >
            Open Talent Search
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        {/* LEFT COLUMN: mini-standings + summary */}
        <div className="lg:col-span-1 space-y-3">
          <Panel>
            <PanelHeader
              title="Mini Standings"
              action={
                <Link
                  href={`/world/${player.worldId}/standings`}
                  className="text-[11px] text-blue-600 hover:underline"
                >
                  View all
                </Link>
              }
            />
            {standingsLoading && (
              <p className="text-xs text-gray-500">Loading standings…</p>
            )}
            {!standingsLoading && standings && standings.length > 0 ? (
              <Table dense>
                <TableHead>
                  <tr>
                    <Th>#</Th>
                    <Th>Country</Th>
                    <Th align="right">Total</Th>
                  </tr>
                </TableHead>
                <TableBody>
                  {standings.slice(0, 6).map((row) => {
                    const isYou = row.countryId === player.countryId;
                    return (
                      <TableRow key={row.countryId} highlight={isYou}>
                        <Td className="text-[11px] text-gray-600">
                          {row.rank}
                        </Td>
                        <Td>
                          <span
                            className={
                              "truncate text-xs " +
                              (isYou
                                ? "font-semibold text-blue-800"
                                : "text-gray-800")
                            }
                          >
                            {row.countryName}
                          </span>
                        </Td>
                        <Td
                          align="right"
                          className="font-mono text-[11px] text-gray-700"
                        >
                          {Math.round(row.totalScore)}
                        </Td>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : !standingsLoading ? (
              <p className="text-xs text-gray-500">
                Standings are not available yet. Sim a year to generate standings.
              </p>
            ) : null}
          </Panel>

          {controlledStanding && (
            <Panel variant="subtle" padding="sm">
              <PanelHeader title="Your Standing" size="sm" />
              <p className="text-xs text-gray-700 mb-1">
                Ranked{" "}
                <span className="font-semibold">
                  #{controlledStanding.rank}
                </span>{" "}
                out of {standings?.length ?? "?"} countries.
              </p>
              <p className="text-[11px] text-gray-600">
                Total {Math.round(controlledStanding.totalScore)} · Company{" "}
                {Math.round(controlledStanding.companyScore)} · Government{" "}
                {Math.round(controlledStanding.governmentScore)}
              </p>
            </Panel>
          )}
        </div>

        {/* CENTER COLUMN */}
        <div className="lg:col-span-2 space-y-4">
          <Panel>
            <PanelHeader title="Country Overview" />
            <PanelBody className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
              <OverviewStat label="Population" value={player.population} />
              <OverviewStat label="Companies" value={player.companies} />
              <OverviewStat label="Schools" value={player.schools} />
              <OverviewStat
                label="Employed"
                value={`${player.employed} (${Math.round(
                  (player.employed / Math.max(player.population, 1)) * 100,
                )}% of population)`}
              />
              <OverviewStat
                label="Unemployed"
                value={`${player.unemployed} (${Math.round(
                  (player.unemployed / Math.max(player.population, 1)) * 100,
                )}% of population)`}
              />
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader
              title={`Performance${perf ? ` — Year ${perf.year}` : ""}`}
              action={
                <Link
                  href={`/country/${player.countryId}`}
                  className="text-[11px] text-blue-600 hover:underline"
                >
                  View country history
                </Link>
              }
            />
            {perf ? (
              <div className="grid grid-cols-1 gap-3 text-xs md:grid-cols-4">
                <OverviewStat
                  label="Total score"
                  value={Math.round(perf.totalScore)}
                  big
                  highlight={perf.champion === true}
                  note={
                    perf.champion
                      ? "World champion this year"
                      : typeof perf.rank === "number"
                      ? `Rank #${perf.rank}`
                      : undefined
                  }
                />
                <OverviewStat
                  label="Company score"
                  value={Math.round(perf.companyScore)}
                  note="Sum of company output"
                />
                <OverviewStat
                  label="Government score"
                  value={Math.round(perf.governmentScore)}
                  note="Cabinet effectiveness"
                />
                <OverviewStat
                  label="Population score"
                  value={Math.round(perf.populationScore)}
                  note="Future demographic systems"
                />
              </div>
            ) : (
              <p className="text-xs text-gray-600">
                No performance records yet. Sim a year to generate company and
                country scores.
              </p>
            )}
          </Panel>

          <Panel>
            <PanelHeader
              title="Youth Pipeline"
              action={
                <Link
                  href="/player/youth"
                  className="text-[11px] text-blue-600 hover:underline"
                >
                  View full pipeline
                </Link>
              }
            />
            {youthLoading && (
              <p className="text-xs text-gray-600">Loading prospects…</p>
            )}

            {!youthLoading && youth && youth.length > 0 ? (
              <Table dense>
                <TableHead>
                  <tr>
                    <Th>Prospect</Th>
                    <Th>Age</Th>
                    <Th>Education</Th>
                    <Th align="right">Grade</Th>
                  </tr>
                </TableHead>
                <TableBody>
                  {youth.map((p) => (
                    <TableRow key={p.id}>
                      <Td>
                        <Link
                          href={`/person/${p.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {p.name}
                        </Link>
                      </Td>
                      <Td>{p.age}</Td>
                      <Td>{p.educationLabel}</Td>
                      <Td align="right">
                        {p.prospectGrade} ({Math.round(p.prospectScore)})
                      </Td>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : !youthLoading ? (
              <p className="text-xs text-gray-600">
                No youth prospects surfaced yet. Sim a few years for teenagers to
                appear.
              </p>
            ) : null}
          </Panel>
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-1 space-y-4">
          <GovernmentCard offices={player.offices} />

          <Panel>
            <PanelHeader
              title="Headlines"
              subtitle="Season recap & story hooks"
            />
            {headlines.length === 0 ? (
              <p className="text-xs text-gray-600">
                Sim a few years to generate meaningful stories about your country.
              </p>
            ) : (
              <div className="space-y-2">
                {headlines.map((h, idx) => (
                  <HeadlineCard key={`${h.tag}-${idx}`} tag={h.tag} text={h.text} />
                ))}
              </div>
            )}
          </Panel>
        </div>
      </div>

      <TalentSearchModal
        worldId={player.worldId}
        defaultCountryId={player.countryId}
        isOpen={talentOpen}
        onClose={() => setTalentOpen(false)}
      />
    </>
  );
}

type OverviewStatProps = {
  label: string;
  value: number | string | null | undefined;
  big?: boolean;
  highlight?: boolean;
  note?: string;
};

function OverviewStat({ label, value, big, highlight, note }: OverviewStatProps) {
  let display: string | number;

  if (typeof value === "number") {
    display = Number.isFinite(value) ? value : "—";
  } else if (value == null) {
    display = "—";
  } else {
    display = value;
  }

  return (
    <div className="flex flex-col rounded-md border border-gray-200 bg:white/60 px-2 py-2">
      <span className="text-[11px] font-medium text-gray-500">{label}</span>
      <span
        className={
          "mt-0.5 font-semibold text-gray-900 " +
          (big ? "text-base" : "text-sm") +
          (highlight ? " text-blue-700" : "")
        }
      >
        {display}
      </span>
      {note && (
        <span className="mt-0.5 text-[11px] text-gray-500">{note}</span>
      )}
    </div>
  );
}

type HeadlineCardProps = {
  tag: string;
  text: string;
};

function HeadlineCard({ tag, text }: HeadlineCardProps) {
  const variant =
    tag === "CHAMPION"
      ? "warning"
      : tag === "PROSPECT"
      ? "success"
      : tag === "GOVERNMENT"
      ? "info"
      : "neutral";

  return (
    <div className="flex items-start gap-2 rounded-md border border-gray-200 bg-[#fafafa] px-2 py-2">
      <StatBadge label={tag} variant={variant} />
      <p className="text-xs text-gray-800">{text}</p>
    </div>
  );
}
