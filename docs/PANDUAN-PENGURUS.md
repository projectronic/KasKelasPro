# 📘 Panduan Pengurus — Cara Pakai KasKelasPro

Panduan ini untuk **pengurus kelas** (bendahara, ketua, sekretaris) yang tugasnya mencatat iuran dan mengelola dompet kelas sehari-hari — bukan panduan untuk deploy/setup aplikasi (itu ada di [README](https://github.com/projectronic/KasKelasPro#-mulai-cepat-deploy-sendiri)).

Kalau kamu baru pertama kali pegang aplikasi ini, cukup baca bagian **Tugas Sehari-hari** — bagian lain tinggal dibuka kalau memang dibutuhkan.

---

## 📖 Daftar Isi

- [Peran Kamu](#-peran-kamu)
- [Tugas Sehari-hari](#-tugas-sehari-hari)
  - [1. Approve pendaftaran baru](#1-approve-pendaftaran-baru)
  - [2. Mencatat pembayaran iuran](#2-mencatat-pembayaran-iuran)
  - [3. Membetulkan pembayaran yang salah catat](#3-membetulkan-pembayaran-yang-salah-catat)
  - [4. Mencatat penarikan/transfer dompet & bank](#4-mencatat-penarikantransfer-dompet--bank)
  - [5. Cek rekap tunggakan & dashboard](#5-cek-rekap-tunggakan--dashboard)
- [Tugas Sesekali (Admin)](#-tugas-sesekali-admin)
  - [Atur nominal & mode iuran](#atur-nominal--mode-iuran)
  - [Atur Hari Libur](#atur-hari-libur)
  - [Kelola data Anggota](#kelola-data-anggota)
  - [Kelola Pengguna](#kelola-pengguna)
- [Riwayat Aktivitas](#-riwayat-aktivitas)
- [FAQ](#-faq)
- [Butuh Bantuan?](#-butuh-bantuan)

---

## 🔑 Peran Kamu

Ada 3 peran di aplikasi ini — cek dulu kamu yang mana, karena beberapa halaman cuma muncul untuk peran tertentu:

| Peran | Bisa apa |
|---|---|
| **Admin** | Semua hal di panduan ini + ubah role pengguna lain + ubah pengaturan iuran + reset password orang lain. Biasanya orang yang pertama kali deploy aplikasinya. |
| **Editor** | Bendahara/pengurus sehari-hari — bisa catat pembayaran, kelola dompet, approve pendaftaran, tambah/edit anggota. Tidak bisa ubah pengaturan iuran atau role orang lain. |
| **Viewer** | Siswa/orang tua yang sudah di-approve — cuma bisa lihat saldo & rekap, tidak bisa input apa-apa. |

Kalau menu **Pengaturan** atau kolom tertentu di halaman **Pengguna** tidak muncul buat kamu, berarti kamu editor, bukan admin — minta admin kelas yang mengerjakan bagian itu.

---

## ✅ Tugas Sehari-hari

### 1. Approve pendaftaran baru

Setiap siswa/orang tua yang daftar sendiri lewat halaman `/signup` **tidak langsung bisa akses data** — statusnya "Pending" sampai kamu approve.

1. Buka menu **Pengguna**.
2. Cari akun berstatus badge **Pending**, klik tombol **Approve** di sampingnya.
3. Selesai — orang itu langsung bisa login dan lihat data kelas.

> 💡 Sistem otomatis mencocokkan akun siswa & orang tua ke anak yang sama berdasarkan **nama siswa yang diketik saat daftar** — kalau namanya beda dikit (typo, singkatan, dsb.) bisa nyambung ke anak yang salah atau bikin data anak dobel. Kalau ketemu kasus begini, lihat [Kelola Pengguna](#kelola-pengguna) untuk membetulkannya.

### 2. Mencatat pembayaran iuran

Buka menu **Pembayaran**. Tampilannya beda tergantung mode iuran kelas (diatur di Pengaturan):

**Mode Bulanan:**
1. Pilih anggota.
2. Sistem otomatis menampilkan checklist **bulan-bulan yang belum lunas** beserta nominalnya.
3. Centang bulan yang mau dibayar (bisa lebih dari satu sekaligus), isi tanggal bayar & catatan (opsional).
4. Kalau ada yang mau **bayar di muka** (borongan beberapa bulan ke depan yang belum jatuh tempo), klik **"+ Bayar di muka untuk bulan berikutnya"** di bawah checklist utama — muncul daftar 12 bulan ke depan yang juga bisa dicentang.
5. Klik **Catat Pembayaran**.

**Mode Harian:**
1. Pilih anggota, lalu pilih **Tanggal Mulai** dan **Tanggal Akhir** rentang yang mau dibayar (default cuma 1 hari — hari ini).
2. Sistem otomatis membuat checklist tiap hari sekolah di rentang itu — **akhir pekan dan Hari Libur otomatis tidak dihitung**.
3. Centang/hapus centang hari sesuai kebutuhan, lalu **Catat Pembayaran**.

**Bayar sebagian (tidak pas jumlahnya)?**
Kalau siswa cuma bisa bayar sebagian (mis. iuran Rp10.000 tapi baru bayar Rp5.000), langsung ubah angka di kolom nominal pada baris bulan/hari itu sebelum klik Catat Pembayaran — kolomnya otomatis tercentang begitu diketik. Sisa kekurangannya akan tetap muncul sebagai tunggakan sampai dilunasi di kesempatan berikutnya.

### 3. Membetulkan pembayaran yang salah catat

Salah ketik nominal, salah pilih anggota, atau salah periode? Buka menu **Pembayaran**, cari baris pembayarannya di tabel **Pembayaran Terbaru**, lalu:

- **Edit** — betulkan periode/nominal/catatan.
- **Hapus** — hapus pembayaran itu sepenuhnya (akan diminta konfirmasi dulu).

Kedua aksi ini tetap tercatat di [Riwayat Aktivitas](#-riwayat-aktivitas), jadi ada jejaknya walau datanya sudah diubah/dihapus.

### 4. Mencatat penarikan/transfer dompet & bank

Buka menu **Dompet**:

- **Tarik dana** — catat pengeluaran (jajan rapat, beli perlengkapan, dsb.) lengkap dengan alasannya, sebagai bukti pertanggungjawaban.
- **Transfer** — pindahkan saldo antara dompet tunai dan rekening bank (mis. setor tunai ke bank, atau tarik dari bank buat kebutuhan tunai).

### 5. Cek rekap tunggakan & dashboard

Semua ringkasan ada di halaman **Dashboard**: saldo kas, jumlah siswa, status bayar bulan ini, tren bulanan, dan tabel **Rekap Tunggakan** (siapa saja yang masih nunggak, diurutkan dari yang paling banyak).

---

## 🛠️ Tugas Sesekali (Admin)

### Atur nominal & mode iuran

Menu **Pengaturan** (admin only):

- **Nama Kelas** & **Nama Sekolah** — tampil di sidebar dan judul tab browser.
- **Mode Iuran** — Harian atau Bulanan.
- **Nominal Iuran Default** — dipakai kalau tidak ada pengecualian khusus.
- **Kas Mulai Dihitung Sejak** — biasanya awal tahun ajaran; tunggakan dihitung dari tanggal ini (atau tanggal gabung siswa kalau lebih belakangan).
- **Pengecualian Nominal per Periode** — kalau ada bulan/hari dengan nominal beda (mis. bulan pertama + biaya pendaftaran).

### Atur Hari Libur

Masih di halaman **Pengaturan**, bagian **Hari Libur** — dipakai supaya form pembayaran harian tidak ikut menghitung hari libur:

1. Klik **Ambil Hari Libur Nasional** untuk isi otomatis dari kalender libur nasional tahun berjalan.
2. Tambahkan manual untuk libur khusus sekolah (libur semester, dsb.) lewat form di bawah daftar.
3. Hapus tanggal yang keliru lewat tombol **Hapus** di sampingnya.

### Kelola data Anggota

Menu **Anggota** — tambah siswa baru manual (kalau tidak semua orang mau daftar sendiri) atau betulkan data (nama typo, kontak orang tua, status aktif/nonaktif). **Nama Siswa** satu-satunya field wajib — email dan telepon (siswa maupun orang tua) semuanya opsional, jadi anak yang belum punya email/HP sendiri tetap bisa didaftarkan.

### Kelola Pengguna

Menu **Pengguna** (sebagian kolom admin only) — selain approve pendaftaran, kamu juga bisa membetulkan:

- **Nama** akun (kalau typo saat daftar).
- **Tipe Akun** — toggle Siswa / Orang Tua.
- **Terhubung Anggota** — kalau akun ke-sambung ke anak yang salah (misal karena nama saat daftar beda dengan di roster), pilih ulang anak yang benar dari dropdown ini.
- **Role** & **Jabatan** — role menentukan hak akses (lihat [Peran Kamu](#-peran-kamu)); jabatan cuma label tampilan (mis. "Ketua", "Bendahara"), tidak mengubah hak akses.
- **Reset Password** — kirim link reset password ke email pengguna tertentu kalau dia lupa password-nya sendiri.

---

## 🕒 Riwayat Aktivitas

Menu **Riwayat** mencatat 100 aktivitas terakhir — siapa mencatat pembayaran, menarik/transfer dana, approve pendaftaran, sampai koreksi/hapus pembayaran. Berguna kalau ada pertanyaan "siapa yang catat ini" atau butuh bukti audit.

---

## ❓ FAQ

**Anak tidak punya email/nomor HP sendiri, bisa didaftarkan?**
Bisa. Untuk masuk roster (ditagih iuran), cukup nama saja — lihat [Kelola data Anggota](#kelola-data-anggota). Untuk akses lihat saldo, anak tidak perlu akun sendiri — biarkan **orang tua** yang daftar pakai email orang tua sendiri, pilih "Orang Tua/Wali", isi nama anak persis sama seperti di roster supaya otomatis tersambung.

**Ada dua akun ke-sambung ke anak yang salah, atau malah bikin dua anak beda padahal orangnya sama?**
Betulkan lewat **Terhubung Anggota** di halaman Pengguna ([lihat di atas](#kelola-pengguna)), atau betulkan datanya langsung di halaman Anggota.

**Salah catat nominal/anggota/periode pembayaran?**
Edit atau hapus langsung dari tabel Pembayaran Terbaru — lihat [Membetulkan pembayaran yang salah catat](#3-membetulkan-pembayaran-yang-salah-catat). Tidak perlu edit database manual.

**Siswa cuma bisa bayar sebagian?**
Ubah nominalnya langsung saat mencatat pembayaran — lihat [Mencatat pembayaran iuran](#2-mencatat-pembayaran-iuran).

---

## 🙋 Butuh Bantuan?

Kalau menemukan bug atau ada yang membingungkan dari panduan ini, laporkan lewat [Issue](https://github.com/projectronic/KasKelasPro/issues) di GitHub, atau hubungi admin kelas yang mengelola aplikasi ini.
