"use client";

import { useActionState, useState } from "react";
import { updateUserRole } from "./actions";
import type { AppRole } from "@/lib/supabase/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ActionState = { error?: string } | null;

export function RoleRowForm({
  profileId,
  role,
  isSelf,
}: {
  profileId: string;
  role: AppRole;
  isSelf: boolean;
}) {
  const [value, setValue] = useState<AppRole>(role);
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    async (_prevState, formData) => (await updateUserRole(formData)) ?? null,
    null
  );

  return (
    <div className="flex flex-col gap-1">
      <Select
        value={value}
        disabled={isSelf || isPending}
        onValueChange={(next) => {
          if (!next) return;
          setValue(next as AppRole);
          const formData = new FormData();
          formData.set("profile_id", profileId);
          formData.set("role", next);
          formAction(formData);
        }}
      >
        <SelectTrigger size="sm" className="w-fit">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="viewer">Viewer</SelectItem>
          <SelectItem value="editor">Editor</SelectItem>
          <SelectItem value="admin">Admin</SelectItem>
        </SelectContent>
      </Select>
      {state?.error && <p className="text-xs text-destructive">{state.error}</p>}
      {isSelf && (
        <p className="text-xs text-muted-foreground">Akun kamu sendiri</p>
      )}
    </div>
  );
}
