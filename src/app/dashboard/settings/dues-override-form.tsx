"use client";

import { useActionState, useRef, useState } from "react";
import { addDuesOverride } from "./actions";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/currency-input";

type ActionState = { error?: string } | null;

export function DuesOverrideForm() {
  const formRef = useRef<HTMLFormElement>(null);
  // CurrencyInput tracks its own typed-in state, which a native
  // form.reset() can't touch — bump this key after a successful submit to
  // force it to remount blank instead of showing the just-submitted amount.
  const [formKey, setFormKey] = useState(0);
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    async (_prevState, formData) => {
      const result = await addDuesOverride(formData);
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
      className="grid grid-cols-3 items-end gap-2"
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="period">Periode</Label>
        <Input id="period" name="period" placeholder="2026-01" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="override_amount">Nominal (Rp)</Label>
        <CurrencyInput
          key={formKey}
          id="override_amount"
          name="override_amount"
          required
        />
      </div>
      <div className="flex flex-col gap-2">
        {state?.error && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}
        <Button type="submit" disabled={isPending}>
          {isPending ? "Menyimpan..." : "Tambah"}
        </Button>
      </div>
    </form>
  );
}
