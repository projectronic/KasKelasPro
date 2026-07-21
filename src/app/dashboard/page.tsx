import Link from "next/link";
import { Users, Wallet, Landmark, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: settings }, { data: members }, { data: wallets }, { data: profile }] =
    await Promise.all([
      supabase.from("settings").select("class_name, iuran_type, iuran_amount").single(),
      supabase.from("members").select("id, active"),
      supabase.from("wallet_balances").select("wallet, balance"),
      supabase.from("profiles").select("role").eq("id", user!.id).single(),
    ]);

  const canManage = profile?.role === "admin" || profile?.role === "editor";
  const activeMembers = members?.filter((m) => m.active).length ?? 0;
  const dompet = wallets?.find((w) => w.wallet === "dompet")?.balance ?? 0;
  const bank = wallets?.find((w) => w.wallet === "bank")?.balance ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {settings?.class_name ?? "Kelas Saya"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Mode iuran: {settings?.iuran_type ?? "-"} · Nominal default:{" "}
          {formatRupiah(settings?.iuran_amount ?? 0)}
        </p>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-normal text-muted-foreground">
              Anggota Aktif
            </CardTitle>
            <CardAction>
              <Users className="size-4 text-muted-foreground" />
            </CardAction>
          </CardHeader>
          <CardContent className="text-2xl font-semibold tracking-tight">
            {activeMembers}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-normal text-muted-foreground">
              Saldo Dompet
            </CardTitle>
            <CardAction>
              <Wallet className="size-4 text-muted-foreground" />
            </CardAction>
          </CardHeader>
          <CardContent className="text-2xl font-semibold tracking-tight">
            {formatRupiah(dompet)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-normal text-muted-foreground">
              Saldo Bank
            </CardTitle>
            <CardAction>
              <Landmark className="size-4 text-muted-foreground" />
            </CardAction>
          </CardHeader>
          <CardContent className="text-2xl font-semibold tracking-tight">
            {formatRupiah(bank)}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
        <Link
          href="/dashboard/rekap"
          className="inline-flex items-center gap-1 font-medium text-foreground hover:underline underline-offset-4"
        >
          Lihat rekap tunggakan <ArrowRight className="size-3.5" />
        </Link>
        {canManage && (
          <>
            <Link
              href="/dashboard/payments"
              className="inline-flex items-center gap-1 font-medium text-foreground hover:underline underline-offset-4"
            >
              Catat pembayaran <ArrowRight className="size-3.5" />
            </Link>
            <Link
              href="/dashboard/wallet"
              className="inline-flex items-center gap-1 font-medium text-foreground hover:underline underline-offset-4"
            >
              Kelola dompet <ArrowRight className="size-3.5" />
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
