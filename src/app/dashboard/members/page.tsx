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
import { PhoneLink } from "@/components/phone-link";
import { AddMemberForm } from "./add-member-form";
import { EditMemberDialog } from "./edit-member-dialog";

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

  const canManage = profile?.role === "admin" || profile?.role === "editor";

  // Fetched here regardless of role (server-side only, never sent to the
  // client bundle); rendering below decides what a viewer actually sees —
  // name + status only (see the privacy note in the README).
  const { data: members } = await supabase
    .from("members")
    .select("id, full_name, email, phone, parent_name, parent_email, parent_phone, active")
    .order("full_name");

  return (
    <div className="flex flex-col gap-6">
      {canManage && (
        <Card>
          <CardHeader>
            <CardTitle>Tambah Anggota</CardTitle>
            <CardDescription>
              Untuk menambahkan anggota langsung sebagai aktif tanpa lewat
              pendaftaran mandiri (mis. siswa yang tidak akan membuat akun
              sendiri).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AddMemberForm />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Daftar Anggota</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                {canManage && (
                  <>
                    <TableHead>Email</TableHead>
                    <TableHead>Telepon</TableHead>
                    <TableHead>Orang Tua/Wali</TableHead>
                  </>
                )}
                <TableHead>Status</TableHead>
                {canManage && <TableHead>Aksi</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {members?.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>{m.full_name}</TableCell>
                  {canManage && (
                    <>
                      <TableCell>{m.email ?? "-"}</TableCell>
                      <TableCell>
                        {m.phone ? <PhoneLink phone={m.phone} /> : "-"}
                      </TableCell>
                      <TableCell>
                        {m.parent_name ?? "-"}
                        {m.parent_email && (
                          <div className="text-xs text-muted-foreground">
                            {m.parent_email}
                          </div>
                        )}
                        {m.parent_phone && (
                          <div className="text-xs text-muted-foreground">
                            <PhoneLink phone={m.parent_phone} />
                          </div>
                        )}
                      </TableCell>
                    </>
                  )}
                  <TableCell>
                    <Badge variant={m.active ? "default" : "secondary"}>
                      {m.active ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </TableCell>
                  {canManage && (
                    <TableCell>
                      <EditMemberDialog member={m} />
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
