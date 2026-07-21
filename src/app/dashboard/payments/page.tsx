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
    { data: payments },
  ] = await Promise.all([
    supabase.from("members").select("id, full_name").eq("active", true).order("full_name"),
    supabase.from("members").select("id, full_name"),
    supabase.from("settings").select("iuran_type, iuran_amount").single(),
    supabase.from("dues_overrides").select("period, amount"),
    supabase
      .from("payments")
      .select("id, member_id, period, amount, paid_at, note")
      .order("paid_at", { ascending: false })
      .limit(20),
  ]);

  const memberNames = new Map((allMembers ?? []).map((m) => [m.id, m.full_name]));

  return (
    <div className="flex flex-col gap-6">
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
            overrides={overrides ?? []}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pembayaran Terbaru</CardTitle>
        </CardHeader>
        <CardContent>
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
              {payments?.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{memberNames.get(p.member_id) ?? "-"}</TableCell>
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
        </CardContent>
      </Card>
    </div>
  );
}
