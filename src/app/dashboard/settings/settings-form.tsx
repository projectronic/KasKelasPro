"use client";

import { useActionState } from "react";
import { updateSettings } from "./actions";
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
import type { IuranType } from "@/lib/supabase/types";

type ActionState = { error?: string } | null;

export function SettingsForm({
  className,
  iuranType,
  iuranAmount,
  periodStartDate,
}: {
  className: string;
  iuranType: IuranType;
  iuranAmount: number;
  periodStartDate: string;
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
        <Select name="iuran_type" defaultValue={iuranType}>
          <SelectTrigger id="iuran_type" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="harian">Harian</SelectItem>
            <SelectItem value="bulanan">Bulanan</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="iuran_amount">Nominal Iuran Default (Rp)</Label>
        <CurrencyInput
          id="iuran_amount"
          name="iuran_amount"
          defaultValue={iuranAmount}
          required
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="period_start_date">Kas Mulai Dihitung Sejak</Label>
        <Input
          id="period_start_date"
          name="period_start_date"
          type="date"
          defaultValue={periodStartDate}
          required
        />
        <p className="text-xs text-muted-foreground">
          Biasanya awal tahun ajaran. Anggota yang gabung belakangan tetap
          dihitung dari tanggal gabungnya sendiri, bukan dari sini.
        </p>
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
