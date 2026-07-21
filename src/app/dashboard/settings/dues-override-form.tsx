"use client";

import { useActionState, useRef } from "react";
import { addDuesOverride } from "./actions";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type ActionState = { error?: string } | null;

export function DuesOverrideForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    async (_prevState, formData) => {
      const result = await addDuesOverride(formData);
      if (!result?.error) formRef.current?.reset();
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
        <Input
          id="override_amount"
          name="override_amount"
          type="number"
          min={0}
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
