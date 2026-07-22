import { Landmark } from "lucide-react";
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
  const { data: settings } = await supabase
    .from("settings")
    .select("class_name, school_name")
    .single();
  const className = settings?.class_name;
  const schoolName = settings?.school_name;

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="fixed top-4 right-4">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="items-center justify-items-center text-center">
          <div className="mb-1 flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Landmark className="size-5" />
          </div>
          <CardTitle>
            {className ? `Daftar Akun Kas Kelas ${className}` : "Daftar Akun KasKelasPro"}
            {schoolName && <span className="block text-sm font-normal text-muted-foreground">{schoolName}</span>}
          </CardTitle>
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
