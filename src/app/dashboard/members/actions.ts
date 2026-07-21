"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addMember(formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase.from("members").insert({
    full_name: formData.get("full_name") as string,
    email: (formData.get("email") as string) || null,
    phone: (formData.get("phone") as string) || null,
    parent_name: (formData.get("parent_name") as string) || null,
    parent_email: (formData.get("parent_email") as string) || null,
    parent_phone: (formData.get("parent_phone") as string) || null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/members");
}

export async function editMember(formData: FormData) {
  const supabase = await createClient();

  const id = formData.get("id") as string;

  const { error } = await supabase
    .from("members")
    .update({
      full_name: formData.get("full_name") as string,
      email: (formData.get("email") as string) || null,
      phone: (formData.get("phone") as string) || null,
      parent_name: (formData.get("parent_name") as string) || null,
      parent_email: (formData.get("parent_email") as string) || null,
      parent_phone: (formData.get("parent_phone") as string) || null,
      active: formData.get("active") === "true",
    })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/members");
  revalidatePath("/dashboard");
}
