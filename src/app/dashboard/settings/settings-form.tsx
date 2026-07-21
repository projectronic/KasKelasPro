"use client";

import { useActionState } from "react";
import { updateSettings } from "./actions";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { IuranType } from "@/lib/supabase/types";

type ActionState = { error?: string } | null;

export function SettingsForm({
  className,
  iuranType,
  iuranAmount,
}: {
  className: string;
  iuranType: IuranType;
  iuranAmount: number;
}) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    async (_prevState, formData) => (await updateSettings(formData)) ?? null,
    null
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="class_name">Nama Kelas</Label>
        <Input
          id="class_name"
          name="class_name"
          defaultValue={className}
          required
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="iuran_type">Mode Iuran</Label>
        <select
          id="iuran_type"
          name="iuran_type"
          defaultValue={iuranType}
          className="h-9 rounded-md border bg-transparent px-3 text-sm"
        >
          <option value="harian">Harian</option>
          <option value="bulanan">Bulanan</option>
        </select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="iuran_amount">Nominal Iuran Default (Rp)</Label>
        <Input
          id="iuran_amount"
          name="iuran_amount"
          type="number"
          min={0}
          defaultValue={iuranAmount}
          required
        />
      </div>
      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
      <Button type="submit" disabled={isPending} className="w-fit">
        {isPending ? "Menyimpan..." : "Simpan"}
      </Button>
    </form>
  );
}
