"use client";

import { useActionState, useRef } from "react";
import { addMember } from "./actions";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type ActionState = { error?: string } | null;

export function AddMemberForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    async (_prevState, formData) => {
      const result = await addMember(formData);
      if (!result?.error) formRef.current?.reset();
      return result ?? null;
    },
    null
  );

  return (
    <form
      ref={formRef}
      action={formAction}
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="full_name">Nama Siswa</Label>
        <Input id="full_name" name="full_name" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email Siswa (opsional)</Label>
        <Input id="email" name="email" type="email" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="phone">Telepon Siswa (opsional)</Label>
        <Input id="phone" name="phone" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="parent_name">Nama Orang Tua/Wali</Label>
        <Input id="parent_name" name="parent_name" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="parent_email">Email Orang Tua/Wali</Label>
        <Input id="parent_email" name="parent_email" type="email" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="parent_phone">Telepon Orang Tua/Wali</Label>
        <Input id="parent_phone" name="parent_phone" />
      </div>
      <div className="flex flex-col justify-end gap-2">
        {state?.error && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}
        <Button type="submit" disabled={isPending}>
          {isPending ? "Menyimpan..." : "Tambah"}
        </Button>
      </div>
    </form>
  );
}
