// src/components/world/PlayerCountryLeaders.tsx
"use client";

import Link from "next/link";
import { SectionHeader } from "@/components/ui/SectionHeader";

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
  // Little grey bar icon, BBGM-style
  return (
    <span className="inline-block h-[10px] w-[8px] rounded-[2px] bg-gray-300 align-middle mr-1" />
  );
}

export function PlayerCountryLeaders({ leaders }: Props) {
  const top = leaders.slice(0, 3);

  return (
    <div>
      <SectionHeader>Country leaders</SectionHeader>
      {top.length === 0 ? (
        <p className="mt-1 text-[11px] text-gray-600">
          Sim a year to surface standout people in your country.
        </p>
      ) : (
        <ul className="mt-1 space-y-0.5 text-[11px]">
          {top.map((p) => (
            <li key={p.id}>
              <Link
                href={`/person/${p.id}`}
                className="text-blue-700 hover:underline"
              >
                {p.name}
              </Link>
              <span className="ml-1 text-gray-600">
                <StatPip />
                age {p.age}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
