"use client";

import { useActionState } from "react";
import { addHoliday, fetchHolidaysFromApi } from "./actions";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type ActionState = { error?: string } | null;

export function FetchHolidaysForm() {
  const currentYear = new Date().getFullYear();
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    async (_prevState, formData) => (await fetchHolidaysFromApi(formData)) ?? null,
    null
  );

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <div className="flex flex-col gap-2">
        <Label htmlFor="year">Tahun</Label>
        <Input
          id="year"
          name="year"
          type="number"
          defaultValue={currentYear}
          className="w-28"
          required
        />
      </div>
      <Button type="submit" variant="outline" disabled={isPending}>
        {isPending ? "Mengambil..." : "Ambil Hari Libur Nasional"}
      </Button>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
    </form>
  );
}

export function AddHolidayForm() {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    async (_prevState, formData) => (await addHoliday(formData)) ?? null,
    null
  );

  return (
    <form action={formAction} className="grid grid-cols-1 items-end gap-2 sm:grid-cols-3">
      <div className="flex flex-col gap-2">
        <Label htmlFor="holiday_date">Tanggal</Label>
        <Input id="holiday_date" name="date" type="date" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="holiday_note">Keterangan</Label>
        <Input id="holiday_note" name="note" placeholder="mis. libur semester" />
      </div>
      <div className="flex flex-col gap-2">
        {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
        <Button type="submit" disabled={isPending}>
          {isPending ? "Menyimpan..." : "Tambah"}
        </Button>
      </div>
    </form>
  );
}
