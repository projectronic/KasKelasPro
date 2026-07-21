import { createClient } from "@/lib/supabase/server";
import { SignupForm } from "./signup-form";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function SignupPage() {
  const supabase = await createClient();
  const { data: settings } = await supabase.from("settings").select("class_name").single();
  const className = settings?.class_name || "KasKelasPro";

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="fixed top-4 right-4">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Daftar Akun {className}</CardTitle>
          <CardDescription>
            Siswa dan orang tua/wali bisa daftar dengan akun masing-masing.
            Setelah email dikonfirmasi, akun menunggu approval dari pengurus
            kelas sebelum bisa mengakses data (akses viewer).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignupForm />
        </CardContent>
      </Card>
    </div>
  );
}
