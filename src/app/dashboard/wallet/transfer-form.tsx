"use client";

import { useActionState, useRef, useState } from "react";
import { transferFunds } from "./actions";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/currency-input";

type ActionState = { error?: string } | null;

export function TransferForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [formKey, setFormKey] = useState(0);
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    async (_prevState, formData) => {
      const result = await transferFunds(formData);
      if (!result?.error) {
        formRef.current?.reset();
        setFormKey((k) => k + 1);
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
        <select
          id="from_wallet"
          name="from_wallet"
          defaultValue="dompet"
          className="h-9 rounded-md border bg-transparent px-3 text-sm"
        >
          <option value="dompet">Dompet</option>
          <option value="bank">Bank</option>
        </select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="to_wallet">Ke</Label>
        <select
          id="to_wallet"
          name="to_wallet"
          defaultValue="bank"
          className="h-9 rounded-md border bg-transparent px-3 text-sm"
        >
          <option value="dompet">Dompet</option>
          <option value="bank">Bank</option>
        </select>
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
      <div className="flex flex-col gap-2">
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
