"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { WalletName } from "@/lib/supabase/types";

export async function transferFunds(formData: FormData) {
  const supabase = await createClient();

  const fromWallet = formData.get("from_wallet") as WalletName;
  const toWallet = formData.get("to_wallet") as WalletName;
  const amount = Number(formData.get("amount"));
  const note = (formData.get("note") as string) || null;
  const createdAt = formData.get("created_at") as string;

  if (!amount || fromWallet === toWallet) {
    return { error: "Nominal wajib diisi dan dompet asal/tujuan harus beda." };
  }

  const { error } = await supabase.rpc("record_transfer", {
    p_from_wallet: fromWallet,
    p_to_wallet: toWallet,
    p_amount: amount,
    p_note: note,
    p_created_at: createdAt ? new Date(createdAt).toISOString() : undefined,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/wallet");
  revalidatePath("/dashboard");
}

export async function withdrawFunds(formData: FormData) {
  const supabase = await createClient();

  const wallet = formData.get("wallet") as WalletName;
  const amount = Number(formData.get("amount"));
  const reason = formData.get("reason") as string;
  const createdAt = formData.get("created_at") as string;

  if (!amount || !reason) {
    return { error: "Nominal dan alasan penarikan wajib diisi." };
  }

  const { error } = await supabase.rpc("record_withdrawal", {
    p_wallet: wallet,
    p_amount: amount,
    p_reason: reason,
    p_created_at: createdAt ? new Date(createdAt).toISOString() : undefined,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/wallet");
  revalidatePath("/dashboard");
}
