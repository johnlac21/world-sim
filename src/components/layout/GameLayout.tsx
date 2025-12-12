// src/components/layout/GameLayout.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

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

  const [simMenuOpen, setSimMenuOpen] = useState(false);
  const [simMenuPos, setSimMenuPos] = useState<{ top: number; left: number } | null>(null);

  const simButtonRef = useRef<HTMLDivElement | null>(null);
  const simMenuRef = useRef<HTMLDivElement | null>(null);

  // Close Sim menu when clicking outside
  useEffect(() => {
    if (!simMenuOpen) return;

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        simMenuRef.current &&
        !simMenuRef.current.contains(target) &&
        simButtonRef.current &&
        !simButtonRef.current.contains(target)
      ) {
        setSimMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [simMenuOpen]);

  // Fetch world summary
  useEffect(() => {
    let cancelled = false;

    async function fetchWorld() {
      try {
        setLoadingWorld(true);
        const res = await fetch('/api/world');
        if (!res.ok) return;
        const json = (await res.json()) as WorldSummary;
        if (!cancelled) {
          setWorld({
            id: json.id,
            name: json.name,
            currentYear: json.currentYear,
          });
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoadingWorld(false);
      }
    }

    fetchWorld();
    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch player-country summary
  useEffect(() => {
    let cancelled = false;

    async function fetchPlayerCountry() {
      try {
        const res = await fetch('/api/player-country');
        if (!res.ok) return;
        const json = (await res.json()) as PlayerCountrySummary;
        if (!cancelled) {
          setPlayerCountry({
            name: json.name,
            worldId: json.worldId,
            countryId: json.countryId,
          });
        }
      } catch {
        // ignore
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
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const handleSimOneYear = async () => {
    try {
      setSimLoading(true);
      await fetch('/api/sim/year', { method: 'POST' });
      window.location.reload();
    } finally {
      setSimLoading(false);
    }
  };

  const handleResetWorld = async () => {
    const confirmReset = window.confirm(
      'Reset world and wipe all history? This cannot be undone.',
    );
    if (!confirmReset) return;

    try {
      setResetLoading(true);
      await fetch('/api/world/reset', { method: 'POST' });
      window.location.reload();
    } finally {
      setResetLoading(false);
    }
  };

  const toggleSimMenu = () => {
    if (simMenuOpen) {
      setSimMenuOpen(false);
      return;
    }

    if (simButtonRef.current) {
      const rect = simButtonRef.current.getBoundingClientRect();
      setSimMenuPos({
        top: rect.bottom, // pixel position in viewport
        left: rect.left,
      });
    }
    setSimMenuOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#f2f2f2] text-[#222222]">
      {/* Top navigation bar */}
      <header className="border-b border-gray-200 bg-white">
        <div className="flex h-12 items-center px-3 md:px-4">
          {/* LEFT: logo + title + Sim dropdown */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-1">
              <span className="text-lg">🌍</span>
              <span className="text-sm font-semibold tracking-tight">
                World Sim BBGM
              </span>
            </Link>

            <div ref={simButtonRef}>
              <div
                role="button"
                tabIndex={0}
                onClick={toggleSimMenu}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleSimMenu();
                  }
                }}
                className="cursor-pointer text-[12px] font-semibold"
                style={{
                  backgroundColor: '#16a34a', // green-600
                  color: '#ffffff',
                  borderRadius: 4,
                  padding: '0.35rem 0.75rem',
                  border: '1px solid #15803d', // darker green
                  height: '28px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  lineHeight: 1.2,
                }}
              >
                Sim
                <span className="ml-1 text-[10px]">▾</span>
              </div>
            </div>
          </div>

          {/* CENTER: world name + year */}
          <div className="flex flex-1 items-center justify-center text-xs text-gray-600">
            {world ? (
              <>
                <span className="font-medium">{world.name}</span>
                <span className="ml-1">· Year {world.currentYear}</span>
              </>
            ) : loadingWorld ? (
              <span className="italic text-gray-400">Loading world…</span>
            ) : (
              <span className="italic text-gray-400">World overview</span>
            )}
          </div>

          {/* RIGHT: My Country + search */}
          <div className="flex items-center gap-2">
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
        </div>
      </header>

      {/* Sim dropdown: FIXED, so it never changes header layout */}
      {simMenuOpen && simMenuPos && (
        <div
          ref={simMenuRef}
          className="fixed w-44 rounded border border-gray-200 bg-white text-[12px] shadow-lg"
          style={{
            top: simMenuPos.top,
            left: simMenuPos.left,
            zIndex: 1000,
          }}
        >
          <button
            type="button"
            onClick={() => {
              setSimMenuOpen(false);
              handleSimOneYear();
            }}
            disabled={simLoading}
            className="block w-full px-3 py-1.5 text-left hover:bg-gray-50 disabled:opacity-60"
          >
            {simLoading ? 'Sim…' : 'Sim 1 year'}
          </button>
          <button
            type="button"
            onClick={() => {
              setSimMenuOpen(false);
              handleResetWorld();
            }}
            disabled={resetLoading}
            className="block w-full px-3 py-1.5 text-left text-red-700 hover:bg-red-50 disabled:opacity-60"
          >
            {resetLoading ? 'Resetting…' : 'Reset world'}
          </button>
        </div>
      )}

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
            <SidebarLink
              href={`/world/${worldId}/standings#top-companies`}
              label="Top Companies"
              active={
                pathname.startsWith(`/world/${worldId}/standings`) &&
                pathname.includes('top-companies')
              }
              subtle
            />
          </SidebarSection>

          {/* COUNTRY section */}
          <SidebarSection title="COUNTRY">
            <SidebarLink
              href="/player"
              label="Dashboard"
              active={isActive('/player')}
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
              active={isActive('/player/youth')}
            />
            <SidebarLink
              href="/leaders"
              label="Leaders"
              active={isActive('/leaders')}
            />
          </SidebarSection>

          {/* COMPANIES section */}
          <SidebarSection title="COMPANIES">
            <SidebarLink
              href={`/world/${worldId}/standings#companies`}
              label="All Companies"
              active={
                pathname.startsWith(`/world/${worldId}/standings`) &&
                pathname.includes('companies')
              }
              subtle
            />
          </SidebarSection>
        </aside>

        {/* Main content area */}
        <main className="min-h-[calc(100vh-3rem)] flex-1 bg-[#f2f2f2]">
          <div className="mx-auto max-w-6xl border-x border-gray-200 bg-white px-3 py-3 md:px-4 md:py-4">
            {children}
          </div>
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
        'flex items-center rounded px-2 py-1 text-[13px]',
        active
          ? 'bg-blue-50 font-semibold text-blue-700'
          : subtle
          ? 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
          : 'text-gray-700 hover:bg-gray-50',
      ].join(' ')}
    >
      {label}
    </Link>
  );
}
