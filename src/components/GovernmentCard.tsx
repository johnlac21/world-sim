// src/components/GovernmentCard.tsx
import Link from "next/link";
import type { GovernmentOfficeSummary } from "@/lib/government";
import { Panel, PanelHeader } from "@/components/ui/Panel";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  Th,
  Td,
} from "@/components/ui/Table";
import { StatBadge } from "@/components/ui/StatBadge";

type Props = {
  offices: GovernmentOfficeSummary[];
};

function formatTermRemaining(termYearsRemaining: number | null): string {
  if (termYearsRemaining == null) return "—";
  if (termYearsRemaining <= 0) return "Term ending";
  if (termYearsRemaining === 1) return "1 year left";
  return `${termYearsRemaining} years left`;
}

function formatFitScore(score: number | null): string {
  if (score == null || !Number.isFinite(score)) return "—";
  return `${Math.round(score)}/100`;
}

export function GovernmentCard({ offices }: Props) {
  return (
    <Panel>
      <PanelHeader
        title="Government"
        subtitle="Key offices & leadership quality"
      />

      {offices.length === 0 ? (
        <p className="text-sm text-gray-500">
          No government offices defined for this country yet.
        </p>
      ) : (
        <Table dense>
          <TableHead>
            <tr>
              <Th>Office</Th>
              <Th>Holder</Th>
              <Th>Fit</Th>
              <Th>Term</Th>
            </tr>
          </TableHead>
          <TableBody>
            {offices.map((o, idx) => (
              <TableRow key={`${o.officeId}-${idx}`}>
                <Td>
                  <Link
                    href={`/office/${o.officeId}`}
                    className="font-medium text-blue-600 hover:underline"
                  >
                    {o.officeName}
                  </Link>
                  {o.prestige > 0 && (
                    <span className="ml-1 text-xs text-gray-400">
                      (Prestige {o.prestige})
                    </span>
                  )}
                </Td>

                <Td>
                  {o.holderId && o.holderName ? (
                    <Link
                      href={`/person/${o.holderId}`}
                      className="text-blue-600 hover:underline"
                    >
                      {o.holderName}
                    </Link>
                  ) : (
                    <span className="text-gray-400">Vacant</span>
                  )}
                </Td>

                <Td>
                  <StatBadge
                    label={formatFitScore(o.fitScore)}
                    variant="neutral"
                  />
                </Td>

                <Td className="text-xs text-gray-600">
                  {formatTermRemaining(o.termYearsRemaining)}
                </Td>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Panel>
  );
}
