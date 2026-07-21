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
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Riwayat</h1>
        <p className="text-sm text-muted-foreground">
          Log aktivitas 100 entri terbaru.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Aktivitas</CardTitle>
          <CardDescription>
            Log pembayaran, penarikan/transfer dana, dan approval pendaftaran
            — 100 aktivitas terbaru. Hanya admin/editor yang bisa lihat.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!log?.length ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Belum ada aktivitas tercatat.
            </p>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
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
                    {log.map((entry) => {
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
                          <TableCell className="font-medium">
                            {entry.actor_id ? actorNames.get(entry.actor_id) ?? "-" : "-"}
                          </TableCell>
                          <TableCell>{entry.action}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="grid gap-3 md:hidden">
                {log.map((entry) => {
                  const date = new Date(entry.created_at);
                  return (
                    <div key={entry.id} className="rounded-lg border p-4">
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-medium">
                          {entry.actor_id ? actorNames.get(entry.actor_id) ?? "-" : "-"}
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {date.toLocaleDateString("id-ID")}{" "}
                          {date.toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{entry.action}</p>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
