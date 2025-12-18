// src/components/world/GlobalLeadersTable.tsx
"use client";

import Link from "next/link";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { CountryCrest } from "@/components/ui/CountryCrest";
import { formatScore } from "@/components/ui/formatScore";

type TopPerson = {
  id: number;
  name: string;
  age: number;
  countryId: number;
  countryName: string;
  contributionScore?: number;
};

type Props = {
  leaders: TopPerson[];
};

function StatPip() {
  return (
    <span className="inline-block h-[10px] w-[8px] rounded-[2px] bg-gray-300 align-middle mr-1" />
  );
}

export function GlobalLeadersTable({ leaders }: Props) {
  const sorted = [...leaders].sort(
    (a, b) => (b.contributionScore ?? 0) - (a.contributionScore ?? 0)
  );
  const top = sorted.slice(0, 3);

  return (
    <div>
      <SectionHeader>Global leaders</SectionHeader>
      {top.length === 0 ? (
        <p className="mt-1 text-[11px] text-gray-600">
          Sim a year to generate global leaders.
        </p>
      ) : (
        <ul className="mt-1 space-y-0.5 text-[11px]">
          {top.map((p) => {
            const statLabel =
              p.contributionScore != null
                ? `contribution ${formatScore(p.contributionScore)}`
                : `age ${p.age}`;

            return (
              <li key={p.id}>
                <Link
                  href={`/person/${p.id}`}
                  className="text-blue-700 hover:underline"
                >
                  {p.name}
                </Link>
                <span className="ml-1 text-gray-600">
                  <StatPip />
                  {statLabel}
                </span>
                <span className="ml-1 text-gray-500">
                  ·
                  <span className="ml-1 inline-flex items-center gap-1">
                    <CountryCrest id={p.countryId} name={p.countryName} />
                    {p.countryName}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
