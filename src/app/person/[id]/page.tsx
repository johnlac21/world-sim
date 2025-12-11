"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { SectionHeader } from "@/components/ui/SectionHeader";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/Panel";
import { StatPill } from "@/components/ui/StatPill";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  Th,
  Td,
} from "@/components/ui/Table";

// === STAT BLOCK ===
type StatBlock = {
  // Cognitive
  intelligence: number;
  memory: number;
  creativity: number;
  discipline: number;
  judgment: number;
  adaptability: number;

  // Social / Influence
  charisma: number;
  leadership: number;
  empathy: number;
  communication: number;
  confidence: number;
  negotiation: number;

  // Physical
  strength: number;
  endurance: number;
  athleticism: number;
  vitality: number;
  reflexes: number;
  appearance: number;

  // Personality
  ambition: number;
  integrity: number;
  riskTaking: number;
  patience: number;
  agreeableness: number;
  stability: number;
};

type Job = {
  id: number;
  title: string;
  companyId: number;
  companyName: string;
  salary: number;
  startYear: number;
  endYear: number | null;
};

type Enrollment = {
  id: number;
  schoolName: string;
  level: string;
  startYear: number;
  endYear: number | null;
};

type Spouse = {
  marriageId: number;
  spouseId: number;
  spouseName: string;
  startYear: number;
  endYear: number | null;
};

type PersonPerformanceYear = {
  year: number;
  companyId: number;
  companyName: string;
  industry: string;
  talentScore: number;
  leadershipScore: number;
  reliabilityScore: number;
  contributionScore: number;
};

type RoleHistoryRow = {
  id: number;
  companyId: number;
  companyName: string;
  roleName: string;
  industry: string;
  startYear: number;
  endYear: number | null;
};

type OfficeHistoryRow = {
  id: number;
  officeName: string;
  level: string;
  countryName: string | null;
  startYear: number;
  endYear: number | null;
};

type PersonPayload = {
  id: number;
  name: string;
  worldName: string;
  countryName: string | null;
  birthYear: number;
  age: number;
  isAlive: boolean;
  isPlayer: boolean;

  personalityArchetype: string;
  personalitySubtype: string;

  stats: StatBlock;

  currentJob: {
    title: string;
    companyId: number;
    companyName: string;
    salary: number;
    startYear: number;
  } | null;

  pastJobs: Job[];

  currentEnrollment: {
    schoolName: string;
    level: string;
    startYear: number;
  } | null;

  pastEnrollments: Enrollment[];

  spouses: Spouse[];

  personYearPerformanceHistory: PersonPerformanceYear[];

  roleHistory: RoleHistoryRow[];
  officeHistory: OfficeHistoryRow[];
};

// layout for grouped rendering
const STAT_LAYOUT: Record<string, { key: keyof StatBlock; label: string }[]> = {
  Cognitive: [
    { key: "intelligence", label: "Intelligence" },
    { key: "memory", label: "Memory" },
    { key: "creativity", label: "Creativity" },
    { key: "discipline", label: "Discipline" },
    { key: "judgment", label: "Judgment" },
    { key: "adaptability", label: "Adaptability" },
  ],
  "Social / Influence": [
    { key: "charisma", label: "Charisma" },
    { key: "leadership", label: "Leadership" },
    { key: "empathy", label: "Empathy" },
    { key: "communication", label: "Communication" },
    { key: "confidence", label: "Confidence" },
    { key: "negotiation", label: "Negotiation" },
  ],
  Physical: [
    { key: "strength", label: "Strength" },
    { key: "endurance", label: "Endurance" },
    { key: "athleticism", label: "Athleticism" },
    { key: "vitality", label: "Vitality" },
    { key: "reflexes", label: "Reflexes" },
    { key: "appearance", label: "Appearance" },
  ],
  Personality: [
    { key: "ambition", label: "Ambition" },
    { key: "integrity", label: "Integrity" },
    { key: "riskTaking", label: "Risk taking" },
    { key: "patience", label: "Patience" },
    { key: "agreeableness", label: "Agreeableness" },
    { key: "stability", label: "Emotional stability" },
  ],
};

