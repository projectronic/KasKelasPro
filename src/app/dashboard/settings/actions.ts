"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { IuranType } from "@/lib/supabase/types";

export async function updateSettings(formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("settings")
    .update({
      class_name: formData.get("class_name") as string,
      school_name: (formData.get("school_name") as string) || null,
      iuran_type: formData.get("iuran_type") as IuranType,
      iuran_amount: Number(formData.get("iuran_amount")),
      period_start_date: formData.get("period_start_date") as string,
    })
    .eq("id", true);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/payments");
}

export async function addDuesOverride(formData: FormData) {
  const supabase = await createClient();

  const period = formData.get("period") as string;
  const amount = Number(formData.get("override_amount"));
  const note = formData.get("note") as string | null;

  if (!period || !amount) {
    return { error: "Periode dan nominal wajib diisi." };
  }

  const { error } = await supabase
    .from("dues_overrides")
    .upsert({ period, amount, note }, { onConflict: "period" });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/settings");
}

export async function addHoliday(formData: FormData) {
  const supabase = await createClient();

  const date = formData.get("date") as string;
  const note = (formData.get("note") as string) || null;

  if (!date) {
    return { error: "Tanggal wajib diisi." };
  }

  const { error } = await supabase
    .from("holidays")
    .upsert({ date, note }, { onConflict: "date" });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/payments");
}

export async function deleteHoliday(formData: FormData) {
  const supabase = await createClient();

  const date = formData.get("date") as string;
  if (!date) {
    return { error: "Tanggal wajib diisi." };
  }

  const { error } = await supabase.from("holidays").delete().eq("date", date);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/payments");
}

type NagerHoliday = { date: string; localName: string };

/** Seeds `holidays` from date.nager.at's public Indonesia holiday calendar for one year. */
export async function fetchHolidaysFromApi(formData: FormData) {
  const supabase = await createClient();

  const year = Number(formData.get("year"));
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    return { error: "Tahun tidak valid." };
  }

  let holidays: NagerHoliday[];
  try {
    const res = await fetch(
      `https://date.nager.at/api/v3/PublicHolidays/${year}/ID`,
      { cache: "no-store" }
    );
    if (!res.ok) {
      return { error: `Gagal mengambil data hari libur (HTTP ${res.status}).` };
    }
    holidays = await res.json();
  } catch {
    return { error: "Gagal menghubungi layanan hari libur. Coba lagi nanti." };
  }

  if (!holidays.length) {
    return { error: `Tidak ada data hari libur untuk tahun ${year}.` };
  }

  const { error } = await supabase.from("holidays").upsert(
    holidays.map((h) => ({ date: h.date, note: h.localName })),
    { onConflict: "date" }
  );

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/payments");
}
