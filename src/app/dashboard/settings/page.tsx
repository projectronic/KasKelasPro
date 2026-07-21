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
import { FetchHolidaysForm, AddHolidayForm } from "./holiday-form";
import { deleteHoliday } from "./actions";
import { Button } from "@/components/ui/button";

async function handleDeleteHoliday(formData: FormData) {
  "use server";
  await deleteHoliday(formData);
}

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
    .select("class_name, school_name, iuran_type, iuran_amount, period_start_date")
    .single();

  const { data: overrides } = await supabase
    .from("dues_overrides")
    .select("id, period, amount, note")
    .order("period", { ascending: true });

  const { data: holidays } = await supabase
    .from("holidays")
    .select("date, note")
    .order("date", { ascending: true });

  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Pengaturan</h1>
        <p className="text-sm text-muted-foreground">
          Konfigurasi iuran kelas dan pengecualian nominal per periode.
        </p>
      </div>

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
            schoolName={settings?.school_name ?? ""}
            iuranType={settings?.iuran_type ?? "bulanan"}
            iuranAmount={settings?.iuran_amount ?? 0}
            periodStartDate={settings?.period_start_date ?? new Date().toISOString().slice(0, 10)}
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
                <li
                  key={o.id}
                  className="flex flex-wrap justify-between gap-x-4 gap-y-1 border-b pb-2"
                >
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

      <Card>
        <CardHeader>
          <CardTitle>Hari Libur</CardTitle>
          <CardDescription>
            Dipakai form pembayaran harian supaya rentang tanggal yang dipilih
            tidak ikut menghitung akhir pekan dan hari libur. Ambil kalender
            libur nasional otomatis, lalu tambah atau hapus sesuai kebutuhan
            (mis. libur semester sekolah).
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <FetchHolidaysForm />
          <ul className="flex flex-col gap-2 text-sm">
            {holidays?.length ? (
              holidays.map((h) => (
                <li
                  key={h.date}
                  className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b pb-2"
                >
                  <span>
                    {h.date} {h.note && `— ${h.note}`}
                  </span>
                  <form action={handleDeleteHoliday}>
                    <input type="hidden" name="date" value={h.date} />
                    <Button type="submit" variant="ghost" size="sm">
                      Hapus
                    </Button>
                  </form>
                </li>
              ))
            ) : (
              <li className="text-muted-foreground">Belum ada hari libur.</li>
            )}
          </ul>
          <AddHolidayForm />
        </CardContent>
      </Card>
    </div>
  );
}
