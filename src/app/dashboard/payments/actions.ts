"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function recordPayment(formData: FormData) {
  const supabase = await createClient();

  const memberId = formData.get("member_id") as string;
  const period = formData.get("period") as string;
  const amount = Number(formData.get("amount"));
  const note = (formData.get("note") as string) || null;

  if (!memberId || !period || !amount) {
    return { error: "Anggota, periode, dan nominal wajib diisi." };
  }

  const { error } = await supabase.rpc("record_payment", {
    p_member_id: memberId,
    p_period: period,
    p_amount: amount,
    p_note: note,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/payments");
  revalidatePath("/dashboard/rekap");
  revalidatePath("/dashboard");
}
