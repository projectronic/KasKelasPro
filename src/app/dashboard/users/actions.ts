"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "@/lib/supabase/types";

export async function updateUserRole(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profileId = formData.get("profile_id") as string;
  const role = formData.get("role") as AppRole;

  if (profileId === user?.id) {
    return { error: "Tidak bisa mengubah role akun sendiri." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", profileId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/users");
}

export async function sendPasswordReset(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user!.id)
    .single();

  if (callerProfile?.role !== "admin") {
    return { error: "Hanya admin yang bisa mengirim reset password." };
  }

  const email = formData.get("email") as string;
  const origin = (await headers()).get("origin");

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/reset-password`,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: `Link reset password dikirim ke ${email}.` };
}
