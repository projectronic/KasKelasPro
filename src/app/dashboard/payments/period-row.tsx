"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { CurrencyInput } from "@/components/currency-input";
import type { PeriodDue } from "@/lib/dues";

/**
 * One selectable period row, shared by the monthly and daily payment forms.
 * Amount defaults to the full rate but is editable — typing a smaller
 * number records a partial payment directly, instead of needing the
 * separate "Koreksi Pembayaran" flow afterward. Editing the amount
 * auto-checks the row, since typing into it means "record this one".
 */
export function PeriodRow({
  period,
  paid,
  amount,
  checked,
  onToggle,
  onAmountChange,
}: Omit<PeriodDue, "required" | "owed"> & {
  amount: number;
  checked: boolean;
  onToggle: (period: string) => void;
  onAmountChange: (period: string, amount: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
      <label className="flex flex-1 cursor-pointer items-center gap-2.5">
        <Checkbox checked={checked} onCheckedChange={() => onToggle(period)} />
        <span>
          {period}
          {paid > 0 && (
            <span className="ml-1.5 text-xs text-muted-foreground">
              (sudah bayar sebagian: Rp {paid.toLocaleString("id-ID")})
            </span>
          )}
        </span>
      </label>
      <CurrencyInput
        name={`amount-${period}`}
        value={amount}
        onValueChange={(next) => onAmountChange(period, next)}
        className="w-28 shrink-0 text-right"
      />
    </div>
  );
}
