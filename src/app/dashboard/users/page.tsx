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
import { NameRowForm } from "./name-row-form";
import { AccountTypeRowForm } from "./account-type-row-form";
import { MemberLinkRowForm } from "./member-link-row-form";

const accountTypeLabels: Record<string, string> = {
  siswa: "Siswa",
  orang_tua: "Orang Tua",
};

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
      .select("id, email, full_name, role, title, member_id, account_type, approved, created_at")
      .order("created_at", { ascending: true }),
    supabase.from("members").select("id, full_name").order("full_name"),
  ]);

  const memberNames = new Map((members ?? []).map((m) => [m.id, m.full_name]));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Pengguna</h1>
        <p className="text-sm text-muted-foreground">
          Kelola akun, role, dan persetujuan pendaftaran.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kelola Pengguna</CardTitle>
          <CardDescription>
            Pendaftar baru perlu di-approve (admin & editor bisa approve)
            sebelum bisa mengakses data kelas. Ubah nama, tipe akun, relasi
            anggota, role, dan jabatan hanya bisa admin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!profiles?.length ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Belum ada pengguna terdaftar.
            </p>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Tipe Akun</TableHead>
                      <TableHead>Terhubung Anggota</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Jabatan</TableHead>
                      <TableHead>Status</TableHead>
                      {isAdmin && <TableHead>Password</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {profiles.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">
                          {isAdmin ? (
                            <NameRowForm profileId={p.id} fullName={p.full_name} />
                          ) : (
                            p.full_name ?? "-"
                          )}
                        </TableCell>
                        <TableCell>{p.email}</TableCell>
                        <TableCell>
                          {isAdmin ? (
                            <AccountTypeRowForm
                              profileId={p.id}
                              accountType={p.account_type}
                            />
                          ) : (
                            (p.account_type && accountTypeLabels[p.account_type]) ?? "-"
                          )}
                        </TableCell>
                        <TableCell>
                          {isAdmin ? (
                            <MemberLinkRowForm
                              profileId={p.id}
                              memberId={p.member_id}
                              members={members ?? []}
                            />
                          ) : p.member_id ? (
                            memberNames.get(p.member_id) ?? "-"
                          ) : (
                            "-"
                          )}
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
                  </TableBody>
                </Table>
              </div>

              <div className="grid gap-3 md:hidden">
                {profiles.map((p) => (
                  <div key={p.id} className="flex flex-col gap-3 rounded-lg border p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        {isAdmin ? (
                          <NameRowForm profileId={p.id} fullName={p.full_name} />
                        ) : (
                          <p className="font-medium">{p.full_name ?? "-"}</p>
                        )}
                        <p className="text-sm text-muted-foreground">{p.email}</p>
                      </div>
                      {p.approved ? (
                        <Badge>Approved</Badge>
                      ) : (
                        <Badge variant="secondary">Pending</Badge>
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground">Tipe Akun</span>
                        {isAdmin ? (
                          <AccountTypeRowForm
                            profileId={p.id}
                            accountType={p.account_type}
                          />
                        ) : (
                          <span>
                            {(p.account_type && accountTypeLabels[p.account_type]) ?? "-"}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground">Anggota</span>
                        {isAdmin ? (
                          <MemberLinkRowForm
                            profileId={p.id}
                            memberId={p.member_id}
                            members={members ?? []}
                          />
                        ) : (
                          <span>{p.member_id ? memberNames.get(p.member_id) ?? "-" : "-"}</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground">Role</span>
                        {isAdmin ? (
                          <RoleRowForm
                            profileId={p.id}
                            role={p.role}
                            isSelf={p.id === user!.id}
                          />
                        ) : (
                          <span className="uppercase">{p.role}</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground">Jabatan</span>
                        {isAdmin ? (
                          <TitleRowForm profileId={p.id} title={p.title} />
                        ) : (
                          <span>{p.title ?? "-"}</span>
                        )}
                      </div>
                    </div>

                    {(!p.approved || isAdmin) && (
                      <div className="flex flex-wrap gap-2 border-t pt-3">
                        {!p.approved && <ApproveButton profileId={p.id} />}
                        {isAdmin && <ResetPasswordButton email={p.email} />}
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
