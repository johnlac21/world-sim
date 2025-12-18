// src/components/ui/DataTable.tsx
import type { Key, ReactNode } from "react";

export type DataTableColumn = {
  key: string;
  label: string;
  align?: "left" | "right" | "center";
  widthClassName?: string; // e.g. "w-10"
};

export type DataTableRow = {
  key: Key;
  cells: Record<string, ReactNode>;
};

export type DataTableProps = {
  columns: DataTableColumn[];
  rows: DataTableRow[];
};

function cellAlignClass(align: DataTableColumn["align"] | undefined) {
  if (align === "right") return "text-right";
  if (align === "center") return "text-center";
  return "text-left";
}

function cellPaddingClass(align: DataTableColumn["align"] | undefined) {
  if (align === "right") return "pr-2 pl-1";
  if (align === "center") return "px-2";
  return "pl-2 pr-1";
}

export function DataTable({ columns, rows }: DataTableProps) {
  return (
    <div className="border border-gray-200 rounded-sm overflow-hidden">
      <table className="w-full border-collapse text-[11px]">
        <thead>
          <tr className="bg-gray-100 border-b border-gray-200 text-gray-700">
            {columns.map((col) => (
              <th
                key={col.key}
                className={[
                  cellAlignClass(col.align),
                  "py-1",
                  cellPaddingClass(col.align),
                  col.widthClassName ?? "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const stripe = i % 2 === 0 ? "bg-white" : "bg-gray-50";
            return (
              <tr
                key={row.key}
                className={`${stripe} border-b border-gray-200 hover:bg-[#eef3ff]`}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={[
                      cellAlignClass(col.align),
                      "py-1.5",
                      cellPaddingClass(col.align),
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {row.cells[col.key]}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
