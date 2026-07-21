import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
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

  const { data: settings } = await supabase
    .from("settings")
    .select("class_name, school_name")
    .single();

  const role = profile?.role ?? "viewer";
  const canManage = role === "admin" || role === "editor";
  const isAdmin = role === "admin";

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

  const cookieStore = await cookies();
  const sidebarState = cookieStore.get("sidebar_state")?.value;
  const defaultOpen = sidebarState !== "false";

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <DashboardSidebar
        fullName={profile?.full_name ?? null}
        email={profile?.email ?? null}
        role={role}
        title={profile?.title ?? null}
        canManage={canManage}
        isAdmin={isAdmin}
        className={settings?.class_name ?? null}
        schoolName={settings?.school_name ?? null}
      />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/60">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-5" />
          <div className="flex-1" />
          <ThemeToggle />
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
