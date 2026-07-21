# 💰 KasKelasPro

**Dashboard kas kelas open-source berbasis Next.js, Supabase, dan Vercel** — untuk bendahara kelas yang ingin mengelola iuran (harian maupun bulanan), memantau tunggakan, dan berbagi akses ke siswa/orang tua secara aman, tanpa spreadsheet manual.

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](./LICENSE)
[![Made with Next.js](https://img.shields.io/badge/Made%20with-Next.js-000000?logo=next.js)](https://nextjs.org)
[![Powered by Supabase](https://img.shields.io/badge/Powered%20by-Supabase-3ECF8E?logo=supabase)](https://supabase.com)
[![Deploy on Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fprojectronic%2FKasKelasPro)
[![Status](https://img.shields.io/badge/status-work%20in%20progress-orange)]()

> 🚧 **Status: dalam pengembangan aktif.** Struktur database, halaman, dan tombol deploy akan terus diperbarui. Lihat [Roadmap](#-roadmap) untuk progres.

---

## 📖 Daftar Isi

- [💰 KasKelasPro](#-kaskelaspro)
  - [📖 Daftar Isi](#-daftar-isi)
  - [🎯 Kenapa KasKelasPro?](#-kenapa-kaskelaspro)
  - [✨ Fitur](#-fitur)
  - [🧩 Tech Stack](#-tech-stack)
  - [🔐 Role \& Hak Akses](#-role--hak-akses)
  - [🚀 Mulai Cepat (Deploy Sendiri)](#-mulai-cepat-deploy-sendiri)
  - [🔑 Environment Variables](#-environment-variables)
  - [🛡️ Privasi \& Tanggung Jawab](#️-privasi--tanggung-jawab)
  - [🗺️ Roadmap](#️-roadmap)
  - [🤝 Kontribusi](#-kontribusi)
  - [🙏 Kredit](#-kredit)
  - [📄 Lisensi](#-lisensi)

---

## 🎯 Kenapa KasKelasPro?

Bendahara kelas biasanya mencatat kas di buku, grup chat, atau spreadsheet — gampang hilang, sulit diaudit, dan rawan salah hitung. **KasKelasPro** dibuat supaya satu kelas bisa punya "sistem keuangan mini" sendiri:

- Data tersimpan aman di **Supabase** (Postgres + Auth + Row Level Security), bukan cuma di browser satu orang.
- Bisa **di-deploy gratis** oleh siapa saja ke akun **Vercel** + **Supabase** masing-masing dalam hitungan menit.
- Siswa dan orang tua bisa diberi akses **lihat-saja** tanpa perlu takut data diubah sembarangan.

## ✨ Fitur

| Fitur | Keterangan |
|---|---|
| 🗓️ **Mode iuran fleksibel** | Pilih saat setup: **iuran harian** (misal Rp1.000/hari sekolah) atau **iuran bulanan** (nominal tetap per bulan) |
| ⚙️ **Pengaturan besar iuran** | Nominal iuran diatur lewat halaman Settings, tidak hardcode di kode. Bisa juga atur **pengecualian nominal per bulan/periode tertentu** (mis. bulan pertama beda karena ada biaya pendaftaran) |
| 👥 **Manajemen anggota** | CRUD data siswa, termasuk **nama, email, dan telepon orang tua/wali** |
| 🔐 **Role management** | `admin`, `editor` (bendahara/pengurus — bisa input transaksi & kelola data), `viewer` (siswa/orang tua terdaftar — lihat saldo & rekap saja) |
| 💵 **Dompet & Bank** | Pisah saldo kas tunai dan saldo bank, dengan mutasi antar-dompet |
| 📊 **Rekap & tunggakan otomatis** | Hitung tunggakan berdasarkan mode iuran yang aktif |
| 🧾 **Riwayat penarikan** | Catat penggunaan dana lengkap dengan alasan, sebagai bukti pertanggungjawaban |
| 🔑 **Reset password mandiri** | Anggota bisa reset password sendiri lewat email (halaman Lupa Password), admin juga bisa memicu reset untuk akun tertentu |
| 🌗 **Dark/light mode** | Toggle tema (Terang/Gelap/Sistem) di pojok kanan atas setiap halaman, tersimpan sesuai preferensi browser |

## 🧩 Tech Stack

- **[Next.js](https://nextjs.org)** — frontend + API routes
- **[Supabase](https://supabase.com)** — Postgres database, Auth, dan Row Level Security untuk role management
- **[Vercel](https://vercel.com)** — hosting & CI/CD

## 🔐 Role & Hak Akses

| Aksi | Admin | Editor | Viewer |
|---|:---:|:---:|:---:|
| Melihat dashboard, saldo, rekap | ✅ | ✅ | ✅ |
| Input transaksi kas / iuran | ✅ | ✅ | ❌ |
| Tambah/edit data anggota | ✅ | ✅ | ❌ |
| Ubah pengaturan (nominal iuran, mode harian/bulanan) | ✅ | ❌ | ❌ |
| Kelola role pengguna lain | ✅ | ❌ | ❌ |
| Reset password pengguna lain | ✅ | ❌ | ❌ |

Semua orang (termasuk yang belum login) bisa reset password mereka sendiri lewat halaman **Lupa Password** di `/login`.

Viewer diaktifkan otomatis untuk siapa pun yang mendaftar dengan **email yang sudah terdaftar** sebagai siswa/orang tua di data anggota — tanpa perlu diundang manual satu per satu.

## 🚀 Mulai Cepat (Deploy Sendiri)

### 1. Setup Supabase

1. Buat akun/project baru di [supabase.com](https://supabase.com) (gratis).
2. Buka **SQL Editor** di dashboard project → tempel seluruh isi [`supabase/schema.sql`](./supabase/schema.sql) → **Run**. Ini akan membuat semua tabel, RLS policy, trigger whitelist-signup, dan fungsi ledger sekaligus.
3. Buka **Project Settings → API**, catat **Project URL** dan **anon public key** — dipakai di langkah 3 bagian deploy.
4. Buka **Authentication → URL Configuration**, isi **Site URL** dengan domain Vercel kamu nanti (bisa diisi/diubah belakangan setelah deploy jadi tahu domainnya).

### 2. Deploy ke Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fprojectronic%2FKasKelasPro&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,SUPABASE_SERVICE_ROLE_KEY&envDescription=Kredensial%20dari%20Supabase%20project%20kamu%20(Project%20Settings%20%E2%86%92%20API)&envLink=https%3A%2F%2Fgithub.com%2Fprojectronic%2FKasKelasPro%23-environment-variables&project-name=kaskelaspro&repository-name=kaskelaspro)

1. Klik tombol di atas, hubungkan akun GitHub kamu (Vercel akan membuat fork/clone repo ini ke akunmu).
2. Saat diminta environment variables, isi `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` dari langkah Supabase di atas. `SUPABASE_SERVICE_ROLE_KEY` opsional untuk sekarang (isi kalau nanti butuh operasi admin khusus).
3. Klik **Deploy** dan tunggu build selesai.

### 3. Sambungkan balik ke Supabase

1. Setelah deploy sukses, salin domain Vercel kamu (mis. `kaskelaspro-punyaku.vercel.app`).
2. Kembali ke Supabase → **Authentication → URL Configuration** → update **Site URL** dengan domain itu, supaya link konfirmasi email mengarah ke tempat yang benar.

### 4. Pemakaian pertama

1. Buka domain Vercel kamu → **/signup** → daftar akun pertama. Akun pertama ini **otomatis jadi admin**.
2. Login sebagai admin → **Pengaturan**: atur nama kelas, mode iuran (harian/bulanan), dan nominal default.
3. **Anggota**: input data siswa beserta email siswa/orang tua — email ini yang jadi whitelist supaya mereka bisa daftar sebagai viewer.
4. **Pengguna**: kalau perlu, promosikan salah satu akun jadi `editor` (mis. bendahara kedua) lewat halaman ini.

## 🔑 Environment Variables

Salin [`.env.example`](./.env.example) menjadi `.env.local` lalu isi dengan kredensial project Supabase-mu sendiri:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

> ⚠️ `SUPABASE_SERVICE_ROLE_KEY` punya akses penuh ke database (bypass RLS). Jangan pernah expose ke client atau commit ke git — file `.env*` sudah masuk `.gitignore`.

## 🛡️ Privasi & Tanggung Jawab

KasKelasPro menyimpan **data pribadi** (nama, email, nomor telepon siswa maupun orang tua/wali). Karena proyek ini open-source dan di-*deploy sendiri* (self-hosted) oleh masing-masing pengguna:

- **Setiap pengelola/deployer bertanggung jawab penuh** atas keamanan, penyimpanan, dan kepatuhan hukum terkait data yang dimasukkan ke instance mereka masing-masing, termasuk kepatuhan terhadap **UU Perlindungan Data Pribadi (UU No. 27 Tahun 2022)**.
- Disarankan meminta persetujuan siswa/orang tua sebelum memasukkan data kontak mereka.
- Proyek ini disediakan **"as is"** tanpa jaminan apa pun (lihat [Lisensi](#-lisensi)) — penulis/kontributor tidak bertanggung jawab atas kebocoran atau penyalahgunaan data pada instance pihak ketiga.

## 🗺️ Roadmap

- [x] Scaffold project Next.js + shadcn/ui + koneksi Supabase
- [x] Skema database (anggota, settings, dues_overrides, payments, wallet_transactions, roles) + RLS policy — lihat [`supabase/schema.sql`](./supabase/schema.sql)
- [x] Autentikasi & pendaftaran viewer berbasis whitelist email
- [x] Toggle mode iuran harian/bulanan + pengecualian per periode di Settings
- [x] Halaman input pembayaran iuran & riwayat penarikan/transfer dompet↔bank
- [x] Rekap tunggakan otomatis per anggota, diurutkan dari penunggak terbanyak
- [x] Tombol Deploy to Vercel + panduan setup Supabase step-by-step lengkap
- [x] Halaman kelola role pengguna (ubah viewer/editor/admin dari UI)
- [x] Reset password mandiri (self-service) + reset oleh admin
- [x] Dark/light mode toggle
- [ ] Sidebar navigasi (collapsible) — saat ini navigasi masih top nav bar sederhana, belum ada sidebar

## 🤝 Kontribusi

Pull request, issue, dan masukan sangat terbuka. Kalau menemukan bug atau ingin mengusulkan fitur, silakan buka [Issue](../../issues) baru.

## 🙏 Kredit

Terinspirasi dari [**KasKelas**](https://github.com/xDzaky/KasKelas) oleh [@xDzaky](https://github.com/xDzaky) — versi original yang lebih sederhana (vanilla JS + localStorage, kas harian saja, tanpa role/backend). KasKelasPro dikembangkan sebagai reimplementasi dengan arsitektur, fitur, dan tujuan penggunaan (multi-user, self-hosted) yang berbeda.

## 📄 Lisensi

[GNU AGPL v3](./LICENSE) — bebas digunakan, dimodifikasi, dan didistribusikan ulang. Bedanya dengan lisensi permisif (MIT/Apache): kalau kamu menjalankan versi modifikasi sebagai layanan (mis. di-hosting untuk pihak lain, termasuk secara komersial), kamu **wajib merilis source code versi modifikasi tersebut** ke pengguna layanan itu juga — celah "ambil kode open-source, modifikasi, jual sebagai SaaS tertutup" yang biasanya lolos di lisensi permisif, ditutup oleh AGPL.

---

<p align="center">
  Traktir saya kopi di:<br />
  <a href="https://trakteer.id/vicky_andhika" target="_blank"><img id="wse-buttons-preview" src="https://edge-cdn.trakteer.id/images/embed/trbtn-red-1.png?v=14-05-2025" height="40" style="border:0px;height:40px;" alt="Trakteer Saya"></a>
</p>
