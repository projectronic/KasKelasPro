"use client";

import { useActionState, useRef } from "react";
import { updateUserRole } from "./actions";
import type { AppRole } from "@/lib/supabase/types";

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
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    async (_prevState, formData) => (await updateUserRole(formData)) ?? null,
    null
  );

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-1">
      <input type="hidden" name="profile_id" value={profileId} />
      <select
        name="role"
        defaultValue={role}
        disabled={isSelf || isPending}
        onChange={() => formRef.current?.requestSubmit()}
        className="h-8 w-fit rounded-md border bg-transparent px-2 text-sm disabled:opacity-50"
      >
        <option value="viewer">Viewer</option>
        <option value="editor">Editor</option>
        <option value="admin">Admin</option>
      </select>
      {state?.error && <p className="text-xs text-destructive">{state.error}</p>}
      {isSelf && (
        <p className="text-xs text-muted-foreground">Akun kamu sendiri</p>
      )}
    </form>
  );
}
