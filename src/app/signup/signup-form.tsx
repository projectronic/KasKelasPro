"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { signup } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type ActionState = { error?: string; success?: string } | null;
type RegistrantType = "siswa" | "orang_tua";

export function SignupForm() {
  const [registrantType, setRegistrantType] = useState<RegistrantType>("siswa");
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    async (_prevState, formData) => signup(formData),
    null
  );

  const isParent = registrantType === "orang_tua";

  return (
    <>
      <form action={formAction} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label>Daftar sebagai</Label>
          <input type="hidden" name="registrant_type" value={registrantType} />
          <Tabs
            value={registrantType}
            onValueChange={(v) => v && setRegistrantType(v as RegistrantType)}
          >
            <TabsList className="w-full">
              <TabsTrigger value="siswa" className="flex-1">
                Siswa
              </TabsTrigger>
              <TabsTrigger value="orang_tua" className="flex-1">
                Orang Tua/Wali
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="own_name">
            {isParent ? "Nama Orang Tua/Wali" : "Nama Siswa"}
          </Label>
          <Input id="own_name" name="own_name" required />
        </div>

        {isParent && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="student_name">Nama Siswa (anak)</Label>
            <Input id="student_name" name="student_name" required />
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Label htmlFor="email">
            Email {isParent ? "Orang Tua/Wali" : "Siswa"} (dipakai untuk login)
          </Label>
          <Input id="email" name="email" type="email" required />
          <p className="text-xs text-muted-foreground">
            Silahkan konfirmasi email dari Supabase Auth setelah daftar.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="phone">Telepon (opsional)</Label>
          <Input
            id="phone"
            name={isParent ? "parent_phone" : "student_phone"}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            minLength={6}
            required
          />
        </div>

        {state?.error && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}
        {state?.success && (
          <p className="text-sm text-emerald-600">{state.success}</p>
        )}
        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? "Memproses..." : "Daftar"}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        Sudah punya akun?{" "}
        <Link href="/login" className="underline underline-offset-4">
          Masuk
        </Link>
      </p>
    </>
  );
}
