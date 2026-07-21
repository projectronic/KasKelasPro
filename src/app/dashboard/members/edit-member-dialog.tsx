"use client";

import { useActionState, useState } from "react";
import { editMember } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type ActionState = { error?: string } | null;

type Member = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  parent_name: string | null;
  parent_email: string | null;
  parent_phone: string | null;
  active: boolean;
};

export function EditMemberDialog({ member }: { member: Member }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(member.active ? "true" : "false");
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    async (_prevState, formData) => {
      const result = await editMember(formData);
      if (!result?.error) setOpen(false);
      return result ?? null;
    },
    null
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        Edit
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Anggota</DialogTitle>
          <DialogDescription>
            Betulkan data kalau ada yang salah — misalnya dua akun yang
            ke-sambung ke anggota yang salah saat pendaftaran otomatis.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="id" value={member.id} />
          <input type="hidden" name="active" value={active} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor={`full_name-${member.id}`}>Nama Siswa</Label>
              <Input
                id={`full_name-${member.id}`}
                name="full_name"
                defaultValue={member.full_name}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor={`email-${member.id}`}>Email Siswa</Label>
              <Input
                id={`email-${member.id}`}
                name="email"
                type="email"
                defaultValue={member.email ?? ""}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor={`phone-${member.id}`}>Telepon Siswa</Label>
              <Input
                id={`phone-${member.id}`}
                name="phone"
                defaultValue={member.phone ?? ""}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor={`active-select-${member.id}`}>Status</Label>
              <Select value={active} onValueChange={(v) => v && setActive(v)}>
                <SelectTrigger id={`active-select-${member.id}`} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Aktif</SelectItem>
                  <SelectItem value="false">Nonaktif</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor={`parent_name-${member.id}`}>Nama Orang Tua/Wali</Label>
              <Input
                id={`parent_name-${member.id}`}
                name="parent_name"
                defaultValue={member.parent_name ?? ""}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor={`parent_email-${member.id}`}>Email Orang Tua/Wali</Label>
              <Input
                id={`parent_email-${member.id}`}
                name="parent_email"
                type="email"
                defaultValue={member.parent_email ?? ""}
              />
            </div>
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor={`parent_phone-${member.id}`}>Telepon Orang Tua/Wali</Label>
              <Input
                id={`parent_phone-${member.id}`}
                name="parent_phone"
                defaultValue={member.parent_phone ?? ""}
              />
            </div>
          </div>
          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Batal
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
