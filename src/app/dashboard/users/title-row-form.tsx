"use client";

import { useActionState } from "react";
import { updateUserTitle } from "./actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type ActionState = { error?: string } | null;

export function TitleRowForm({
  profileId,
  title,
}: {
  profileId: string;
  title: string | null;
}) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    async (_prevState, formData) => (await updateUserTitle(formData)) ?? null,
    null
  );

  return (
    <form action={formAction} className="flex items-center gap-1">
      <input type="hidden" name="profile_id" value={profileId} />
      <Input
        name="title"
        defaultValue={title ?? ""}
        placeholder="mis. Ketua, Bendahara"
        className="h-8 w-36 text-sm"
      />
      <Button type="submit" variant="outline" size="sm" disabled={isPending}>
        {isPending ? "..." : "Simpan"}
      </Button>
      {state?.error && <p className="text-xs text-destructive">{state.error}</p>}
    </form>
  );
}
