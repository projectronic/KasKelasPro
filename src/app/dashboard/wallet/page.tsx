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
import { Badge } from "@/components/ui/badge";
import { TransferForm } from "./transfer-form";
import { WithdrawalForm } from "./withdrawal-form";

const TYPE_LABEL: Record<string, string> = {
  deposit: "Setoran",
  withdrawal: "Penarikan",
  transfer_in: "Transfer masuk",
  transfer_out: "Transfer keluar",
};

export default async function WalletPage() {
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

  const [{ data: balances }, { data: history }] = await Promise.all([
    supabase.from("wallet_balances").select("wallet, balance"),
    supabase
      .from("wallet_transactions")
      .select("id, wallet, type, amount, note, created_at")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const dompet = balances?.find((b) => b.wallet === "dompet")?.balance ?? 0;
  const bank = balances?.find((b) => b.wallet === "bank")?.balance ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Saldo Dompet</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            Rp {dompet.toLocaleString("id-ID")}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Saldo Bank</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            Rp {bank.toLocaleString("id-ID")}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pindahkan Dana</CardTitle>
          <CardDescription>Mutasi antara dompet (kas tunai) dan bank (kas virtual).</CardDescription>
        </CardHeader>
        <CardContent>
          <TransferForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Penarikan Dana</CardTitle>
          <CardDescription>Catat penggunaan kas lengkap dengan alasan, sebagai bukti pertanggungjawaban.</CardDescription>
        </CardHeader>
        <CardContent>
          <WithdrawalForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Mutasi</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Dompet</TableHead>
                <TableHead>Jenis</TableHead>
                <TableHead>Nominal</TableHead>
                <TableHead>Catatan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history?.map((h) => (
                <TableRow key={h.id}>
                  <TableCell>
                    {new Date(h.created_at).toLocaleDateString("id-ID")}
                  </TableCell>
                  <TableCell className="capitalize">{h.wallet}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        h.type === "deposit" || h.type === "transfer_in"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {TYPE_LABEL[h.type] ?? h.type}
                    </Badge>
                  </TableCell>
                  <TableCell>Rp {h.amount.toLocaleString("id-ID")}</TableCell>
                  <TableCell>{h.note ?? "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
