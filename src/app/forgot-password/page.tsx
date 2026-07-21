"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Landmark } from "lucide-react";
import { requestPasswordReset } from "./actions";
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

type ActionState = { error?: string; success?: string } | null;

export default function ForgotPasswordPage() {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    async (_prevState, formData) => requestPasswordReset(formData),
    null
  );

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="fixed top-4 right-4">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <div className="mb-1 flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Landmark className="size-5" />
          </div>
          <CardTitle>Lupa Password</CardTitle>
          <CardDescription>
            Masukkan email yang kamu pakai untuk login. Kami kirim link
            untuk buat password baru.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            {state?.error && (
              <p className="text-sm text-destructive">{state.error}</p>
            )}
            {state?.success && (
              <p className="text-sm text-emerald-600">{state.success}</p>
            )}
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? "Mengirim..." : "Kirim Link Reset"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            <Link href="/login" className="underline underline-offset-4">
              Kembali ke login
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
