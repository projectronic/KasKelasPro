import Link from "next/link";
import { Users, Wallet, Landmark, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TotalUangRadialChart } from "@/components/dashboard/total-uang-radial-chart";
import { MonthlyComboChart } from "@/components/dashboard/monthly-combo-chart";
import { computeMonthlyFlow } from "@/lib/dashboard-stats";

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

  const [
    { data: settings },
    { data: activeMembers },
    { data: wallets },
    { data: profile },
    { data: overrides },
    { data: payments },
    { data: walletTransactions },
  ] = await Promise.all([
    supabase
      .from("settings")
      .select("class_name, iuran_type, iuran_amount, period_start_date")
      .single(),
    supabase.from("members").select("id, join_date").eq("active", true),
    supabase.from("wallet_balances").select("wallet, balance"),
    supabase.from("profiles").select("role").eq("id", user!.id).single(),
    supabase.from("dues_overrides").select("period, amount"),
    supabase.from("payments").select("member_id, period, amount"),
    supabase.from("wallet_transactions").select("type, amount, created_at"),
  ]);

  const canManage = profile?.role === "admin" || profile?.role === "editor";
  const jumlahSiswa = activeMembers?.length ?? 0;
  const dompet = wallets?.find((w) => w.wallet === "dompet")?.balance ?? 0;
  const bank = wallets?.find((w) => w.wallet === "bank")?.balance ?? 0;
  const totalSaldo = dompet + bank;

  const totalPengeluaran = (walletTransactions ?? [])
    .filter((t) => t.type === "withdrawal")
    .reduce((sum, t) => sum + t.amount, 0);

  const overridesMap = new Map((overrides ?? []).map((o) => [o.period, o.amount]));
  const today = new Date();
  const periodStartDate = new Date(
    settings?.period_start_date ?? today.toISOString().slice(0, 10)
  );

  const monthlyFlow = computeMonthlyFlow({
    iuranType: settings?.iuran_type ?? "bulanan",
    periodStartDate,
    today,
    defaultAmount: settings?.iuran_amount ?? 0,
    overrides: overridesMap,
    members: activeMembers ?? [],
    payments: payments ?? [],
    walletTransactions: walletTransactions ?? [],
  });

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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-normal text-muted-foreground">
              Total Saldo
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <span className="text-2xl font-semibold tracking-tight">
              {formatRupiah(totalSaldo)}
            </span>
            <div className="flex flex-col gap-1.5 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Landmark className="size-3.5" /> Saldo Bank
                </span>
                <span className="font-medium">{formatRupiah(bank)}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Wallet className="size-3.5" /> Saldo Dompet
                </span>
                <span className="font-medium">{formatRupiah(dompet)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-normal text-muted-foreground">
              Total Uang
            </CardTitle>
            <CardDescription>Saldo saat ini vs total pengeluaran sepanjang waktu</CardDescription>
          </CardHeader>
          <CardContent>
            <TotalUangRadialChart saldo={totalSaldo} pengeluaran={totalPengeluaran} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-normal text-muted-foreground">
              Jumlah Siswa
            </CardTitle>
            <CardAction>
              <Users className="size-4 text-muted-foreground" />
            </CardAction>
          </CardHeader>
          <CardContent className="text-2xl font-semibold tracking-tight">
            {jumlahSiswa}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pemasukan, Pengeluaran &amp; Tunggakan per Bulan</CardTitle>
          <CardDescription>
            Sejak {periodStartDate.toLocaleDateString("id-ID", { month: "long", year: "numeric" })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MonthlyComboChart data={monthlyFlow} />
        </CardContent>
      </Card>

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
