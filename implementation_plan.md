# Rencana Implementasi: Fitur 7 - Multi-Cabang Admin (Multi-Outlet Admin Dashboard)

Rencana ini menjelaskan peningkatan dashboard Brand Admin (`OutletsDashboard` dan `BrandDashboardTab`) menjadi dashboard manajemen multi-cabang (multi-outlet) yang komprehensif dan premium. Kita akan mengimplementasikan agregasi data penjualan, performa antar cabang (leaderboard), analisis tipe pesanan/pembayaran brand-wide, tren omzet brand, serta kemudahan navigasi antar cabang.

## User Review Required

> [!IMPORTANT]
> **Agregasi Data Penjualan Seluruh Cabang:**
> Dashboard ini akan menarik seluruh data transaksi dari semua outlet yang berada di bawah brand yang bersangkutan secara real-time. Ini memungkinkan Brand Admin melihat gambaran besar kinerja bisnis mereka tanpa perlu masuk ke masing-masing workspace outlet satu per satu.
>
> **Leaderboard Performa Cabang (Outlet Performance):**
> Kita akan menambahkan tabel/kartu perbandingan performa antar outlet yang diurutkan berdasarkan omzet tertinggi. Di sini juga ditampilkan kontribusi persentase masing-masing outlet terhadap total omzet brand, total transaksi, jumlah staf yang aktif, dan tombol akses cepat untuk membuka Workspace masing-masing outlet.
>
> **Grafik SVG Tren Omzet Brand-Wide:**
> Mengikuti standar kualitas visual premium dari tab laporan outlet, kita akan menambahkan grafik tren omzet kustom (SVG line/area chart) yang menggabungkan penjualan harian dari seluruh outlet dalam brand.

## Open Questions

*Tidak ada pertanyaan terbuka saat ini.*

## Proposed Changes

---

### Brand Admin Dashboard Component & Sub-tabs

#### [MODIFY] [OutletsDashboard.tsx](file:///c:/Users/Edo%20Priyatna/Documents/Developments/omniorder/src/pages/Admin/OutletsDashboard.tsx)
- Tambahkan state `orders` (`const [orders, setOrders] = useState<any[]>([]);`) untuk menyimpan seluruh pesanan dari semua outlet di brand ini.
- Update fungsi `fetchData`:
  - Dapatkan daftar ID outlet dari `outletData`.
  - Jika daftar ID tidak kosong, lakukan query ke tabel `orders` menggunakan operator `.in("outlet_id", ids)` untuk memuat semua pesanan seluruh outlet.
  - Urutkan pesanan berdasarkan tanggal pembuatan teranyar.
- Teruskan data `outlets`, `orders`, dan `outletAdmins` ke komponen `BrandDashboardTab`.

#### [MODIFY] [BrandDashboardTab.tsx](file:///c:/Users/Edo%20Priyatna/Documents/Developments/omniorder/src/pages/Admin/BrandDashboardTab.tsx)
- Ubah definisi `BrandDashboardTabProps` untuk menerima:
  - `brandName: string`
  - `outlets: Outlet[]`
  - `orders: Order[]`
  - `outletAdmins: { id: string; outlet_id: string; email: string }[]`
- Tambahkan filter rentang waktu (*date range selector*): "Hari Ini", "7 Hari", "30 Hari", dan "Semua Waktu" (berbagi gaya visual dengan WorkspaceReportsTab).
- Hitung metrik agregat brand (KPI) untuk periode aktif (hanya menghitung pesanan dengan status `completed`):
  - **Omzet Gabungan (Total Brand Revenue):** Penjumlahan omzet seluruh outlet.
  - **Total Transaksi Brand (Total Brand Orders):** Jumlah pesanan selesai dari seluruh outlet.
  - **Rata-rata Nilai Keranjang (Brand AOV):** Total Omzet Gabungan dibagi Total Transaksi Brand.
  - **Cabang Terlaris (Top Performing Outlet):** Nama outlet dengan total penjualan terbesar beserta jumlah omzetnya.
- Buat **Grafik Tren Omzet Brand-Wide** (Line & Area Chart kustom menggunakan SVG) untuk menganalisis naik turunnya penjualan gabungan per hari/jam.
- Implementasikan **Leaderboard Performa Cabang (Outlet Performance)**:
  - Urutkan list outlet berdasarkan kontribusi omzet dari yang terbesar hingga terkecil.
  - Tampilkan visual progress bar yang menunjukkan kontribusi masing-masing outlet terhadap total pendapatan brand.
  - Tampilkan ringkasan metrik per outlet (Pendapatan, Jumlah Pesanan Selesai, Jumlah Staf Aktif).
  - Tambahkan tombol pintas "Buka Workspace" yang mengarahkan langsung ke URL `/admin/outlets/:outletId` dengan transisi halus.
- Tambahkan analisis brand-wide untuk **Distribusi Tipe Pesanan** (Dine-in vs Takeaway vs Delivery) dan **Metode Pembayaran** (Cash vs QRIS).

---

## Verification Plan

### Automated Tests
- Menjalankan pemeriksaan tipe TypeScript proyek:
  `npx tsc --noEmit`
- Menjalankan build produksi untuk memastikan tidak ada error kompilasi:
  `npm run build`

### Manual Verification
1. **Verifikasi Agregasi Data:** Masuk sebagai Brand Admin. Pastikan metrik KPI (Total Revenue, Total Orders) menghitung secara kumulatif semua pesanan dari semua cabang yang berada di bawah brand tersebut.
2. **Uji Filter Tanggal:** Klik filter rentang waktu (Hari Ini, 7 Hari, 30 Hari). Pastikan grafik tren omzet gabungan dan leaderboard performa outlet terupdate secara real-time dan akurat.
3. **Navigasi Leaderboard:** Klik tombol "Buka Workspace" pada salah satu outlet di list leaderboard. Pastikan router mengarahkan admin ke workspace outlet tersebut secara instan.
4. **Verifikasi Kontribusi Cabang:** Periksa apakah persentase kontribusi omzet masing-masing outlet terhitung dengan benar (omzet outlet / total omzet brand * 100%) dan direpresentasikan secara visual dengan progress bar.
