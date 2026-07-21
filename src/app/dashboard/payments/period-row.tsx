"use client";

import { Checkbox } from "@/components/ui/checkbox";
import type { PeriodDue } from "@/lib/dues";

/** One selectable period row, shared by the monthly and daily payment forms. */
export function PeriodRow({
  period,
  paid,
  owed,
  checked,
  onToggle,
}: PeriodDue & { checked: boolean; onToggle: (period: string) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-sm">
      <span className="flex items-center gap-2.5">
        <Checkbox checked={checked} onCheckedChange={() => onToggle(period)} />
        <span>
          {period}
          {paid > 0 && (
            <span className="ml-1.5 text-xs text-muted-foreground">
              (sudah bayar sebagian: Rp {paid.toLocaleString("id-ID")})
            </span>
          )}
        </span>
      </span>
      <span className="shrink-0 font-medium">Rp {owed.toLocaleString("id-ID")}</span>
    </label>
  );
}
