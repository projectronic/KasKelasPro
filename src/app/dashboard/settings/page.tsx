import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SettingsForm } from "./settings-form";
import { DuesOverrideForm } from "./dues-override-form";

export default async function SettingsPage() {
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

  const { data: settings } = await supabase
    .from("settings")
    .select("class_name, iuran_type, iuran_amount")
    .single();

  const { data: overrides } = await supabase
    .from("dues_overrides")
    .select("id, period, amount, note")
    .order("period", { ascending: true });

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Pengaturan Iuran</CardTitle>
          <CardDescription>
            Hanya admin yang bisa mengubah nominal iuran dan mode
            harian/bulanan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SettingsForm
            className={settings?.class_name ?? ""}
            iuranType={settings?.iuran_type ?? "bulanan"}
            iuranAmount={settings?.iuran_amount ?? 0}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pengecualian Nominal per Periode</CardTitle>
          <CardDescription>
            Contoh: bulan pertama beda karena ada biaya pendaftaran. Format
            periode: <code>2026-01</code> (bulanan) atau{" "}
            <code>2026-01-15</code> (harian).
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <ul className="flex flex-col gap-2 text-sm">
            {overrides?.length ? (
              overrides.map((o) => (
                <li key={o.id} className="flex justify-between border-b pb-2">
                  <span>
                    {o.period} {o.note && `— ${o.note}`}
                  </span>
                  <span className="font-medium">
                    Rp {o.amount.toLocaleString("id-ID")}
                  </span>
                </li>
              ))
            ) : (
              <li className="text-muted-foreground">Belum ada pengecualian.</li>
            )}
          </ul>
          <DuesOverrideForm />
        </CardContent>
      </Card>
    </div>
  );
}
