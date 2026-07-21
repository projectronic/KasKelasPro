"use client";

import { useActionState, useRef, useState } from "react";
import { transferFunds } from "./actions";
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

export function TransferForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [formKey, setFormKey] = useState(0);
  const [fromWallet, setFromWallet] = useState("dompet");
  const [toWallet, setToWallet] = useState("bank");
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    async (_prevState, formData) => {
      const result = await transferFunds(formData);
      if (!result?.error) {
        formRef.current?.reset();
        setFormKey((k) => k + 1);
        setFromWallet("dompet");
        setToWallet("bank");
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
        <Label htmlFor="from_wallet">Dari</Label>
        <input type="hidden" name="from_wallet" value={fromWallet} />
        <Select value={fromWallet} onValueChange={(v) => v && setFromWallet(v)}>
          <SelectTrigger id="from_wallet" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="dompet">Dompet</SelectItem>
            <SelectItem value="bank">Bank</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="to_wallet">Ke</Label>
        <input type="hidden" name="to_wallet" value={toWallet} />
        <Select value={toWallet} onValueChange={(v) => v && setToWallet(v)}>
          <SelectTrigger id="to_wallet" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="dompet">Dompet</SelectItem>
            <SelectItem value="bank">Bank</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="transfer_amount">Nominal (Rp)</Label>
        <CurrencyInput key={formKey} id="transfer_amount" name="amount" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="transfer_date">Tanggal</Label>
        <Input
          id="transfer_date"
          name="created_at"
          type="date"
          defaultValue={new Date().toISOString().slice(0, 10)}
          required
        />
      </div>
      <div className="col-span-full flex flex-col gap-2 sm:col-span-2 lg:col-span-1">
        <Label htmlFor="transfer_note">Catatan (opsional)</Label>
        <Input id="transfer_note" name="note" />
      </div>
      <div className="col-span-full flex flex-col gap-2">
        {state?.error && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}
        <Button type="submit" disabled={isPending} className="w-fit">
          {isPending ? "Memproses..." : "Pindahkan Dana"}
        </Button>
      </div>
    </form>
  );
}
