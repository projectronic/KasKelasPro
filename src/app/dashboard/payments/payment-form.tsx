"use client";

import { useActionState, useMemo, useRef, useState } from "react";
import { recordPayments } from "./actions";
import { MonthlyPaymentForm } from "./monthly-payment-form";
import { getRateForPeriod, getSchoolDaysInRange } from "@/lib/dues";
import type { PeriodDue } from "@/lib/dues";
import type { IuranType } from "@/lib/supabase/types";
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

export function PaymentForm({
  members,
  iuranType,
  defaultAmount,
  periodStartDate,
  overrides,
  allPayments,
  holidays,
}: {
  members: Member[];
  iuranType: IuranType;
  defaultAmount: number;
  periodStartDate: string;
  overrides: { period: string; amount: number }[];
  allPayments: { member_id: string; period: string; amount: number }[];
  holidays: string[];
}) {
  // Monthly dues can span several unpaid months at once, so it gets a
  // checkbox picker instead of typing one period at a time. Daily mode gets
  // the same picker, but built from a date range instead of arrears, since a
  // "kas harian" range is usually just "the days I want to pay for."
  if (iuranType === "bulanan") {
    return (
      <MonthlyPaymentForm
        members={members}
        defaultAmount={defaultAmount}
        periodStartDate={periodStartDate}
        overrides={overrides}
        allPayments={allPayments}
      />
    );
  }

  return (
    <DailyPaymentForm
      members={members}
      defaultAmount={defaultAmount}
      overrides={overrides}
      allPayments={allPayments}
      holidays={holidays}
    />
  );
}

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function DailyPaymentForm({
  members,
  defaultAmount,
  overrides,
  allPayments,
  holidays,
}: {
  members: Member[];
  defaultAmount: number;
  overrides: { period: string; amount: number }[];
  allPayments: { member_id: string; period: string; amount: number }[];
  holidays: string[];
}) {
  const overridesMap = useMemo(
    () => new Map(overrides.map((o) => [o.period, o.amount])),
    [overrides]
  );
  const holidaySet = useMemo(() => new Set(holidays), [holidays]);
  const today = useMemo(() => new Date(), []);
  const todayStr = toDateInputValue(today);

  const [memberId, setMemberId] = useState("");
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  // Days in range default to selected; toggling excludes rather than
  // includes, so widening the date range doesn't require re-checking days.
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [amounts, setAmounts] = useState<Map<string, number>>(new Map());

  const days = useMemo(() => {
    if (!memberId || !startDate || !endDate || endDate < startDate) return [];
    const memberPayments = allPayments.filter((p) => p.member_id === memberId);
    const paidByPeriod = new Map<string, number>();
    for (const p of memberPayments) {
      paidByPeriod.set(p.period, (paidByPeriod.get(p.period) ?? 0) + p.amount);
    }
    return getSchoolDaysInRange(new Date(startDate), new Date(endDate), holidaySet)
      .map((period): PeriodDue => {
        const required = getRateForPeriod(period, defaultAmount, overridesMap);
        const paid = paidByPeriod.get(period) ?? 0;
        return { period, required, paid, owed: required - paid };
      })
      .filter((p) => p.owed > 0);
  }, [memberId, startDate, endDate, allPayments, holidaySet, defaultAmount, overridesMap]);

  const selected = days.filter((p) => !excluded.has(p.period));

  function getAmount(p: PeriodDue) {
    return amounts.get(p.period) ?? p.owed;
  }

  const total = selected.reduce((sum, p) => sum + getAmount(p), 0);

  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    async (_prevState, formData) => {
      const periods = selected
        .filter((p) => getAmount(p) > 0)
        .map((p) => ({ period: p.period, amount: getAmount(p) }));
      formData.set("periods", JSON.stringify(periods));

      const result = await recordPayments(formData);
      if (!result?.error) {
        formRef.current?.reset();
        setMemberId("");
        setStartDate(todayStr);
        setEndDate(todayStr);
        setExcluded(new Set());
        setAmounts(new Map());
      }
      return result ?? null;
    },
    null
  );

  function toggle(period: string) {
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(period)) next.delete(period);
      else next.add(period);
      return next;
    });
  }

  function changeAmount(period: string, amount: number) {
    setAmounts((prev) => new Map(prev).set(period, amount));
    setExcluded((prev) => {
      if (!prev.has(period)) return prev;
      const next = new Set(prev);
      next.delete(period);
      return next;
    });
  }

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="member_id">Anggota</Label>
          <input type="hidden" name="member_id" value={memberId} />
          <Select value={memberId} onValueChange={(v) => v && setMemberId(v)}>
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
          <Label htmlFor="start_date">Tanggal Mulai</Label>
          <Input
            id="start_date"
            type="date"
            value={startDate}
            onChange={(e) => {
              const value = e.target.value;
              setStartDate(value);
              if (endDate < value) setEndDate(value);
            }}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="end_date">Tanggal Akhir</Label>
          <Input
            id="end_date"
            type="date"
            value={endDate}
            min={startDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="paid_at">Tanggal Bayar</Label>
          <Input id="paid_at" name="paid_at" type="date" defaultValue={todayStr} required />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="note">Catatan (opsional)</Label>
        <Input id="note" name="note" placeholder="mis. bayar tunai" />
      </div>

      {memberId && (
        <div className="flex flex-col gap-2">
          <Label>Hari yang Dibayar</Label>
          {days.length ? (
            <div className="flex flex-col divide-y rounded-md border">
              {days.map((p) => (
                <PeriodRow
                  key={p.period}
                  {...p}
                  amount={getAmount(p)}
                  checked={!excluded.has(p.period)}
                  onToggle={toggle}
                  onAmountChange={changeAmount}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Tidak ada hari sekolah pada rentang ini (akhir pekan dan hari
              libur dikecualikan otomatis), atau semua sudah lunas.
            </p>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2">
        {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
        <Button
          type="submit"
          disabled={isPending || !memberId || selected.length === 0}
          className="w-fit"
        >
          {isPending
            ? "Menyimpan..."
            : `Catat Pembayaran${selected.length ? ` (${selected.length} hari, Rp ${total.toLocaleString("id-ID")})` : ""}`}
        </Button>
      </div>
    </form>
  );
}
