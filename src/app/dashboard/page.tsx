import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
        <h1 className="text-2xl font-semibold">
          {settings?.class_name ?? "Kelas Saya"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Mode iuran: {settings?.iuran_type ?? "-"} · Nominal default:{" "}
          {formatRupiah(settings?.iuran_amount ?? 0)}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Anggota Aktif
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {activeMembers}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Saldo Dompet
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {formatRupiah(dompet)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Saldo Bank
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {formatRupiah(bank)}
          </CardContent>
        </Card>
      </div>

      <p className="text-sm text-muted-foreground">
        Lihat detail tunggakan di{" "}
        <Link href="/dashboard/rekap" className="underline underline-offset-4">
          Rekap
        </Link>
        {canManage && (
          <>
            , catat iuran masuk di{" "}
            <Link href="/dashboard/payments" className="underline underline-offset-4">
              Pembayaran
            </Link>
            , atau kelola mutasi dana di{" "}
            <Link href="/dashboard/wallet" className="underline underline-offset-4">
              Dompet
            </Link>
          </>
        )}
        .
      </p>
    </div>
  );
}
