"use client";

import { useActionState, useMemo, useRef, useState } from "react";
import { recordPayments } from "./actions";
import { computeMemberDues } from "@/lib/dues";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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

  const total = unpaidPeriods
    .filter((p) => checked.has(p.period))
    .reduce((sum, p) => sum + p.owed, 0);

  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    async (_prevState, formData) => {
      const periods = unpaidPeriods
        .filter((p) => checked.has(p.period))
        .map((p) => ({ period: p.period, amount: p.owed }));
      formData.set("periods", JSON.stringify(periods));

      const result = await recordPayments(formData);
      if (!result?.error) {
        formRef.current?.reset();
        setChecked(new Set());
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
                <label
                  key={p.period}
                  className="flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-sm"
                >
                  <span className="flex items-center gap-2.5">
                    <Checkbox
                      checked={checked.has(p.period)}
                      onCheckedChange={() => toggle(p.period)}
                    />
                    <span>
                      {p.period}
                      {p.paid > 0 && (
                        <span className="ml-1.5 text-xs text-muted-foreground">
                          (sudah bayar sebagian: Rp {p.paid.toLocaleString("id-ID")})
                        </span>
                      )}
                    </span>
                  </span>
                  <span className="shrink-0 font-medium">
                    Rp {p.owed.toLocaleString("id-ID")}
                  </span>
                </label>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Anggota ini tidak punya tunggakan sampai bulan berjalan.
            </p>
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
