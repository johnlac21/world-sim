// src/components/layout/GameLayout.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

type WorldSummary = {
  id: number;
  name: string;
  currentYear: number;
};

type PlayerCountrySummary = {
  name: string;
  worldId: number;
  countryId: number;
};

type Props = {
  children: React.ReactNode;
};

export function GameLayout({ children }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  const [world, setWorld] = useState<WorldSummary | null>(null);
  const [playerCountry, setPlayerCountry] =
    useState<PlayerCountrySummary | null>(null);
  const [loadingWorld, setLoadingWorld] = useState(false);
  const [simLoading, setSimLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  // Fetch world summary for header + worldId
  useEffect(() => {
    let cancelled = false;

    async function fetchWorld() {
      try {
        setLoadingWorld(true);
        const res = await fetch("/api/world");
        if (!res.ok) return;
        const json = (await res.json()) as { id: number; name: string; currentYear: number };
        if (!cancelled) {
          setWorld({
            id: json.id,
            name: json.name,
            currentYear: json.currentYear,
          });
        }
      } catch {
        // fail silently; header will just be generic
      } finally {
        if (!cancelled) setLoadingWorld(false);
      }
    }

    fetchWorld();
    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch player-country summary so we can build country nav links
  useEffect(() => {
    let cancelled = false;

    async function fetchPlayerCountry() {
      try {
        const res = await fetch("/api/player-country");
        if (!res.ok) return;
        const json = (await res.json()) as {
          name: string;
          worldId: number;
          countryId: number;
        };
        if (!cancelled) {
          setPlayerCountry({
            name: json.name,
            worldId: json.worldId,
            countryId: json.countryId,
          });
        }
      } catch {
        // ignore; nav still works with generic links
      }
    }

    fetchPlayerCountry();
    return () => {
      cancelled = true;
    };
  }, []);

  const worldId = world?.id ?? playerCountry?.worldId ?? 1;
  const countryId = playerCountry?.countryId;

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const handleSimOneYear = async () => {
    try {
      setSimLoading(true);
      await fetch("/api/sim/year", { method: "POST" });
      // Force a full reload so every page re-runs its useEffect fetches
      window.location.reload();
    } finally {
      setSimLoading(false);
    }
  };

  const handleResetWorld = async () => {
    const confirmReset = window.confirm(
      "Reset world and wipe all history? This cannot be undone."
    );
    if (!confirmReset) return;

    try {
      setResetLoading(true);
      await fetch("/api/world/reset", { method: "POST" });
      // Same idea: full reload so all data is fresh
      window.location.reload();
    } finally {
      setResetLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-[#f2f2f2] text-[#222222]">
      {/* Top navigation bar */}
      <header className="flex h-12 items-center justify-between border-b border-gray-200 bg-white px-3 md:px-4">
        {/* Left: logo + title */}
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-1">
            <span className="text-lg">🌍</span>
            <span className="text-sm font-semibold tracking-tight">
              World Sim BBGM
            </span>
          </Link>
        </div>

        {/* Center: world name + year */}
        <div className="hidden md:flex items-baseline gap-2 text-xs text-gray-600">
          {world ? (
            <>
              <span className="font-medium">{world.name}</span>
              <span>· Year {world.currentYear}</span>
            </>
          ) : loadingWorld ? (
            <span className="italic text-gray-400">Loading world…</span>
          ) : (
            <span className="italic text-gray-400">World overview</span>
          )}
        </div>

        {/* Right: sim/reset + player link + search icon */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSimOneYear}
            disabled={simLoading}
            className="hidden sm:inline-flex items-center rounded border border-gray-300 bg-white px-2 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            {simLoading ? "Sim…" : "Sim 1 Year"}
          </button>
          <button
            onClick={handleResetWorld}
            disabled={resetLoading}
            className="hidden sm:inline-flex items-center rounded border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-medium text-red-700 hover:bg-red-100 disabled:opacity-60"
          >
            {resetLoading ? "Resetting…" : "Reset World"}
          </button>

          <Link
            href="/player"
            className="inline-flex items-center rounded bg-blue-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-blue-700"
          >
            My Country
          </Link>

          <button
            type="button"
            className="ml-1 inline-flex h-7 w-7 items-center justify-center rounded-full border border-gray-300 bg-white text-xs text-gray-600 hover:bg-gray-50"
            title="Global search (people/companies)"
          >
            🔍
          </button>
        </div>
      </header>

      {/* Below: sidebar + main content */}
      <div className="flex">
        {/* Sidebar (desktop) */}
        <aside className="hidden w-56 shrink-0 border-r border-gray-200 bg-white px-3 py-3 md:block">
          {/* WORLD section */}
          <SidebarSection title="WORLD">
            <SidebarLink
              href={`/world/${worldId}/standings`}
              label="Standings"
              active={isActive(`/world/${worldId}/standings`)}
            />
            {/* Future links can piggyback on the same page via anchors */}
            <SidebarLink
              href={`/world/${worldId}/standings#top-companies`}
              label="Top Companies"
              active={
                pathname.startsWith(`/world/${worldId}/standings`) &&
                pathname.includes("top-companies")
              }
              subtle
            />
          </SidebarSection>

          {/* COUNTRY section */}
          <SidebarSection title="COUNTRY">
            <SidebarLink
              href="/player"
              label="Dashboard"
              active={isActive("/player")}
            />
            {countryId && (
              <>
                <SidebarLink
                  href={`/country/${countryId}/industry`}
                  label="Industries"
                  active={isActive(`/country/${countryId}/industry`)}
                />
                <SidebarLink
                  href={`/country/${countryId}`}
                  label="Country History"
                  active={isActive(`/country/${countryId}`)}
                  subtle
                />
              </>
            )}
          </SidebarSection>

          {/* PEOPLE section */}
          <SidebarSection title="PEOPLE">
            <SidebarLink
              href="/player/youth"
              label="Youth Pipeline"
              active={isActive("/player/youth")}
            />
            <SidebarLink
              href="/leaders"
              label="Leaders"
              active={isActive("/leaders")}
            />
          </SidebarSection>

          {/* COMPANIES section */}
          <SidebarSection title="COMPANIES">
            <SidebarLink
              href={`/world/${worldId}/standings#companies`}
              label="All Companies"
              active={
                pathname.startsWith(`/world/${worldId}/standings`) &&
                pathname.includes("companies")
              }
              subtle
            />
          </SidebarSection>
        </aside>

        {/* Main content area */}
        <main className="flex-1 min-h-[calc(100vh-3rem)] px-3 py-3 md:px-4 md:py-4">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

type SidebarSectionProps = {
  title: string;
  children: React.ReactNode;
};

function SidebarSection({ title, children }: SidebarSectionProps) {
  return (
    <div className="mb-4">
      <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
        {title}
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

type SidebarLinkProps = {
  href: string;
  label: string;
  active?: boolean;
  subtle?: boolean;
};

function SidebarLink({ href, label, active, subtle }: SidebarLinkProps) {
  return (
    <Link
      href={href}
      className={[
        "flex items-center rounded px-2 py-1 text-[13px]",
        active
          ? "bg-blue-50 font-semibold text-blue-700"
          : subtle
          ? "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
          : "text-gray-700 hover:bg-gray-50",
      ].join(" ")}
    >
      {label}
    </Link>
  );
}
