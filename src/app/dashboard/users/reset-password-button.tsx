"use client";

import { useActionState } from "react";
import { sendPasswordReset } from "./actions";
import { Button } from "@/components/ui/button";

type ActionState = { error?: string; success?: string } | null;

export function ResetPasswordButton({ email }: { email: string }) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    async (_prevState, formData) => (await sendPasswordReset(formData)) ?? null,
    null
  );

  return (
    <form action={formAction} className="flex flex-col gap-1">
      <input type="hidden" name="email" value={email} />
      <Button type="submit" variant="outline" size="sm" disabled={isPending}>
        {isPending ? "Mengirim..." : "Reset Password"}
      </Button>
      {state?.error && <p className="text-xs text-destructive">{state.error}</p>}
      {state?.success && (
        <p className="text-xs text-emerald-600">{state.success}</p>
      )}
    </form>
  );
}
