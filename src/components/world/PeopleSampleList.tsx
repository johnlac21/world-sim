// src/components/world/PeopleSampleList.tsx
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
  people: TopPerson[];
};

export function PeopleSampleList({ people }: Props) {
  return (
    <section>
      <SectionHeader>People (notable sample)</SectionHeader>
      {people.length === 0 ? (
        <p className="text-[11px] text-gray-500">
          People sample will appear once the world is seeded.
        </p>
      ) : (
        <ul className="space-y-[2px]">
          {people.map((p) => (
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
  );
}
