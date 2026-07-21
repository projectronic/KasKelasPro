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
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Anggota</h1>
        <p className="text-sm text-muted-foreground">
          Daftar anggota kelas dan status keaktifannya.
        </p>
      </div>

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
          {!members?.length ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Belum ada anggota.
            </p>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
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
                      {canManage && <TableHead className="text-right">Aksi</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="font-medium">{m.full_name}</TableCell>
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
                          <TableCell className="text-right">
                            <EditMemberDialog member={m} />
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="grid gap-3 md:hidden">
                {members.map((m) => (
                  <div key={m.id} className="rounded-lg border p-4">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-medium">{m.full_name}</span>
                      <Badge variant={m.active ? "default" : "secondary"}>
                        {m.active ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </div>
                    {canManage && (
                      <div className="mt-3 flex flex-col gap-1.5 text-sm text-muted-foreground">
                        <div className="flex justify-between gap-2">
                          <span>Email</span>
                          <span className="text-right text-foreground">
                            {m.email ?? "-"}
                          </span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span>Telepon</span>
                          <span className="text-right text-foreground">
                            {m.phone ? <PhoneLink phone={m.phone} /> : "-"}
                          </span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span>Orang Tua/Wali</span>
                          <span className="text-right text-foreground">
                            {m.parent_name ?? "-"}
                          </span>
                        </div>
                        {m.parent_email && (
                          <div className="flex justify-between gap-2">
                            <span>Email Ortu</span>
                            <span className="text-right text-foreground">
                              {m.parent_email}
                            </span>
                          </div>
                        )}
                        {m.parent_phone && (
                          <div className="flex justify-between gap-2">
                            <span>Telepon Ortu</span>
                            <span className="text-right text-foreground">
                              <PhoneLink phone={m.parent_phone} />
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    {canManage && (
                      <div className="mt-3">
                        <EditMemberDialog member={m} />
                      </div>
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
