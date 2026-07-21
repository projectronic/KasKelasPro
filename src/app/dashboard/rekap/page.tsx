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
import { Badge } from "@/components/ui/badge";
import { computeMemberDues } from "@/lib/dues";

export default async function RekapPage() {
  const supabase = await createClient();

  const [{ data: settings }, { data: overrides }, { data: members }, { data: payments }] =
    await Promise.all([
      supabase.from("settings").select("iuran_type, iuran_amount").single(),
      supabase.from("dues_overrides").select("period, amount"),
      supabase
        .from("members")
        .select("id, full_name, join_date")
        .eq("active", true)
        .order("full_name"),
      supabase.from("payments").select("member_id, period, amount"),
    ]);

  const iuranType = settings?.iuran_type ?? "bulanan";
  const defaultAmount = settings?.iuran_amount ?? 0;
  const overridesMap = new Map((overrides ?? []).map((o) => [o.period, o.amount]));
  const today = new Date();

  const rows = (members ?? []).map((m) => {
    const memberPayments = (payments ?? []).filter((p) => p.member_id === m.id);
    const dues = computeMemberDues({
      iuranType,
      joinDate: new Date(m.join_date),
      today,
      defaultAmount,
      overrides: overridesMap,
      payments: memberPayments,
    });
    return { member: m, dues };
  });

  rows.sort((a, b) => b.dues.totalOwed - a.dues.totalOwed);

  const totalTunggakan = rows.reduce((sum, r) => sum + r.dues.totalOwed, 0);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Rekap Tunggakan</CardTitle>
          <CardDescription>
            Dihitung otomatis dari periode ({iuranType}) sejak tanggal
            bergabung sampai hari ini, dikurangi pembayaran yang sudah
            tercatat. Diurutkan dari penunggak terbanyak.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-2xl font-semibold">
          Total tunggakan: Rp {totalTunggakan.toLocaleString("id-ID")}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
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
              {rows.map(({ member, dues }) => (
                <TableRow key={member.id}>
                  <TableCell>{member.full_name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {dues.unpaidPeriods.length
                      ? dues.unpaidPeriods.map((p) => p.period).join(", ")
                      : "-"}
                  </TableCell>
                  <TableCell>
                    Rp {dues.totalOwed.toLocaleString("id-ID")}
                  </TableCell>
                  <TableCell>
                    <Badge variant={dues.totalOwed > 0 ? "destructive" : "default"}>
                      {dues.totalOwed > 0 ? "Nunggak" : "Lunas"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Belum ada anggota aktif.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
