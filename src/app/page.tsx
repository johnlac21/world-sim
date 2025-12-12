"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CountryCrest } from "@/components/ui/CountryCrest";

type WorldSummaryPerson = {
  id: number;
  name: string;
  age: number;
  countryId: number;
  countryName: string;
};

type WorldSummaryResponse = {
  id: number;
  name: string;
  currentYear: number;
  countriesCount: number;
  peopleCount: number;

  // backend might use either name
  companyCount?: number;
  companiesCount?: number;

  samplePeople: WorldSummaryPerson[] | null;
};

type CountryHistoryEntry = {
  year: number;
  totalScore: number;
  rank: number;
  isChampion: boolean;
};

type CountryStanding = {
  countryId: number;
  countryName: string;
  currentRank: number;
  lastYearRank: number | null;
  trend: "up" | "down" | "same" | "new";
  totalScore: number;
  companyScore: number;
  governmentScore: number;
  populationScore: number;
  history: CountryHistoryEntry[] | null;
};

type StandingsResponse = {
  worldId: number;
  year: number;
  playerCountryId: number | null;
  countries: CountryStanding[];
};

type TopCompany = {
  companyId?: number; // some APIs might just use "id"
  id?: number;

  companyName?: string;
  name?: string;

  countryId: number;
  countryName?: string;
  country?: string;

  industry: string;
  outputScore: number;
};

type TopCompaniesResponse = {
  worldId: number;
  year: number;
  companies: TopCompany[];
};

type Headline = {
  id: string;
  title: string;
  subtitle: string;
};

type TopPerson = {
  id: number;
  name: string;
  age: number;
  countryId: number;
  countryName: string;
  contributionScore?: number; // optional; falls back to sample people
};

