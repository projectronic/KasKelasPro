"use client";

import { useActionState } from "react";
import { approveRegistration } from "./actions";
import { Button } from "@/components/ui/button";

type ActionState = { error?: string } | null;

export function ApproveButton({ profileId }: { profileId: string }) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    async (_prevState, formData) => (await approveRegistration(formData)) ?? null,
    null
  );

  return (
    <form action={formAction} className="flex flex-col gap-1">
      <input type="hidden" name="profile_id" value={profileId} />
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? "Memproses..." : "Approve"}
      </Button>
      {state?.error && <p className="text-xs text-destructive">{state.error}</p>}
    </form>
  );
}
