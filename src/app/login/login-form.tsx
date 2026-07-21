"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ActionState = { error?: string; success?: string } | null;

export function LoginForm() {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    async (_prevState, formData) => login(formData),
    null
  );

  return (
    <>
      <form action={formAction} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required />
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/forgot-password"
              className="text-xs text-muted-foreground underline underline-offset-4"
            >
              Lupa password?
            </Link>
          </div>
          <Input id="password" name="password" type="password" required />
        </div>
        {state?.error && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}
        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? "Memproses..." : "Masuk"}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        Belum punya akun?{" "}
        <Link href="/signup" className="underline underline-offset-4">
          Daftar
        </Link>
      </p>
    </>
  );
}
