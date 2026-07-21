"use client";

import { useActionState, useState } from "react";
import { updateUserAccountType } from "./actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ActionState = { error?: string } | null;

export function AccountTypeRowForm({
  profileId,
  accountType,
}: {
  profileId: string;
  accountType: "siswa" | "orang_tua" | null;
}) {
  const [value, setValue] = useState<string>(accountType ?? "unset");
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    async (_prevState, formData) => (await updateUserAccountType(formData)) ?? null,
    null
  );

  return (
    <div className="flex flex-col gap-1">
      <Select
        value={value}
        disabled={isPending}
        onValueChange={(next) => {
          if (!next) return;
          setValue(next);
          const formData = new FormData();
          formData.set("profile_id", profileId);
          formData.set("account_type", next === "unset" ? "" : next);
          formAction(formData);
        }}
      >
        <SelectTrigger size="sm" className="w-fit">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="unset">—</SelectItem>
          <SelectItem value="siswa">Siswa</SelectItem>
          <SelectItem value="orang_tua">Orang Tua</SelectItem>
        </SelectContent>
      </Select>
      {state?.error && <p className="text-xs text-destructive">{state.error}</p>}
    </div>
  );
}
