// src/components/ui/Table.tsx
import * as React from "react";

type TableProps = {
  children: React.ReactNode;
  dense?: boolean;
  className?: string;
};

export function Table({ children, dense, className }: TableProps) {
  return (
    <table
      className={[
        "min-w-full border border-gray-200 bg-white",
        dense ? "text-xs" : "text-sm",
        className ?? "",
      ].join(" ")}
    >
      {children}
    </table>
  );
}

type TableHeadProps = {
  children: React.ReactNode;
  className?: string;
};

export function TableHead({ children, className }: TableHeadProps) {
  return (
    <thead
      className={[
        "bg-gray-50 text-[11px] font-semibold uppercase tracking-wide text-gray-500",
        className ?? "",
      ].join(" ")}
    >
      {children}
    </thead>
  );
}

type TableBodyProps = {
  children: React.ReactNode;
  className?: string;
};

export function TableBody({ children, className }: TableBodyProps) {
  // IMPORTANT: just render children; do NOT map over them.
  return (
    <tbody className={["divide-y divide-gray-100", className ?? ""].join(" ")}>
      {children}
    </tbody>
  );
}

type ThProps = {
  children: React.ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
};

export function Th({ children, align = "left", className }: ThProps) {
  const alignClass =
    align === "right"
      ? "text-right"
      : align === "center"
      ? "text-center"
      : "text-left";

  return (
    <th
      className={[
        "px-2 py-1 border-b border-gray-200",
        alignClass,
        className ?? "",
      ].join(" ")}
    >
      {children}
    </th>
  );
}

type TdProps = {
  children: React.ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
};

export function Td({ children, align = "left", className }: TdProps) {
  const alignClass =
    align === "right"
      ? "text-right"
      : align === "center"
      ? "text-center"
      : "text-left";

  return (
    <td
      className={[
        "px-2 py-1 border-b border-gray-100 align-middle",
        alignClass,
        className ?? "",
      ].join(" ")}
    >
      {children}
    </td>
  );
}

type TableRowProps = {
  children: React.ReactNode;
  highlight?: boolean;
  className?: string;
};

export function TableRow({ children, highlight, className }: TableRowProps) {
  return (
    <tr
      className={[
        "odd:bg-white even:bg-gray-50",
        highlight ? "bg-blue-50/70 font-semibold" : "",
        className ?? "",
      ].join(" ")}
    >
      {children}
    </tr>
  );
}
