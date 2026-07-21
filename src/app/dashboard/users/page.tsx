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
import { RoleRowForm } from "./role-row-form";
import { ResetPasswordButton } from "./reset-password-button";
import { ApproveButton } from "./approve-button";
import { TitleRowForm } from "./title-row-form";

export default async function UsersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user!.id)
    .single();

  const isAdmin = profile?.role === "admin";
  const isEditor = profile?.role === "editor";

  if (!isAdmin && !isEditor) {
    redirect("/dashboard");
  }

  const [{ data: profiles }, { data: members }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, email, full_name, role, title, member_id, approved, created_at")
      .order("created_at", { ascending: true }),
    supabase.from("members").select("id, full_name"),
  ]);

  const memberNames = new Map((members ?? []).map((m) => [m.id, m.full_name]));

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Kelola Pengguna</CardTitle>
          <CardDescription>
            Pendaftar baru perlu di-approve (admin & editor bisa approve)
            sebelum bisa mengakses data kelas. Ubah role hanya bisa admin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Terhubung Anggota</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Jabatan</TableHead>
                <TableHead>Status</TableHead>
                {isAdmin && <TableHead>Password</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles?.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.full_name ?? "-"}</TableCell>
                  <TableCell>{p.email}</TableCell>
                  <TableCell>
                    {p.member_id ? memberNames.get(p.member_id) ?? "-" : "-"}
                  </TableCell>
                  <TableCell>
                    {isAdmin ? (
                      <RoleRowForm
                        profileId={p.id}
                        role={p.role}
                        isSelf={p.id === user!.id}
                      />
                    ) : (
                      <span className="uppercase">{p.role}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {isAdmin ? (
                      <TitleRowForm profileId={p.id} title={p.title} />
                    ) : (
                      p.title ?? "-"
                    )}
                  </TableCell>
                  <TableCell>
                    {p.approved ? (
                      <Badge>Approved</Badge>
                    ) : (
                      <div className="flex flex-col gap-1">
                        <Badge variant="secondary">Pending</Badge>
                        <ApproveButton profileId={p.id} />
                      </div>
                    )}
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      <ResetPasswordButton email={p.email} />
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {!profiles?.length && (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 7 : 6} className="text-center text-muted-foreground">
                    Belum ada pengguna terdaftar.
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