export default function WorldOverviewPage() {
  const router = useRouter();

  const [world, setWorld] = useState<WorldSummaryResponse | null>(null);
  const [standings, setStandings] = useState<StandingsResponse | null>(null);
  const [topCompanies, setTopCompanies] = useState<TopCompany[]>([]);
  const [topPeople, setTopPeople] = useState<TopPerson[]>([]);
  const [headlines, setHeadlines] = useState<Headline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Load world summary first (/api/world) -------------------------
  useEffect(() => {
    let cancelled = false;

    async function loadWorld() {
      try {
        setLoading(true);
        const res = await fetch("/api/world");
        if (!res.ok) {
          throw new Error(`World load failed (${res.status})`);
        }
        const json = (await res.json()) as WorldSummaryResponse;
        if (!cancelled) {
          setWorld(json);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message ?? "Failed to load world");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadWorld();
    return () => {
      cancelled = true;
    };
  }, []);

  // --- Once we know worldId, load standings + top companies ----------
  useEffect(() => {
    if (!world) return;

    let cancelled = false;

    async function loadSecondary() {
      try {
        setLoading(true);

        const [standingsRes, topCompaniesRes] = await Promise.all([
          fetch(`/api/world/${world.id}/standings`),
          fetch(`/api/world/${world.id}/top-companies`),
        ]);

        if (!standingsRes.ok) {
          throw new Error(`Standings load failed (${standingsRes.status})`);
        }
        if (!topCompaniesRes.ok) {
          throw new Error(`Top companies load failed (${topCompaniesRes.status})`);
        }

        const standingsJson = (await standingsRes.json()) as StandingsResponse;
        const topCompaniesJson =
          (await topCompaniesRes.json()) as TopCompaniesResponse;

        if (cancelled) return;

        setStandings(standingsJson);

        const companies = topCompaniesJson.companies ?? [];
        setTopCompanies(companies);

        // derive topPeople from samplePeople (fallback)
        const ppl = Array.isArray(world.samplePeople) ? world.samplePeople : [];
        const derivedTopPeople: TopPerson[] = ppl
          .slice()
          .sort((a, b) => a.age - b.age) // arbitrary but deterministic
          .slice(0, 10)
          .map((p) => ({
            id: p.id,
            name: p.name,
            age: p.age,
            countryId: p.countryId,
            countryName: p.countryName,
          }));
        setTopPeople(derivedTopPeople);

        const standingsCountries = getStandingsCountriesFromAny(standingsJson);

        setHeadlines(
          buildHeadlines(world, standingsCountries, standingsJson.year, companies)
        );
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message ?? "Failed to load world data");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadSecondary();
    return () => {
      cancelled = true;
    };
  }, [world]);

  // --- Actions -------------------------------------------------------
  async function handleSimYear() {
    try {
      await fetch("/api/sim/year", { method: "POST" });
      window.location.reload();
    } catch {
      // swallow; this is a convenience control
    }
  }

  async function handleResetWorld() {
    if (!window.confirm("Reset world and lose all history?")) return;
    try {
      await fetch("/api/world/reset", { method: "POST" });
      window.location.reload();
    } catch {
      // swallow
    }
  }

  function handleGoToPlayer() {
    router.push("/player");
  }

  // --- Derived helpers -----------------------------------------------
  const standingsCountries: CountryStanding[] =
    getStandingsCountriesFromAny(standings);

  const miniStandings = standingsCountries
    .slice()
    .sort((a, b) => a.currentRank - b.currentRank)
    .slice(0, 10);

  const topCountries = standingsCountries
    .slice()
    .sort((a, b) => a.currentRank - b.currentRank)
    .slice(0, 5);

  const worldStats = computeWorldStats(
    standingsCountries,
    standings?.year ?? null
  );

  // --- Render --------------------------------------------------------
  if (loading && !world && !standings) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-4 text-xs text-gray-600">
        Loading world…
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-4 text-xs text-red-600">
        Error loading world: {error}
      </div>
    );
  }

  if (!world) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-4 text-xs text-gray-600">
        No world found. Try resetting the world from the top nav.
      </div>
    );
  }

  // derive a safe company count from whichever field the API actually uses
  const companyCount = world.companyCount ?? world.companiesCount ?? 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 text-xs">
      {/* Page header – mirrors BBGM league header */}
      <h1 className="text-lg font-semibold mb-1">{world.name}</h1>
      <p className="text-[11px] text-gray-600 mb-3">
        Year {world.currentYear} · Countries: {world.countriesCount} · People:{" "}
        {world.peopleCount.toLocaleString()} · Companies:{" "}
        {companyCount.toLocaleString()}
      </p>

      {/* World-level controls (these duplicate top-nav but are very BBGM-ish) */}
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={handleSimYear}
          className="px-2 py-1 border border-gray-300 rounded text-[11px] hover:bg-gray-100"
        >
          Sim 1 Year
        </button>
        <button
          onClick={handleResetWorld}
          className="px-2 py-1 border border-red-300 text-red-700 rounded text-[11px] hover:bg-red-50"
        >
          Reset World
        </button>
        <button
          onClick={handleGoToPlayer}
          className="px-2 py-1 border border-blue-400 text-blue-700 rounded text-[11px] hover:bg-blue-50"
        >
          My Country
        </button>
      </div>

      {/* 3-column BBGM layout */}
      <div className="grid grid-cols-12 gap-4">
        {/* LEFT COLUMN – mini-standings + countries list */}
        <div className="col-span-12 md:col-span-3 flex flex-col gap-4">
          {/* Mini Standings – BBGM-style */}
          <section>
            <h2 className="text-[11px] font-semibold mb-1 uppercase tracking-wide text-gray-700">
              Standings
            </h2>
            {miniStandings.length === 0 ? (
              <p className="text-[11px] text-gray-500">No standings yet.</p>
            ) : (
              <div className="border border-gray-200 rounded-sm overflow-hidden">
                <table className="w-full border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-gray-100 border-b border-gray-200 text-gray-700">
                      <th className="text-left pl-2 pr-1 py-1">Country</th>
                      <th className="text-right pr-2 py-1 w-10">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {miniStandings.map((c, index) => {
                      const stripe = index % 2 === 0 ? "bg-white" : "bg-gray-50";
                      return (
                        <tr
                          key={c.countryId}
                          className={`${stripe} border-b border-gray-200 hover:bg-[#eef3ff]`}
                        >
                          <td className="text-left pl-2 pr-1 py-1.5 flex items-center gap-2">
                            {/* rank */}
                            <span className="font-semibold text-gray-900">
                              {index + 1}
                            </span>

                            {/* crest */}
                            <CountryCrest id={c.countryId} name={c.countryName} />

                            {/* name */}
                            <Link
                              href={`/country/${c.countryId}`}
                              className="text-blue-700 hover:underline"
                            >
                              {c.countryName}
                            </Link>
                          </td>

                          <td className="text-right pr-2 py-1.5">
                            {formatScore(c.totalScore)}
                          </td>
                        </tr>
                      );
                    })}

                  </tbody>
                </table>
              </div>
            )}
            <div className="mt-1 text-[11px]">
              <Link
                href={`/world/${world.id}/standings`}
                className="text-blue-700 hover:underline"
              >
                Full standings →
              </Link>
            </div>
          </section>


          {/* Countries list */}
          <section>
            <h2 className="text-[11px] font-semibold mb-1 uppercase tracking-wide text-gray-700">
              Countries
            </h2>
            {miniStandings.length === 0 ? (
              <p className="text-[11px] text-gray-500">
                Standings will populate after the first simulated year.
              </p>
            ) : (
              <ul className="list-disc pl-4 space-y-[1px]">
                {miniStandings.map((c) => (
                  <li key={`list-${c.countryId}`}>
                    <Link
                      href={`/country/${c.countryId}`}
                      className="text-blue-700 hover:underline"
                    >
                      {c.countryName}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* CENTER COLUMN – world snapshot, top countries, world stats, top companies */}
        <div className="col-span-12 md:col-span-6 flex flex-col gap-4">
          {/* World snapshot */}
          <section>
            <h2 className="text-[11px] font-semibold mb-1 text-gray-800">
              World snapshot
            </h2>
            <div className="grid grid-cols-4 gap-2 text-[11px]">
              <div>
                <div className="text-gray-500">Year</div>
                <div className="font-semibold">{world.currentYear}</div>
              </div>
              <div>
                <div className="text-gray-500">Countries</div>
                <div className="font-semibold">{world.countriesCount}</div>
              </div>
              <div>
                <div className="text-gray-500">People</div>
                <div className="font-semibold">
                  {world.peopleCount.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-gray-500">Companies</div>
                <div className="font-semibold">
                  {companyCount.toLocaleString()}
                </div>
              </div>
            </div>
          </section>

          {/* Top countries this year – mirrors "Team Leaders" block */}
          <section>
            <h2 className="text-[11px] font-semibold mb-1 text-gray-800">
              Top countries this year
            </h2>
            {topCountries.length === 0 ? (
              <p className="text-[11px] text-gray-500">
                Sim a year to generate country performance.
              </p>
            ) : (
              <table className="w-full border-collapse text-[11px]">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-600">
                    <th className="text-left pr-1 py-1 w-4">#</th>
                    <th className="text-left pr-1 py-1">Country</th>
                    <th className="text-right pr-1 py-1">Total</th>
                    <th className="text-right pr-1 py-1">Company</th>
                    <th className="text-right pr-1 py-1">Gov</th>
                  </tr>
                </thead>
                <tbody>
                  {topCountries.map((c) => (
                    <tr
                      key={`top-country-${c.countryId}`}
                      className="border-b border-gray-100 hover:bg-[#eef3ff]"
                    >
                      <td className="text-left pr-1 py-[3px]">{c.currentRank}</td>
                      <td className="text-left pr-1 py-[3px]">
                        <Link
                          href={`/country/${c.countryId}`}
                          className="text-blue-700 hover:underline"
                        >
                          {c.countryName}
                        </Link>
                      </td>
                      <td className="text-right pr-1 py-[3px]">
                        {formatScore(c.totalScore)}
                      </td>
                      <td className="text-right pr-1 py-[3px]">
                        {formatScore(c.companyScore)}
                      </td>
                      <td className="text-right pr-1 py-[3px]">
                        {formatScore(c.governmentScore)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          {/* World stats block – BBGM-style "Team Stats" analogue */}
          <section>
            <h2 className="text-[11px] font-semibold mb-1 text-gray-800">
              World stats
            </h2>
            {worldStats ? (
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <div className="text-gray-500">Average company output</div>
                  <div className="font-semibold">
                    {worldStats.avgCompanyOutput.toFixed(1)}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">Champion (last year)</div>
                  <div className="font-semibold">
                    {worldStats.lastChampionName ?? "—"}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">Best gov score</div>
                  <div className="font-semibold">
                    {worldStats.bestGovernmentScoreName
                      ? `${worldStats.bestGovernmentScoreName} (${Math.round(
                          worldStats.bestGovernmentScoreValue
                        )})`
                      : "—"}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">
                    Countries with &gt;0 gov score
                  </div>
                  <div className="font-semibold">
                    {worldStats.countriesWithGovScore}/
                    {worldStats.totalCountries}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-gray-500">
                World stats will appear after the first simulated season.
              </p>
            )}
          </section>

          {/* Top companies this year – mirrors BBGM "League Leaders" */}
          <section>
            <h2 className="text-[11px] font-semibold mb-1 text-gray-800">
              Top companies this year
            </h2>
            {topCompanies.length === 0 ? (
              <p className="text-[11px] text-gray-500">
                Sim a year to generate company performance.
              </p>
            ) : (
              <table className="w-full border-collapse text-[11px]">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-600">
                    <th className="text-left pr-1 py-1 w-4">#</th>
                    <th className="text-left pr-1 py-1">Company</th>
                    <th className="text-left pr-1 py-1">Country</th>
                    <th className="text-left pr-1 py-1">Industry</th>
                    <th className="text-right pr-1 py-1">Output</th>
                  </tr>
                </thead>
                <tbody>
                  {topCompanies.slice(0, 10).map((c, index) => {
                    const companyId = c.companyId ?? c.id ?? index;
                    const companyName = c.companyName ?? c.name ?? "Unknown";
                    const countryName = c.countryName ?? c.country ?? "Unknown";
                    return (
                      <tr
                        key={companyId}
                        className="border-b border-gray-100 hover:bg-[#eef3ff]"
                      >
                        <td className="text-left pr-1 py-[3px]">{index + 1}</td>
                        <td className="text-left pr-1 py-[3px]">
                          <Link
                            href={`/company/${companyId}`}
                            className="text-blue-700 hover:underline"
                          >
                            {companyName}
                          </Link>
                        </td>
                        <td className="text-left pr-1 py-[3px]">
                          <Link
                            href={`/country/${c.countryId}`}
                            className="text-blue-700 hover:underline"
                          >
                            {countryName}
                          </Link>
                        </td>
                        <td className="text-left pr-1 py-[3px]">
                          {c.industry}
                        </td>
                        <td className="text-right pr-1 py-[3px]">
                          {formatScore(c.outputScore)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </section>
        </div>

        {/* RIGHT COLUMN – headlines + top people */}
        <div className="col-span-12 md:col-span-3 flex flex-col gap-4">
          {/* League headlines */}
          <section>
            <h2 className="text-[11px] font-semibold mb-1 text-gray-800">
              League headlines
            </h2>
            {headlines.length === 0 ? (
              <p className="text-[11px] text-gray-500">
                Sim a year to generate headlines.
              </p>
            ) : (
              <div className="space-y-2">
                {headlines.map((h) => (
                  <div
                    key={h.id}
                    className="border border-gray-200 rounded px-2 py-1.5 text-[11px] bg-white"
                  >
                    <div className="font-semibold text-blue-800 mb-[1px]">
                      {h.title}
                    </div>
                    <div className="text-gray-600 leading-snug">
                      {h.subtitle}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Top people / sample */}
          <section>
            <h2 className="text-[11px] font-semibold mb-1 text-gray-800">
              People (notable sample)
            </h2>
            {topPeople.length === 0 ? (
              <p className="text-[11px] text-gray-500">
                People sample will appear once the world is seeded.
              </p>
            ) : (
              <ul className="space-y-[2px]">
                {topPeople.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/person/${p.id}`}
                      className="text-blue-700 hover:underline"
                    >
                      {p.name}
                    </Link>{" "}
                    <span className="text-gray-600">
                      — age {p.age} — country {p.countryName}
                      {typeof p.contributionScore === "number"
                        ? ` — contrib ${Math.round(p.contributionScore)}`
                        : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// Small helper components & functions
// ------------------------------------------------------------------

function TrendGlyph({ trend }: { trend: CountryStanding["trend"] }) {
  if (trend === "up") {
    return <span className="text-[10px] text-emerald-600">▲</span>;
  }
  if (trend === "down") {
    return <span className="text-[10px] text-red-500">▼</span>;
  }
  if (trend === "new") {
    return <span className="text-[10px] text-gray-500">•</span>;
  }
  return <span className="text-[10px] text-gray-400">–</span>;
}

function getStandingsCountriesFromAny(
  raw: StandingsResponse | CountryStanding[] | null | undefined
): CountryStanding[] {
  if (!raw) return [];

  if (Array.isArray(raw)) {
    // API returned a bare array
    return raw as CountryStanding[];
  }

  const anyRaw = raw as any;

  if (Array.isArray(anyRaw.countries)) {
    return anyRaw.countries as CountryStanding[];
  }
  if (Array.isArray(anyRaw.rows)) {
    return anyRaw.rows as CountryStanding[];
  }
  if (Array.isArray(anyRaw.standings)) {
    return anyRaw.standings as CountryStanding[];
  }

  return [];
}

function formatScore(value: unknown): string {
  if (value == null) return "—";
  const num =
    typeof value === "number"
      ? value
      : Number(value);
  if (!Number.isFinite(num)) return "—";
  return Math.round(num).toString();
}

function computeWorldStats(
  countries: CountryStanding[],
  year: number | null
):
  | {
      avgCompanyOutput: number;
      lastChampionName: string | null;
      bestGovernmentScoreName: string | null;
      bestGovernmentScoreValue: number;
      countriesWithGovScore: number;
      totalCountries: number;
    }
  | null {
  if (!countries || countries.length === 0) return null;

  const totalCountries = countries.length;

  // average company output based on companyScore (treat missing / NaN as 0)
  const avgCompanyOutput =
    countries.reduce((sum, c) => {
      const raw = (c as any).companyScore;
      const companyScore =
        typeof raw === "number" && Number.isFinite(raw) ? raw : 0;
      return sum + companyScore;
    }, 0) / Math.max(1, totalCountries);

  // last champion: look through history for champion in most recent year < current year
  let lastChampionName: string | null = null;
  let bestYear = -Infinity;
  for (const c of countries) {
    const history = c.history ?? [];
    for (const h of history) {
      if (
        h.isChampion &&
        h.year > bestYear &&
        (year === null || h.year < year)
      ) {
        bestYear = h.year;
        lastChampionName = c.countryName;
      }
    }
  }

  // best government score (handle missing / NaN)
  let bestGovernmentScoreName: string | null = null;
  let bestGovernmentScoreValue = -Infinity;
  let countriesWithGovScore = 0;

  for (const c of countries) {
    const raw = (c as any).governmentScore;
    const govScore =
      typeof raw === "number" && Number.isFinite(raw) ? raw : 0;

    if (govScore > 0) {
      countriesWithGovScore += 1;
    }
    if (govScore > bestGovernmentScoreValue) {
      bestGovernmentScoreValue = govScore;
      bestGovernmentScoreName = c.countryName;
    }
  }

  if (bestGovernmentScoreValue === -Infinity) {
    bestGovernmentScoreValue = 0;
    bestGovernmentScoreName = null;
  }

  return {
    avgCompanyOutput,
    lastChampionName,
    bestGovernmentScoreName,
    bestGovernmentScoreValue,
    countriesWithGovScore,
    totalCountries,
  };
}

function buildHeadlines(
  world: WorldSummaryResponse,
  countries: CountryStanding[],
  year: number | null,
  topCompanies: TopCompany[]
): Headline[] {
  const result: Headline[] = [];

  if (countries.length > 0 && year !== null) {
    const sorted = [...countries].sort(
      (a, b) => a.currentRank - b.currentRank
    );
    const top = sorted[0];

    result.push({
      id: "top-country",
      title: `${top.countryName} on top`,
      subtitle: `Currently ranked #1 in Year ${year} with total score ${formatScore(
        top.totalScore
      )}.`,
    });

    const last = sorted[sorted.length - 1];
    result.push({
      id: "bottom-country",
      title: `${last.countryName} struggling`,
      subtitle: `Ranked last (${last.currentRank}/${sorted.length}) in Year ${year}.`,
    });
  }

  if (topCompanies.length > 0) {
    const topCompany = topCompanies[0];
    const cName =
      topCompany.companyName ?? topCompany.name ?? "Unknown company";
    const countryName =
      topCompany.countryName ?? topCompany.country ?? "Unknown country";

    result.push({
      id: "top-company",
      title: `${cName} leads ${topCompany.industry}`,
      subtitle: `Top company this year with output score ${formatScore(
        topCompany.outputScore
      )} (${countryName}).`,
    });
  }

  if (result.length === 0) {
    result.push({
      id: "seed",
      title: "World seeded",
      subtitle: `Sim a year to generate standings, headlines, and history for ${world.name}.`,
    });
  }

  return result;
}
