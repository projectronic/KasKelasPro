"use client";

import { useActionState } from "react";
import { updateUserName } from "./actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type ActionState = { error?: string } | null;

export function NameRowForm({
  profileId,
  fullName,
}: {
  profileId: string;
  fullName: string | null;
}) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    async (_prevState, formData) => (await updateUserName(formData)) ?? null,
    null
  );

  return (
    <form action={formAction} className="flex items-center gap-1">
      <input type="hidden" name="profile_id" value={profileId} />
      <Input
        name="full_name"
        defaultValue={fullName ?? ""}
        className="h-8 w-36 text-sm"
        required
      />
      <Button type="submit" variant="outline" size="sm" disabled={isPending}>
        {isPending ? "..." : "Simpan"}
      </Button>
      {state?.error && <p className="text-xs text-destructive">{state.error}</p>}
    </form>
  );
}
