"use client";

import { useActionState, useRef, useState } from "react";
import { withdrawFunds } from "./actions";
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

export function WithdrawalForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [formKey, setFormKey] = useState(0);
  const [wallet, setWallet] = useState("bank");
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    async (_prevState, formData) => {
      const result = await withdrawFunds(formData);
      if (!result?.error) {
        formRef.current?.reset();
        setFormKey((k) => k + 1);
        setWallet("bank");
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
        <Label htmlFor="withdraw_wallet">Dari</Label>
        <input type="hidden" name="wallet" value={wallet} />
        <Select value={wallet} onValueChange={(v) => v && setWallet(v)}>
          <SelectTrigger id="withdraw_wallet" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="dompet">Dompet</SelectItem>
            <SelectItem value="bank">Bank</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="withdraw_amount">Nominal (Rp)</Label>
        <CurrencyInput key={formKey} id="withdraw_amount" name="amount" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="withdraw_date">Tanggal</Label>
        <Input
          id="withdraw_date"
          name="created_at"
          type="date"
          defaultValue={new Date().toISOString().slice(0, 10)}
          required
        />
      </div>
      <div className="col-span-full flex flex-col gap-2 sm:col-span-2 lg:col-span-1">
        <Label htmlFor="reason">Alasan Penarikan</Label>
        <Input id="reason" name="reason" placeholder="mis. beli alat kebersihan kelas" required />
      </div>
      <div className="col-span-full flex flex-col gap-2">
        {state?.error && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}
        <Button type="submit" disabled={isPending} className="w-fit">
          {isPending ? "Memproses..." : "Catat Penarikan"}
        </Button>
      </div>
    </form>
  );
}
