import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;

  // Supabase's default signup-confirmation email verifies the token on its
  // own domain, then bounces the browser back here with ?code=... (PKCE).
  // That code has to be exchanged for a session before we can call the
  // user "logged in" — just redirecting to /dashboard would drop it.
  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  redirect("/dashboard");
}
