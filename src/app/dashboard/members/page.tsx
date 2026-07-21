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
import { AddMemberForm } from "./add-member-form";

export default async function MembersPage() {
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

  const { data: members } = await supabase
    .from("members")
    .select("id, full_name, email, parent_name, parent_email, parent_phone, active")
    .order("full_name");

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Tambah Anggota</CardTitle>
          <CardDescription>
            Email siswa dan/atau email orang tua di sini yang menjadi
            whitelist untuk akses viewer.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AddMemberForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Anggota</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Orang Tua/Wali</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members?.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>{m.full_name}</TableCell>
                  <TableCell>{m.email ?? "-"}</TableCell>
                  <TableCell>
                    {m.parent_name ?? "-"}
                    {m.parent_email && (
                      <div className="text-xs text-muted-foreground">
                        {m.parent_email} {m.parent_phone && `· ${m.parent_phone}`}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={m.active ? "default" : "secondary"}>
                      {m.active ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
