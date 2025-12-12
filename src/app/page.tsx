// src/app/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { formatScore } from "@/components/ui/formatScore";
import { CountryStandingsMini } from "@/components/world/CountryStandingsMini";
import { CountriesList } from "@/components/world/CountriesList";
import { WorldSnapshotPanel } from "@/components/world/WorldSnapshotPanel";
import { TopCountriesTable } from "@/components/world/TopCountriesTable";
import { WorldStatsPanel } from "@/components/world/WorldStatsPanel";
import { TopCompaniesTable } from "@/components/world/TopCompaniesTable";
import { LeagueHeadlines } from "@/components/world/LeagueHeadlines";
import { PeopleSampleList } from "@/components/world/PeopleSampleList";
import type { WorldStats } from "@/components/world/types";

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
  companyId?: number;
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
  contributionScore?: number;
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

        const ppl = Array.isArray(world.samplePeople) ? world.samplePeople : [];
        const derivedTopPeople: TopPerson[] = ppl
          .slice()
          .sort((a, b) => a.age - b.age)
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
      // swallow; convenience control
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

  const companyCount = world.companyCount ?? world.companiesCount ?? 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 text-xs">
      {/* Page header – BBGM league header style */}
      <h1 className="text-lg font-semibold mb-1">{world.name}</h1>
      <p className="text-[11px] text-gray-600 mb-3">
        Year {world.currentYear} · Countries: {world.countriesCount} · People:{" "}
        {world.peopleCount.toLocaleString()} · Companies:{" "}
        {companyCount.toLocaleString()}
      </p>

      {/* World-level controls */}
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
        {/* LEFT COLUMN – mini standings + countries list */}
        <div className="col-span-12 md:col-span-3 flex flex-col gap-4">
          <CountryStandingsMini
            standings={standingsCountries}
            worldId={world.id}
          />
          <CountriesList standings={standingsCountries} />
        </div>

        {/* CENTER COLUMN – snapshot, top countries, stats, top companies */}
        <div className="col-span-12 md:col-span-6 flex flex-col gap-4">
          <WorldSnapshotPanel world={world} companyCount={companyCount} />
          <TopCountriesTable countries={topCountries} />
          <WorldStatsPanel stats={worldStats} />
          <TopCompaniesTable companies={topCompanies} />
        </div>

        {/* RIGHT COLUMN – headlines + people sample */}
        <div className="col-span-12 md:col-span-3 flex flex-col gap-4">
          <LeagueHeadlines headlines={headlines} />
          <PeopleSampleList people={topPeople} />
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------

function getStandingsCountriesFromAny(
  raw: StandingsResponse | CountryStanding[] | null | undefined
): CountryStanding[] {
  if (!raw) return [];

  if (Array.isArray(raw)) {
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

function computeWorldStats(
  countries: CountryStanding[],
  year: number | null
): WorldStats | null {
  if (!countries || countries.length === 0) return null;

  const totalCountries = countries.length;

  const avgCompanyOutput =
    countries.reduce((sum, c) => {
      const raw = (c as any).companyScore;
      const companyScore =
        typeof raw === "number" && Number.isFinite(raw) ? raw : 0;
      return sum + companyScore;
    }, 0) / Math.max(1, totalCountries);

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
