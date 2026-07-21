"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [linkInvalid, setLinkInvalid] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const readyRef = useRef(false);

  useEffect(() => {
    const supabase = createClient();

    // Depending on the Supabase project's auth flow setting, the recovery
    // link lands here one of two ways: with ?code=... in the query string
    // (PKCE — needs an explicit exchange), or with tokens in the URL hash
    // (implicit — supabase-js parses that on its own and fires an
    // onAuthStateChange event). Handle both so it works either way.
    function markReady() {
      readyRef.current = true;
      setReady(true);
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        markReady();
      }
    });

    const code = new URLSearchParams(window.location.search).get("code");
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (!error) {
          markReady();
          window.history.replaceState({}, "", "/reset-password");
        }
      });
    } else {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) markReady();
      });
    }

    const timeout = setTimeout(() => {
      if (!readyRef.current) setLinkInvalid(true);
    }, 4000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password minimal 6 karakter.");
      return;
    }

    setIsPending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setIsPending(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.replace("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="fixed top-4 right-4">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Buat Password Baru</CardTitle>
          <CardDescription>
            Berlaku hanya untuk sekali link reset yang baru saja kamu buka
            dari email.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {linkInvalid && !ready ? (
            <p className="text-sm text-destructive">
              Link reset tidak valid atau sudah kedaluwarsa. Minta link baru
              lewat halaman Lupa Password.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="password">Password Baru</Label>
                <Input
                  id="password"
                  type="password"
                  minLength={6}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={!ready}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" disabled={!ready || isPending} className="w-full">
                {!ready ? "Memverifikasi link..." : isPending ? "Menyimpan..." : "Simpan Password"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
