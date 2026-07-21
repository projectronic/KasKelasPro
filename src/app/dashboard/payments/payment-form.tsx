"use client";

import { useActionState, useMemo, useRef, useState } from "react";
import { recordPayment } from "./actions";
import { MonthlyPaymentForm } from "./monthly-payment-form";
import { currentPeriod, getRateForPeriod } from "@/lib/dues";
import type { IuranType } from "@/lib/supabase/types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/currency-input";
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
}: {
  members: Member[];
  iuranType: IuranType;
  defaultAmount: number;
  periodStartDate: string;
  overrides: { period: string; amount: number }[];
  allPayments: { member_id: string; period: string; amount: number }[];
}) {
  // Monthly dues can span several unpaid months at once, so it gets a
  // checkbox picker instead of typing one period at a time. Daily mode
  // (one row per school day) doesn't have that "catch up" pattern in the
  // same way yet, so it keeps the plain single-period form below.
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
      iuranType={iuranType}
      defaultAmount={defaultAmount}
      overrides={overrides}
    />
  );
}

function DailyPaymentForm({
  members,
  iuranType,
  defaultAmount,
  overrides,
}: {
  members: Member[];
  iuranType: IuranType;
  defaultAmount: number;
  overrides: { period: string; amount: number }[];
}) {
  const overridesMap = useMemo(
    () => new Map(overrides.map((o) => [o.period, o.amount])),
    [overrides]
  );
  const today = useMemo(() => new Date(), []);
  const initialPeriod = currentPeriod(iuranType, today);

  const [period, setPeriod] = useState(initialPeriod);
  const [amount, setAmount] = useState(
    getRateForPeriod(initialPeriod, defaultAmount, overridesMap)
  );
  const [memberId, setMemberId] = useState("");

  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    async (_prevState, formData) => {
      const result = await recordPayment(formData);
      if (!result?.error) {
        formRef.current?.reset();
        setPeriod(initialPeriod);
        setAmount(getRateForPeriod(initialPeriod, defaultAmount, overridesMap));
        setMemberId("");
      }
      return result ?? null;
    },
    null
  );

  return (
    <form
      ref={formRef}
      action={formAction}
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
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
        <Label htmlFor="period">Periode (YYYY-MM-DD)</Label>
        <Input
          id="period"
          name="period"
          value={period}
          onChange={(e) => {
            setPeriod(e.target.value);
            setAmount(getRateForPeriod(e.target.value, defaultAmount, overridesMap));
          }}
          required
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="amount">Nominal (Rp)</Label>
        <CurrencyInput
          id="amount"
          name="amount"
          value={amount}
          onValueChange={setAmount}
          required
        />
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
      <div className="col-span-full flex flex-col gap-2 sm:col-span-1">
        <Label htmlFor="note">Catatan (opsional)</Label>
        <Input id="note" name="note" placeholder="mis. bayar 2 hari sekaligus" />
      </div>
      <div className="col-span-full flex flex-col gap-2">
        {state?.error && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}
        <Button type="submit" disabled={isPending || !memberId} className="w-fit">
          {isPending ? "Menyimpan..." : "Catat Pembayaran"}
        </Button>
      </div>
    </form>
  );
}
