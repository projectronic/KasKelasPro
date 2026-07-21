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
      iuran_type: formData.get("iuran_type") as IuranType,
      iuran_amount: Number(formData.get("iuran_amount")),
    })
    .eq("id", true);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
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
