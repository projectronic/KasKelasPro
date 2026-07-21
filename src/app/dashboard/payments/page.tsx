import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
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
import { PaymentForm } from "./payment-form";

export default async function PaymentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user!.id)
    .single();

  if (profile?.role !== "admin" && profile?.role !== "editor") {
    redirect("/dashboard");
  }

  const [
    { data: activeMembers },
    { data: allMembers },
    { data: settings },
    { data: overrides },
    { data: allPayments },
    { data: recentPayments },
  ] = await Promise.all([
    supabase
      .from("members")
      .select("id, full_name, join_date")
      .eq("active", true)
      .order("full_name"),
    supabase.from("members").select("id, full_name"),
    supabase.from("settings").select("iuran_type, iuran_amount, period_start_date").single(),
    supabase.from("dues_overrides").select("period, amount"),
    supabase.from("payments").select("member_id, period, amount"),
    supabase
      .from("payments")
      .select("id, member_id, period, amount, paid_at, note")
      .order("paid_at", { ascending: false })
      .limit(20),
  ]);

  const memberNames = new Map((allMembers ?? []).map((m) => [m.id, m.full_name]));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Pembayaran</h1>
        <p className="text-sm text-muted-foreground">
          Catat iuran masuk dan lihat riwayat pembayaran terbaru.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Catat Pembayaran Iuran</CardTitle>
          <CardDescription>
            Nominal otomatis terisi sesuai pengaturan (atau pengecualian
            periode itu), tapi tetap bisa diubah manual.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PaymentForm
            members={activeMembers ?? []}
            iuranType={settings?.iuran_type ?? "bulanan"}
            defaultAmount={settings?.iuran_amount ?? 0}
            periodStartDate={settings?.period_start_date ?? new Date().toISOString().slice(0, 10)}
            overrides={overrides ?? []}
            allPayments={allPayments ?? []}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pembayaran Terbaru</CardTitle>
        </CardHeader>
        <CardContent>
          {!recentPayments?.length ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Belum ada pembayaran tercatat.
            </p>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Anggota</TableHead>
                      <TableHead>Periode</TableHead>
                      <TableHead>Nominal</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Catatan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentPayments.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">
                          {memberNames.get(p.member_id) ?? "-"}
                        </TableCell>
                        <TableCell>{p.period}</TableCell>
                        <TableCell>Rp {p.amount.toLocaleString("id-ID")}</TableCell>
                        <TableCell>
                          {new Date(p.paid_at).toLocaleDateString("id-ID")}
                        </TableCell>
                        <TableCell>{p.note ?? "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="grid gap-3 md:hidden">
                {recentPayments.map((p) => (
                  <div key={p.id} className="rounded-lg border p-4">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-medium">
                        {memberNames.get(p.member_id) ?? "-"}
                      </span>
                      <span className="font-semibold">
                        Rp {p.amount.toLocaleString("id-ID")}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-col gap-1 text-sm text-muted-foreground">
                      <div className="flex justify-between gap-2">
                        <span>Periode</span>
                        <span className="text-foreground">{p.period}</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span>Tanggal</span>
                        <span className="text-foreground">
                          {new Date(p.paid_at).toLocaleDateString("id-ID")}
                        </span>
                      </div>
                      {p.note && (
                        <div className="flex justify-between gap-2">
                          <span>Catatan</span>
                          <span className="text-right text-foreground">{p.note}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
