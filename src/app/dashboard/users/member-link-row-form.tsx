"use client";

import { useActionState, useState } from "react";
import { updateUserMemberLink } from "./actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ActionState = { error?: string } | null;
type Member = { id: string; full_name: string };

export function MemberLinkRowForm({
  profileId,
  memberId,
  members,
}: {
  profileId: string;
  memberId: string | null;
  members: Member[];
}) {
  const [value, setValue] = useState<string>(memberId ?? "none");
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    async (_prevState, formData) => (await updateUserMemberLink(formData)) ?? null,
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
          formData.set("member_id", next === "none" ? "" : next);
          formAction(formData);
        }}
      >
        <SelectTrigger size="sm" className="w-full max-w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Tidak terhubung</SelectItem>
          {members.map((m) => (
            <SelectItem key={m.id} value={m.id}>
              {m.full_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {state?.error && <p className="text-xs text-destructive">{state.error}</p>}
    </div>
  );
}
