"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addMember(formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase.from("members").insert({
    full_name: formData.get("full_name") as string,
    email: (formData.get("email") as string) || null,
    parent_name: (formData.get("parent_name") as string) || null,
    parent_email: (formData.get("parent_email") as string) || null,
    parent_phone: (formData.get("parent_phone") as string) || null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/members");
}
