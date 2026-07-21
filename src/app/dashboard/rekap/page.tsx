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
      supabase.from("settings").select("iuran_type, iuran_amount, period_start_date").single(),
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
  const periodStartDate = new Date(settings?.period_start_date ?? new Date());
  const overridesMap = new Map((overrides ?? []).map((o) => [o.period, o.amount]));
  const today = new Date();

  const rows = (members ?? []).map((m) => {
    const memberPayments = (payments ?? []).filter((p) => p.member_id === m.id);
    const dues = computeMemberDues({
      iuranType,
      periodStartDate,
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
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Rekap</h1>
        <p className="text-sm text-muted-foreground">
          Ringkasan tunggakan iuran seluruh anggota aktif.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rekap Tunggakan</CardTitle>
          <CardDescription>
            Dihitung otomatis dari periode ({iuranType}) sejak mulai kas atau
            tanggal bergabung (yang lebih belakangan) sampai hari ini,
            dikurangi pembayaran yang sudah tercatat. Diurutkan dari
            penunggak terbanyak.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-2xl font-semibold tracking-tight">
          Total tunggakan: Rp {totalTunggakan.toLocaleString("id-ID")}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          {rows.length === 0 ? (
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
                    {rows.map(({ member, dues }) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">{member.full_name}</TableCell>
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
                  </TableBody>
                </Table>
              </div>

              <div className="grid gap-3 md:hidden">
                {rows.map(({ member, dues }) => (
                  <div key={member.id} className="rounded-lg border p-4">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-medium">{member.full_name}</span>
                      <Badge variant={dues.totalOwed > 0 ? "destructive" : "default"}>
                        {dues.totalOwed > 0 ? "Nunggak" : "Lunas"}
                      </Badge>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Total Tunggakan</span>
                      <span className="font-semibold">
                        Rp {dues.totalOwed.toLocaleString("id-ID")}
                      </span>
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
    </div>
  );
}
