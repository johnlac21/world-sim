// src/components/GovernmentCard.tsx
import Link from 'next/link';
import type { GovernmentOfficeSummary } from '@/lib/government';

type Props = {
  offices: GovernmentOfficeSummary[];
};

function formatTermRemaining(termYearsRemaining: number | null): string {
  if (termYearsRemaining == null) return '—';
  if (termYearsRemaining <= 0) return 'Term ending';
  if (termYearsRemaining === 1) return '1 year left';
  return `${termYearsRemaining} years left`;
}

function formatFitScore(score: number | null): string {
  if (score == null) return '—';
  return `${Math.round(score)}/100`;
}

export function GovernmentCard({ offices }: Props) {
  return (
    <div className="rounded-xl border p-4 shadow-sm bg-white/80">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-lg font-semibold">Government</h2>
        <span className="text-xs text-gray-500">
          Key offices &amp; leadership quality
        </span>
      </div>

      {offices.length === 0 ? (
        <p className="text-sm text-gray-500">
          No government offices defined for this country yet.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b text-xs uppercase text-gray-500">
                <th className="py-1 pr-4">Office</th>
                <th className="py-1 pr-4">Holder</th>
                <th className="py-1 pr-4">Fit</th>
                <th className="py-1 pr-2">Term</th>
              </tr>
            </thead>
            <tbody>
              {offices.map((o) => (
                <tr key={o.officeId} className="border-b last:border-0">
                  <td className="py-1 pr-4">
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
                  </td>

                  <td className="py-1 pr-4">
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
                  </td>

                  <td className="py-1 pr-4">
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs">
                      {formatFitScore(o.fitScore)}
                    </span>
                  </td>

                  <td className="py-1 pr-2 text-xs text-gray-600">
                    {formatTermRemaining(o.termYearsRemaining)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