export default function PersonPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [data, setData] = useState<PersonPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const res = await fetch(`/api/person/${id}`);
        const json = (await res.json()) as PersonPayload & { error?: string };
        if ((json as any).error) {
          setData(null);
        } else {
          setData(json);
        }
      } catch (err) {
        console.error(err);
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <main className="px-3 py-4 md:px-4">
        <p className="text-sm text-gray-600">Loading person…</p>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="px-3 py-4 md:px-4 space-y-2">
        <p className="text-sm text-red-600">Person not found.</p>
        <Link href="/" className="text-blue-600 underline text-sm">
          ← Back to world
        </Link>
      </main>
    );
  }

  const {
    stats,
    personYearPerformanceHistory,
    roleHistory,
    officeHistory,
    pastJobs,
    pastEnrollments,
  } = data;

  const descriptionPieces: string[] = [];
  descriptionPieces.push(`Age ${data.age}${data.isAlive ? "" : " (deceased)"}`);
  descriptionPieces.push(`World: ${data.worldName}`);
  if (data.countryName) descriptionPieces.push(`Country: ${data.countryName}`);
  descriptionPieces.push(`Born in year ${data.birthYear}`);

  const perfYears = personYearPerformanceHistory.length;
  const bestYear =
    perfYears > 0
      ? personYearPerformanceHistory.reduce((best, row) =>
          row.contributionScore > best.contributionScore ? row : best,
        )
      : null;
  const maxContribution =
    perfYears > 0
      ? Math.max(
          ...personYearPerformanceHistory.map((p) => p.contributionScore),
        )
      : 0;

  return (
    <main className="px-3 py-4 md:px-4 md:py-6 space-y-4">
      <SectionHeader
        title={data.name}
        eyebrow={data.isPlayer ? "Player-controlled person" : "Person"}
        description={descriptionPieces.join(" · ")}
        backHref="/"
        backLabel="Back to world"
      >
        <p className="mt-1 text-sm text-gray-700">
          <span className="font-semibold">Personality:</span>{" "}
          {data.personalityArchetype} — {data.personalitySubtype}
        </p>
      </SectionHeader>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1.3fr)] lg:gap-6">
        {/* LEFT COLUMN: core card — stats, personality, performance */}
        <section className="space-y-4">
          {/* Attributes grid */}
          <Panel>
            <PanelHeader
              title="Attributes"
              subtitle="Core cognitive, social, physical, and personality stats."
            />
            <PanelBody>
              <div className="grid gap-4 md:grid-cols-2">
                {Object.entries(STAT_LAYOUT).map(([groupName, groupStats]) => (
                  <div
                    key={groupName}
                    className="rounded-xl border border-gray-200 bg-white/80 p-3"
                  >
                    <h3 className="font-semibold text-xs mb-2 text-gray-600 uppercase tracking-wide">
                      {groupName}
                    </h3>
                    <div className="space-y-1">
                      {groupStats.map(({ key, label }) => (
                        <StatPill
                          key={key}
                          label={label}
                          value={stats[key]}
                          max={20} // your stat scale
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </PanelBody>
          </Panel>

          {/* Yearly performance chart + summary */}
          <Panel>
            <PanelHeader
              title="Yearly Performance"
              subtitle="PersonYearPerformance: contribution to company output over time."
            />
            <PanelBody>
              {perfYears === 0 ? (
                <p className="text-sm text-gray-600">
                  No yearly performance data yet — simulate more seasons to see
                  career impact.
                </p>
              ) : (
                <>
                  {/* mini bar chart, similar to company page */}
                  <div className="mb-3">
                    <div
                      className="flex items-end gap-2"
                      style={{ height: 120 }}
                    >
                      {personYearPerformanceHistory.map((row) => {
                        const raw = row.contributionScore;
                        const max = maxContribution || raw || 1;
                        let barHeight = Math.round((raw / max) * 110);
                        if (barHeight > 0 && barHeight < 8) barHeight = 8;
                        if (barHeight < 0) barHeight = 0;

                        return (
                          <div
                            key={row.year}
                            className="flex flex-col items-center flex-1"
                          >
                            <div
                              className="w-4 rounded-t bg-blue-500"
                              style={{ height: barHeight }}
                              aria-label={`Year ${row.year} contribution ${raw.toFixed(
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

                  {/* summary row */}
                  <div className="grid gap-2 text-xs text-gray-700 md:grid-cols-3">
                    <div>
                      <div className="font-semibold uppercase tracking-wide text-[11px] text-gray-500">
                        Seasons Logged
                      </div>
                      <div className="mt-0.5 text-sm font-mono">
                        {perfYears}
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold uppercase tracking-wide text-[11px] text-gray-500">
                        Peak Contribution
                      </div>
                      {bestYear && (
                        <div className="mt-0.5 text-sm">
                          <span className="font-mono">
                            {bestYear.contributionScore.toFixed(1)}
                          </span>{" "}
                          in{" "}
                          <span className="font-semibold">
                            {bestYear.year}
                          </span>{" "}
                          at{" "}
                          <Link
                            href={`/company/${bestYear.companyId}`}
                            className="text-blue-600 hover:underline"
                          >
                            {bestYear.companyName}
                          </Link>
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-semibold uppercase tracking-wide text-[11px] text-gray-500">
                        Industries
                      </div>
                      <div className="mt-0.5 text-sm">
                        {Array.from(
                          new Set(
                            personYearPerformanceHistory.map(
                              (p) => p.industry,
                            ),
                          ),
                        ).join(" · ")}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </PanelBody>
          </Panel>
        </section>

        {/* RIGHT COLUMN: quick facts, career, education, roles, offices, relationships */}
        <aside className="space-y-4">
          {/* Quick facts card */}
          <Panel>
            <PanelHeader title="Quick Facts" />
            <PanelBody>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-gray-700">
                <div>
                  <dt className="font-semibold text-gray-500 uppercase text-[11px]">
                    Age
                  </dt>
                  <dd className="mt-0.5 text-sm">
                    {data.age} {data.isAlive ? "" : "(deceased)"}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-gray-500 uppercase text-[11px]">
                    Country
                  </dt>
                  <dd className="mt-0.5 text-sm">
                    {data.countryName ?? "No country"}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-gray-500 uppercase text-[11px]">
                    Birth Year
                  </dt>
                  <dd className="mt-0.5 text-sm">{data.birthYear}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-gray-500 uppercase text-[11px]">
                    World
                  </dt>
                  <dd className="mt-0.5 text-sm">{data.worldName}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-gray-500 uppercase text-[11px]">
                    Current Job
                  </dt>
                  <dd className="mt-0.5 text-sm">
                    {data.currentJob ? (
                      <>
                        {data.currentJob.title} at{" "}
                        <Link
                          href={`/company/${data.currentJob.companyId}`}
                          className="text-blue-600 hover:underline"
                        >
                          {data.currentJob.companyName}
                        </Link>
                      </>
                    ) : (
                      "Unemployed"
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-gray-500 uppercase text-[11px]">
                    Current School
                  </dt>
                  <dd className="mt-0.5 text-sm">
                    {data.currentEnrollment ? (
                      <>
                        {data.currentEnrollment.schoolName} (
                        {data.currentEnrollment.level})
                      </>
                    ) : (
                      "Not enrolled"
                    )}
                  </dd>
                </div>
              </dl>
            </PanelBody>
          </Panel>

          {/* Employment history table */}
          <Panel>
            <PanelHeader title="Employment History" />
            <PanelBody>
              {!data.currentJob && pastJobs.length === 0 ? (
                <p className="text-sm text-gray-600">
                  No recorded employment yet.
                </p>
              ) : (
                <Table dense>
                  <TableHead>
                    <tr>
                      <Th>Years</Th>
                      <Th>Company</Th>
                      <Th>Title</Th>
                      <Th align="right">Salary</Th>
                    </tr>
                  </TableHead>
                  <TableBody>
                    {data.currentJob && (
                      <TableRow>
                        <Td className="text-xs text-gray-600">
                          {data.currentJob.startYear}–present
                        </Td>
                        <Td>
                          <Link
                            href={`/company/${data.currentJob.companyId}`}
                            className="text-xs text-blue-700 hover:underline"
                          >
                            {data.currentJob.companyName}
                          </Link>
                        </Td>
                        <Td className="text-xs">
                          {data.currentJob.title}
                        </Td>
                        <Td
                          align="right"
                          className="text-xs font-mono"
                        >
                          {data.currentJob.salary.toLocaleString()}
                        </Td>
                      </TableRow>
                    )}
                    {pastJobs.map((j) => (
                      <TableRow key={j.id}>
                        <Td className="text-xs text-gray-600">
                          {j.startYear}
                          {j.endYear != null ? `–${j.endYear}` : ""}
                        </Td>
                        <Td>
                          <Link
                            href={`/company/${j.companyId}`}
                            className="text-xs text-blue-700 hover:underline"
                          >
                            {j.companyName}
                          </Link>
                        </Td>
                        <Td className="text-xs">{j.title}</Td>
                        <Td
                          align="right"
                          className="text-xs font-mono"
                        >
                          {j.salary.toLocaleString()}
                        </Td>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </PanelBody>
          </Panel>

          {/* Education history table */}
          <Panel>
            <PanelHeader title="Education History" />
            <PanelBody>
              {!data.currentEnrollment && pastEnrollments.length === 0 ? (
                <p className="text-sm text-gray-600">
                  No recorded education history.
                </p>
              ) : (
                <Table dense>
                  <TableHead>
                    <tr>
                      <Th>Years</Th>
                      <Th>School</Th>
                      <Th>Level</Th>
                    </tr>
                  </TableHead>
                  <TableBody>
                    {data.currentEnrollment && (
                      <TableRow>
                        <Td className="text-xs text-gray-600">
                          {data.currentEnrollment.startYear}–present
                        </Td>
                        <Td className="text-xs">
                          {data.currentEnrollment.schoolName}
                        </Td>
                        <Td className="text-xs">
                          {data.currentEnrollment.level}
                        </Td>
                      </TableRow>
                    )}
                    {pastEnrollments.map((e) => (
                      <TableRow key={e.id}>
                        <Td className="text-xs text-gray-600">
                          {e.startYear}
                          {e.endYear != null ? `–${e.endYear}` : ""}
                        </Td>
                        <Td className="text-xs">{e.schoolName}</Td>
                        <Td className="text-xs">{e.level}</Td>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </PanelBody>
          </Panel>

          {/* Role history (company hierarchy positions) */}
          <Panel>
            <PanelHeader title="Role History" />
            <PanelBody>
              {roleHistory.length === 0 ? (
                <p className="text-sm text-gray-600">
                  No recorded hierarchy roles yet.
                </p>
              ) : (
                <Table dense>
                  <TableHead>
                    <tr>
                      <Th>Years</Th>
                      <Th>Company</Th>
                      <Th>Role</Th>
                      <Th>Industry</Th>
                    </tr>
                  </TableHead>
                  <TableBody>
                    {roleHistory.map((r) => (
                      <TableRow key={r.id}>
                        <Td className="text-xs text-gray-600">
                          {r.startYear}
                          {r.endYear != null ? `–${r.endYear}` : ""}
                        </Td>
                        <Td>
                          <Link
                            href={`/company/${r.companyId}`}
                            className="text-xs text-blue-700 hover:underline"
                          >
                            {r.companyName}
                          </Link>
                        </Td>
                        <Td className="text-xs">{r.roleName}</Td>
                        <Td className="text-xs text-gray-700">
                          {r.industry}
                        </Td>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </PanelBody>
          </Panel>

          {/* Office history (political offices / terms) */}
          <Panel>
            <PanelHeader title="Office History" />
            <PanelBody>
              {officeHistory.length === 0 ? (
                <p className="text-sm text-gray-600">
                  No political offices recorded.
                </p>
              ) : (
                <Table dense>
                  <TableHead>
                    <tr>
                      <Th>Years</Th>
                      <Th>Office</Th>
                      <Th>Scope</Th>
                    </tr>
                  </TableHead>
                  <TableBody>
                    {officeHistory.map((o) => (
                      <TableRow key={o.id}>
                        <Td className="text-xs text-gray-600">
                          {o.startYear}
                          {o.endYear != null ? `–${o.endYear}` : ""}
                        </Td>
                        <Td className="text-xs">{o.officeName}</Td>
                        <Td className="text-xs text-gray-700">
                          {o.level}
                          {o.countryName ? ` · ${o.countryName}` : ""}
                        </Td>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </PanelBody>
          </Panel>

          {/* Relationships */}
          <Panel>
            <PanelHeader title="Relationships" />
            <PanelBody>
              {data.spouses.length === 0 ? (
                <p className="text-sm text-gray-600">
                  No recorded marriages.
                </p>
              ) : (
                <ul className="list-disc ml-5 text-sm space-y-0.5">
                  {data.spouses.map((s) => (
                    <li key={s.marriageId}>
                      <Link
                        href={`/person/${s.spouseId}`}
                        className="text-blue-600 hover:underline"
                      >
                        {s.spouseName}
                      </Link>{" "}
                      — married {s.startYear}
                      {s.endYear != null ? `–${s.endYear}` : ""}
                    </li>
                  ))}
                </ul>
              )}
            </PanelBody>
          </Panel>
        </aside>
      </div>
    </main>
  );
}
