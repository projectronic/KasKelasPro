"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function revalidatePaymentPaths() {
  revalidatePath("/dashboard/payments");
  revalidatePath("/dashboard/rekap");
  revalidatePath("/dashboard");
}

export async function recordPayment(formData: FormData) {
  const supabase = await createClient();

  const memberId = formData.get("member_id") as string;
  const period = formData.get("period") as string;
  const amount = Number(formData.get("amount"));
  const note = (formData.get("note") as string) || null;
  const paidAt = formData.get("paid_at") as string;

  if (!memberId || !period || !amount) {
    return { error: "Anggota, periode, dan nominal wajib diisi." };
  }

  const { error } = await supabase.rpc("record_payment", {
    p_member_id: memberId,
    p_period: period,
    p_amount: amount,
    p_note: note,
    p_paid_at: paidAt ? new Date(paidAt).toISOString() : undefined,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePaymentPaths();
}

/** Bulk-records one payment per checked period (bulanan checkbox flow). */
export async function recordPayments(formData: FormData) {
  const supabase = await createClient();

  const memberId = formData.get("member_id") as string;
  const note = (formData.get("note") as string) || null;
  const paidAt = formData.get("paid_at") as string;
  const periodsRaw = formData.get("periods") as string;

  if (!memberId || !periodsRaw) {
    return { error: "Anggota dan minimal satu periode wajib dipilih." };
  }

  let periods: { period: string; amount: number }[];
  try {
    periods = JSON.parse(periodsRaw);
  } catch {
    return { error: "Data periode tidak valid." };
  }

  if (!periods.length) {
    return { error: "Pilih minimal satu periode." };
  }

  for (const { period, amount } of periods) {
    const { error } = await supabase.rpc("record_payment", {
      p_member_id: memberId,
      p_period: period,
      p_amount: amount,
      p_note: note,
      p_paid_at: paidAt ? new Date(paidAt).toISOString() : undefined,
    });

    if (error) {
      return { error: `Gagal mencatat periode ${period}: ${error.message}` };
    }
  }

  revalidatePaymentPaths();
}
