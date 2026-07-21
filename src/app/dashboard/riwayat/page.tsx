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

export default async function RiwayatPage() {
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

  const [{ data: log }, { data: profiles }] = await Promise.all([
    supabase
      .from("activity_log")
      .select("id, actor_id, action, created_at")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase.from("profiles").select("id, full_name, email"),
  ]);

  const actorNames = new Map(
    (profiles ?? []).map((p) => [p.id, p.full_name ?? p.email])
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Riwayat Aktivitas</CardTitle>
        <CardDescription>
          Log pembayaran, penarikan/transfer dana, dan approval pendaftaran
          — 100 aktivitas terbaru. Hanya admin/editor yang bisa lihat.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tanggal</TableHead>
              <TableHead>Jam</TableHead>
              <TableHead>Pengguna</TableHead>
              <TableHead>Tindakan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {log?.map((entry) => {
              const date = new Date(entry.created_at);
              return (
                <TableRow key={entry.id}>
                  <TableCell>{date.toLocaleDateString("id-ID")}</TableCell>
                  <TableCell>
                    {date.toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </TableCell>
                  <TableCell>
                    {entry.actor_id ? actorNames.get(entry.actor_id) ?? "-" : "-"}
                  </TableCell>
                  <TableCell>{entry.action}</TableCell>
                </TableRow>
              );
            })}
            {!log?.length && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  Belum ada aktivitas tercatat.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
