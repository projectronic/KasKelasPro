"use client";

import { useActionState, useState } from "react";
import { correctPayment, deletePayment } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/currency-input";
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

type Payment = {
  id: string;
  period: string;
  amount: number;
  note: string | null;
};

export function PaymentRowActions({
  payment,
  memberName,
}: {
  payment: Payment;
  memberName: string;
}) {
  return (
    <div className="flex items-center gap-1">
      <EditPaymentDialog payment={payment} />
      <DeletePaymentDialog payment={payment} memberName={memberName} />
    </div>
  );
}

function EditPaymentDialog({ payment }: { payment: Payment }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    async (_prevState, formData) => {
      const result = await correctPayment(formData);
      if (!result?.error) setOpen(false);
      return result ?? null;
    },
    null
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>Edit</DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Koreksi Pembayaran</DialogTitle>
          <DialogDescription>
            Perubahan tetap tercatat di Riwayat Aktivitas.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="payment_id" value={payment.id} />
          <div className="flex flex-col gap-2">
            <Label htmlFor={`period-${payment.id}`}>Periode</Label>
            <Input
              id={`period-${payment.id}`}
              name="period"
              defaultValue={payment.period}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`amount-${payment.id}`}>Nominal (Rp)</Label>
            <CurrencyInput
              id={`amount-${payment.id}`}
              name="amount"
              defaultValue={payment.amount}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`note-${payment.id}`}>Catatan</Label>
            <Input id={`note-${payment.id}`} name="note" defaultValue={payment.note ?? ""} />
          </div>
          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
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

function DeletePaymentDialog({
  payment,
  memberName,
}: {
  payment: Payment;
  memberName: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    async (_prevState, formData) => {
      const result = await deletePayment(formData);
      if (!result?.error) setOpen(false);
      return result ?? null;
    },
    null
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="sm" />}>Hapus</DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Hapus Pembayaran?</DialogTitle>
          <DialogDescription>
            Rp {payment.amount.toLocaleString("id-ID")} dari {memberName} untuk
            periode {payment.period}. Aksi ini tidak bisa dibatalkan, tapi
            tetap tercatat di Riwayat Aktivitas.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction}>
          <input type="hidden" name="payment_id" value={payment.id} />
          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Batal
            </DialogClose>
            <Button type="submit" variant="destructive" disabled={isPending}>
              {isPending ? "Menghapus..." : "Hapus"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
