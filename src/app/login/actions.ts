"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function login(formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const registrantType = formData.get("registrant_type") as "siswa" | "orang_tua";
  const ownName = formData.get("own_name") as string;
  // Students register under their own name; a parent has to say which
  // student they belong to — that's the anchor handle_new_user() uses to
  // attach both accounts to the same members row instead of creating two.
  const studentName =
    registrantType === "orang_tua" ? (formData.get("student_name") as string) : ownName;

  const { error } = await supabase.auth.signUp({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    options: {
      data: {
        registrant_type: registrantType,
        own_name: ownName,
        student_name: studentName,
        parent_phone: (formData.get("parent_phone") as string) || null,
        student_phone: (formData.get("student_phone") as string) || null,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  return {
    success:
      "Pendaftaran berhasil. Cek email kamu untuk konfirmasi akun. Setelah dikonfirmasi, akun kamu masih perlu di-approve oleh pengurus kelas sebelum bisa mengakses data.",
  };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
