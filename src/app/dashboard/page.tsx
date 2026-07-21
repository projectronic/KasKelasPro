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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TotalUangRadialChart } from "@/components/dashboard/total-uang-radial-chart";
import { PaymentStatusDonutChart } from "@/components/dashboard/payment-status-donut-chart";
import { MonthlyComboChart } from "@/components/dashboard/monthly-combo-chart";
import { computeMonthlyFlow } from "@/lib/dashboard-stats";
import { computeMemberDues, currentPeriod } from "@/lib/dues";

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
    { data: accountTypes },
  ] = await Promise.all([
    supabase
      .from("settings")
      .select("class_name, school_name, iuran_type, iuran_amount, period_start_date")
      .single(),
    supabase.from("members").select("id, full_name, join_date").eq("active", true),
    supabase.from("wallet_balances").select("wallet, balance"),
    supabase.from("profiles").select("role").eq("id", user!.id).single(),
    supabase.from("dues_overrides").select("period, amount"),
    supabase.from("payments").select("member_id, period, amount"),
    supabase.from("wallet_transactions").select("type, amount, created_at"),
    supabase.from("profiles").select("account_type").eq("approved", true),
  ]);

  const canManage = profile?.role === "admin" || profile?.role === "editor";
  const jumlahSiswa = activeMembers?.length ?? 0;
  const akunSiswa = (accountTypes ?? []).filter((p) => p.account_type === "siswa").length;
  const akunOrangTua = (accountTypes ?? []).filter((p) => p.account_type === "orang_tua").length;
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

  const rekapRows = (activeMembers ?? []).map((m) => {
    const memberPayments = (payments ?? []).filter((p) => p.member_id === m.id);
    const dues = computeMemberDues({
      iuranType: settings?.iuran_type ?? "bulanan",
      periodStartDate,
      joinDate: new Date(m.join_date),
      today,
      defaultAmount: settings?.iuran_amount ?? 0,
      overrides: overridesMap,
      payments: memberPayments,
    });
    return { member: m, dues };
  });
  rekapRows.sort((a, b) => b.dues.totalOwed - a.dues.totalOwed);
  const totalTunggakan = rekapRows.reduce((sum, r) => sum + r.dues.totalOwed, 0);

  const thisPeriod = currentPeriod(settings?.iuran_type ?? "bulanan", today);
  const belumBayarBulanIni = rekapRows.filter((r) =>
    r.dues.unpaidPeriods.some((p) => p.period === thisPeriod)
  ).length;
  const lunasBulanIni = rekapRows.length - belumBayarBulanIni;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {settings?.class_name ? `Kelas ${settings.class_name}` : "Kelas Saya"}
          {settings?.school_name ? ` ${settings.school_name}` : ""}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="capitalize">
            Iuran {settings?.iuran_type ?? "-"}
          </Badge>
          <Badge variant="secondary">
            {formatRupiah(settings?.iuran_amount ?? 0)} / {settings?.iuran_type === "harian" ? "hari" : "bulan"}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
              Jumlah Siswa
            </CardTitle>
            <CardAction>
              <Users className="size-4 text-muted-foreground" />
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <span className="text-2xl font-semibold tracking-tight">{jumlahSiswa}</span>
            <div className="flex flex-col gap-1.5 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Akun Siswa</span>
                <span className="font-medium">{akunSiswa}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Akun Orang Tua</span>
                <span className="font-medium">{akunOrangTua}</span>
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
              Status Bulan Ini
            </CardTitle>
            <CardDescription className="capitalize">Periode {thisPeriod}</CardDescription>
          </CardHeader>
          <CardContent>
            <PaymentStatusDonutChart lunas={lunasBulanIni} belumBayar={belumBayarBulanIni} />
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

      <Card>
        <CardHeader>
          <CardTitle>Rekap Tunggakan</CardTitle>
          <CardDescription>
            Dihitung otomatis dari periode ({settings?.iuran_type ?? "bulanan"}) sejak mulai
            kas atau tanggal bergabung (yang lebih belakangan) sampai hari ini, dikurangi
            pembayaran yang sudah tercatat. Diurutkan dari penunggak terbanyak. Total
            tunggakan: <span className="font-semibold text-foreground">{formatRupiah(totalTunggakan)}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rekapRows.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Belum ada anggota aktif.
            </p>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Anggota</TableHead>
                      <TableHead>Periode Tertunggak</TableHead>
                      <TableHead>Total Tunggakan</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rekapRows.map(({ member, dues }) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">{member.full_name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {dues.unpaidPeriods.length
                            ? dues.unpaidPeriods.map((p) => p.period).join(", ")
                            : "-"}
                        </TableCell>
                        <TableCell>{formatRupiah(dues.totalOwed)}</TableCell>
                        <TableCell>
                          <Badge variant={dues.totalOwed > 0 ? "destructive" : "default"}>
                            {dues.totalOwed > 0 ? "Nunggak" : "Lunas"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="grid gap-3 md:hidden">
                {rekapRows.map(({ member, dues }) => (
                  <div key={member.id} className="rounded-lg border p-4">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-medium">{member.full_name}</span>
                      <Badge variant={dues.totalOwed > 0 ? "destructive" : "default"}>
                        {dues.totalOwed > 0 ? "Nunggak" : "Lunas"}
                      </Badge>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Total Tunggakan</span>
                      <span className="font-semibold">{formatRupiah(dues.totalOwed)}</span>
                    </div>
                    {dues.unpaidPeriods.length > 0 && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {dues.unpaidPeriods.map((p) => p.period).join(", ")}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
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
