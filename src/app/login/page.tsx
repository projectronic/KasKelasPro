import { Landmark } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "./login-form";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function LoginPage() {
  const supabase = await createClient();
  const { data: settings } = await supabase.from("settings").select("class_name").single();
  const className = settings?.class_name || "KasKelasPro";

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="fixed top-4 right-4">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <div className="mb-1 flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Landmark className="size-5" />
          </div>
          <CardTitle>Masuk ke {className}</CardTitle>
          <CardDescription>
            Gunakan email yang sudah terdaftar sebagai pengurus, siswa, atau
            orang tua/wali.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  );
}
