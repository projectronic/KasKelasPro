"use client";

import { useActionState, useMemo, useRef, useState } from "react";
import { recordPayments } from "./actions";
import { computeMemberDues, getRateForPeriod, getUpcomingPeriods } from "@/lib/dues";
import type { PeriodDue } from "@/lib/dues";
import { PeriodRow } from "./period-row";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ActionState = { error?: string } | null;

type Member = { id: string; full_name: string; join_date: string };

export function MonthlyPaymentForm({
  members,
  defaultAmount,
  periodStartDate,
  overrides,
  allPayments,
}: {
  members: Member[];
  defaultAmount: number;
  periodStartDate: string;
  overrides: { period: string; amount: number }[];
  allPayments: { member_id: string; period: string; amount: number }[];
}) {
  const overridesMap = useMemo(
    () => new Map(overrides.map((o) => [o.period, o.amount])),
    [overrides]
  );
  const today = useMemo(() => new Date(), []);

  const [memberId, setMemberId] = useState("");
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [amounts, setAmounts] = useState<Map<string, number>>(new Map());
  const [showPrepay, setShowPrepay] = useState(false);

  const unpaidPeriods = useMemo(() => {
    const member = members.find((m) => m.id === memberId);
    if (!member) return [];
    const dues = computeMemberDues({
      iuranType: "bulanan",
      periodStartDate: new Date(periodStartDate),
      joinDate: new Date(member.join_date),
      today,
      defaultAmount,
      overrides: overridesMap,
      payments: allPayments.filter((p) => p.member_id === memberId),
    });
    return dues.unpaidPeriods;
  }, [memberId, members, periodStartDate, today, defaultAmount, overridesMap, allPayments]);

  // Months not due yet, offered separately so a member can pay ahead. Unlike
  // unpaidPeriods, being listed here doesn't mean it's owed — only fully
  // prepaid months (owed <= 0) are dropped from the list.
  const futurePeriods = useMemo(() => {
    if (!memberId) return [];
    const memberPayments = allPayments.filter((p) => p.member_id === memberId);
    const paidByPeriod = new Map<string, number>();
    for (const p of memberPayments) {
      paidByPeriod.set(p.period, (paidByPeriod.get(p.period) ?? 0) + p.amount);
    }
    return getUpcomingPeriods(today, 12)
      .map((period): PeriodDue => {
        const required = getRateForPeriod(period, defaultAmount, overridesMap);
        const paid = paidByPeriod.get(period) ?? 0;
        return { period, required, paid, owed: required - paid };
      })
      .filter((p) => p.owed > 0);
  }, [memberId, allPayments, today, defaultAmount, overridesMap]);

  const selectablePeriods = [...unpaidPeriods, ...futurePeriods];

  function getAmount(p: PeriodDue) {
    return amounts.get(p.period) ?? p.owed;
  }

  const total = selectablePeriods
    .filter((p) => checked.has(p.period))
    .reduce((sum, p) => sum + getAmount(p), 0);

  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    async (_prevState, formData) => {
      const periods = selectablePeriods
        .filter((p) => checked.has(p.period) && getAmount(p) > 0)
        .map((p) => ({ period: p.period, amount: getAmount(p) }));
      formData.set("periods", JSON.stringify(periods));

      const result = await recordPayments(formData);
      if (!result?.error) {
        formRef.current?.reset();
        setChecked(new Set());
        setAmounts(new Map());
        setShowPrepay(false);
      }
      return result ?? null;
    },
    null
  );

  function toggle(period: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(period)) next.delete(period);
      else next.add(period);
      return next;
    });
  }

  function changeAmount(period: string, amount: number) {
    setAmounts((prev) => new Map(prev).set(period, amount));
    setChecked((prev) => (prev.has(period) ? prev : new Set(prev).add(period)));
  }

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="member_id">Anggota</Label>
          <input type="hidden" name="member_id" value={memberId} />
          <Select
            value={memberId}
            onValueChange={(value) => {
              if (!value) return;
              setMemberId(value);
              setChecked(new Set());
              setAmounts(new Map());
              setShowPrepay(false);
            }}
          >
            <SelectTrigger id="member_id" className="w-full">
              <SelectValue placeholder="Pilih anggota" />
            </SelectTrigger>
            <SelectContent>
              {members.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="paid_at">Tanggal Bayar</Label>
          <Input
            id="paid_at"
            name="paid_at"
            type="date"
            defaultValue={today.toISOString().slice(0, 10)}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="note">Catatan (opsional)</Label>
          <Input id="note" name="note" placeholder="mis. bayar tunai" />
        </div>
      </div>

      {memberId && (
        <div className="flex flex-col gap-2">
          <Label>Bulan yang Dibayar</Label>
          {unpaidPeriods.length ? (
            <div className="flex flex-col divide-y rounded-md border">
              {unpaidPeriods.map((p) => (
                <PeriodRow
                  key={p.period}
                  {...p}
                  amount={getAmount(p)}
                  checked={checked.has(p.period)}
                  onToggle={toggle}
                  onAmountChange={changeAmount}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Anggota ini tidak punya tunggakan sampai bulan berjalan.
            </p>
          )}
        </div>
      )}

      {memberId && futurePeriods.length > 0 && (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setShowPrepay((v) => !v)}
            className="w-fit text-sm text-muted-foreground underline underline-offset-2"
          >
            {showPrepay
              ? "Sembunyikan bayar di muka"
              : "+ Bayar di muka untuk bulan berikutnya"}
          </button>
          {showPrepay && (
            <div className="flex flex-col gap-2">
              <Label>Bayar di Muka</Label>
              <div className="flex flex-col divide-y rounded-md border">
                {futurePeriods.map((p) => (
                  <PeriodRow
                    key={p.period}
                    {...p}
                    amount={getAmount(p)}
                    checked={checked.has(p.period)}
                    onToggle={toggle}
                    onAmountChange={changeAmount}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2">
        {state?.error && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}
        <Button type="submit" disabled={isPending || checked.size === 0} className="w-fit">
          {isPending
            ? "Menyimpan..."
            : `Catat Pembayaran${checked.size ? ` (${checked.size} bulan, Rp ${total.toLocaleString("id-ID")})` : ""}`}
        </Button>
      </div>
    </form>
  );
}
