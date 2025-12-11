// src/app/player/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { GovernmentCard } from "@/components/GovernmentCard";
import { TalentSearchModal } from "@/components/TalentSearchModal";

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
  rankChange?: number | null; // +1, -1, 0, or null if unknown
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

  // Load player-country payload
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

  // Load mini-standings once we know worldId
  useEffect(() => {
    if (!player) return;
    let cancelled = false;

    async function fetchStandings() {
      try {
        setStandingsLoading(true);
        const res = await fetch(`/api/world/${player.worldId}/standings`);
        if (!res.ok) {
          // Standings are optional; fail silently
          return;
        }
        const json = (await res.json()) as StandingsResponse;
        if (!cancelled) {
          setStandings(json.countries);
        }
      } catch {
        // ignore; mini-standings just won’t render
      } finally {
        if (!cancelled) setStandingsLoading(false);
      }
    }

    fetchStandings();
    return () => {
      cancelled = true;
    };
  }, [player]);

  // Load youth prospects quick view
  useEffect(() => {
    let cancelled = false;
    async function fetchYouth() {
      try {
        setYouthLoading(true);
        const res = await fetch("/api/player/youth");
        if (!res.ok) return;
        const json = (await res.json()) as YouthResponse;
        if (!cancelled) {
          // take top 3 prospects for the quick widget
          const top3 = [...json.prospects].slice(0, 3);
          setYouth(top3);
        }
      } catch {
        // ignore; youth quick view is optional
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
          text: `${player.name} is competing this year with total score ${Math.round(
            p.totalScore,
          )}.`,
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
      {/* Page title */}
      <div className="mb-4 flex items-baseline justify-between">
        <div>
          <h1 className="text-xl font-semibold">
            {player.name} — Country Dashboard
          </h1>
          <p className="text-xs text-gray-600">
            {player.worldName} · Managed country overview, performance, youth pipeline, and government.
          </p>
        </div>

        <button
          className="text-xs text-blue-600 hover:underline"
          onClick={() => setTalentOpen(true)}
        >
          Open Talent Search
        </button>
      </div>

      {/* 3-column layout: left = mini-standings, center = country dashboard, right = gov + headlines */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        {/* LEFT COLUMN: mini-standings */}
        <div className="lg:col-span-1 space-y-3">
          <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Mini Standings</h2>
              <Link
                href={`/world/${player.worldId}/standings`}
                className="text-[11px] text-blue-600 hover:underline"
              >
                View all
              </Link>
            </div>

            {standingsLoading && (
              <p className="text-xs text-gray-500">Loading standings…</p>
            )}

            {!standingsLoading && standings && standings.length > 0 ? (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b text-[11px] text-gray-500">
                    <th className="py-1 text-left">#</th>
                    <th className="py-1 text-left">Country</th>
                    <th className="py-1 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.slice(0, 6).map((row) => {
                    const isYou = row.countryId === player.countryId;
                    return (
                      <tr
                        key={row.countryId}
                        className={
                          "border-b last:border-0" +
                          (isYou ? " bg-blue-50/60" : " odd:bg-white even:bg-gray-50")
                        }
                      >
                        <td className="py-1 pr-2 text-[11px] text-gray-600">
                          {row.rank}
                        </td>
                        <td className="py-1 pr-2">
                          <span
                            className={
                              "truncate text-xs " +
                              (isYou ? "font-semibold text-blue-800" : "text-gray-800")
                            }
                          >
                            {row.countryName}
                          </span>
                        </td>
                        <td className="py-1 pl-2 text-right font-mono text-[11px] text-gray-700">
                          {Math.round(row.totalScore)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : !standingsLoading ? (
              <p className="text-xs text-gray-500">
                Standings are not available yet. Sim a year to generate standings.
              </p>
            ) : null}
          </div>

          {/* Quick controlled-country rank summary */}
          {controlledStanding && (
            <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
              <h3 className="text-sm font-semibold mb-1">Your Standing</h3>
              <p className="text-xs text-gray-700 mb-1">
                Ranked <span className="font-semibold">#{controlledStanding.rank}</span>{" "}
                out of {standings?.length ?? "?"} countries.
              </p>
              <p className="text-[11px] text-gray-600">
                Total score {Math.round(controlledStanding.totalScore)} · Company{" "}
                {Math.round(controlledStanding.companyScore)} · Government{" "}
                {Math.round(controlledStanding.governmentScore)}
              </p>
            </div>
          )}
        </div>

        {/* CENTER COLUMN: country stats & performance */}
        <div className="lg:col-span-2 space-y-4">
          {/* Country overview */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold mb-2">Country Overview</h2>
            <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
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
            </div>
          </div>

          {/* Performance this year */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold">
                Performance {perf ? `— Year ${perf.year}` : ""}
              </h2>
              <Link
                href={`/country/${player.countryId}`}
                className="text-[11px] text-blue-600 hover:underline"
              >
                View country history
              </Link>
            </div>

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
                No performance records yet. Sim a year to generate company and country
                scores.
              </p>
            )}
          </div>

          {/* Youth pipeline quick view */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Youth Pipeline</h2>
              <Link
                href="/player/youth"
                className="text-[11px] text-blue-600 hover:underline"
              >
                View full pipeline
              </Link>
            </div>

            {youthLoading && (
              <p className="text-xs text-gray-600">Loading prospects…</p>
            )}

            {!youthLoading && youth && youth.length > 0 ? (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b text-[11px] text-gray-500">
                    <th className="py-1 text-left">Prospect</th>
                    <th className="py-1 text-left">Age</th>
                    <th className="py-1 text-left">Education</th>
                    <th className="py-1 text-right">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {youth.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b last:border-0 odd:bg-white even:bg-gray-50"
                    >
                      <td className="py-1 pr-2">
                        <Link
                          href={`/person/${p.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {p.name}
                        </Link>
                      </td>
                      <td className="py-1 pr-2 text-xs text-gray-700">{p.age}</td>
                      <td className="py-1 pr-2 text-xs text-gray-700">
                        {p.educationLabel}
                      </td>
                      <td className="py-1 pl-2 text-right text-xs text-gray-800">
                        {p.prospectGrade} ({Math.round(p.prospectScore)})
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : !youthLoading ? (
              <p className="text-xs text-gray-600">
                No youth prospects surfaced yet. Sim a few years for teenagers to
                appear.
              </p>
            ) : null}
          </div>
        </div>

        {/* RIGHT COLUMN: government + headlines */}
        <div className="lg:col-span-1 space-y-4">
          {/* Government card (reusing your existing component) */}
          <GovernmentCard offices={player.offices} />

          {/* Headlines */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Headlines</h2>
              <span className="text-[11px] text-gray-500">
                Season recap & story hooks
              </span>
            </div>

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
          </div>
        </div>
      </div>

      {/* Talent search modal */}
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
    <div className="flex flex-col rounded-md border border-gray-200 bg-white/60 px-2 py-2">
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
        <span className="mt-0.5 text-[11px] text-gray-500">
          {note}
        </span>
      )}
    </div>
  );
}


type HeadlineCardProps = {
  tag: string;
  text: string;
};

function HeadlineCard({ tag, text }: HeadlineCardProps) {
  const colorClasses =
    tag === "CHAMPION"
      ? "bg-yellow-100 text-yellow-800"
      : tag === "PROSPECT"
      ? "bg-green-100 text-green-800"
      : tag === "GOVERNMENT"
      ? "bg-sky-100 text-sky-800"
      : "bg-gray-100 text-gray-800";

  return (
    <div className="flex items-start gap-2 rounded-md border border-gray-200 bg-[#fafafa] px-2 py-2">
      <span
        className={
          "mt-0.5 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold " +
          colorClasses
        }
      >
        {tag}
      </span>
      <p className="text-xs text-gray-800">{text}</p>
    </div>
  );
}
