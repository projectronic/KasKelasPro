import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, role, title, approved")
    .eq("id", user.id)
    .single();

  const role = profile?.role ?? "viewer";
  const canManage = role === "admin" || role === "editor";

  if (!profile?.approved && !canManage) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed top-4 right-4">
          <ThemeToggle />
        </div>
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Menunggu Persetujuan</CardTitle>
            <CardDescription>
              Pendaftaran kamu sudah masuk, tapi akun ini masih menunggu
              persetujuan dari pengurus kelas sebelum bisa mengakses data.
              Coba lagi nanti, atau hubungi pengurus kelas langsung.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={signOut}>
              <Button type="submit" variant="outline" size="sm">
                Keluar
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <nav className="flex items-center gap-4 text-sm font-medium">
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/dashboard/rekap">Rekap</Link>
          <Link href="/dashboard/members">Anggota</Link>
          {canManage && <Link href="/dashboard/payments">Pembayaran</Link>}
          {canManage && <Link href="/dashboard/wallet">Dompet</Link>}
          {role === "admin" && (
            <Link href="/dashboard/settings">Pengaturan</Link>
          )}
          {canManage && <Link href="/dashboard/users">Pengguna</Link>}
          {canManage && <Link href="/dashboard/riwayat">Riwayat</Link>}
        </nav>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>
            {profile?.full_name ?? profile?.email} ·{" "}
            {profile?.title ? profile.title : <span className="uppercase">{role}</span>}
          </span>
          <ThemeToggle />
          <form action={signOut}>
            <Button type="submit" variant="outline" size="sm">
              Keluar
            </Button>
          </form>
        </div>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
