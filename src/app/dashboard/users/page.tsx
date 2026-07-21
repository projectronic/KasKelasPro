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
import { RoleRowForm } from "./role-row-form";
import { ResetPasswordButton } from "./reset-password-button";

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

  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  const [{ data: profiles }, { data: members }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, email, full_name, role, member_id, created_at")
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
            Ubah role langsung dari dropdown — tersimpan otomatis. Hanya
            admin yang bisa mengakses halaman ini.
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
                <TableHead>Password</TableHead>
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
                    <RoleRowForm
                      profileId={p.id}
                      role={p.role}
                      isSelf={p.id === user!.id}
                    />
                  </TableCell>
                  <TableCell>
                    <ResetPasswordButton email={p.email} />
                  </TableCell>
                </TableRow>
              ))}
              {!profiles?.length && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
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
