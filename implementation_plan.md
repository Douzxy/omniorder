# Rencana Implementasi: Refactoring Arsitektur, URL Dinamis, dan Modifiers

Dokumen ini berisi rencana terperinci untuk merombak arsitektur aplikasi (pemisahan model/controller, routing berlapis), memperbarui alur pesanan B2C, serta memperbaiki sistem QRIS dan Modifier.

## User Review Required

> [!IMPORTANT]
> **Arsitektur Pemisahan Model/Controller & MySQL:** 
> Untuk mempermudah migrasi ke MySQL di masa depan, kita akan memisahkan semua fungsi pemanggilan data (Supabase) ke dalam folder `src/services/` dan menggunakan Custom Hooks (`src/hooks/`). Dengan ini, komponen UI (React) tidak akan lagi bergantung langsung pada Supabase, melainkan memanggil fungsi di *service layer*. Jika kelak beralih ke MySQL, Anda hanya perlu mengubah isi `src/services/` untuk melakukan HTTP Fetch ke Backend API (VPS) Anda tanpa merusak tampilan (UI). Apakah pendekatan ini sesuai dengan yang Anda maksud?

> [!WARNING]
> **Refactoring Routing Besar-besaran:**
> File `Dashboard.tsx` saat ini sangat besar (100KB+). Kita akan memecahnya menjadi halaman terpisah dengan URL spesifik. 
> 1. `/admin/units` (Super Admin -> Kelola Unit/Brand)
> 2. `/admin/units/:unitId` (Super Admin/Admin Unit -> Kelola Outlet)
> 3. `/admin/outlets/:outletId` (Semua Role -> Workspace Outlet)
> Apakah format URL ini disetujui?

## Open Questions

> [!NOTE]
> 1. **Alur QRIS:** Anda menyebutkan "habis bayar harus konfirmasi ke kasir ngasih kodenya". Apakah ini berarti setelah pelanggan scan QRIS dan sukses membayar (atau pura-pura sukses di demo), sistem akan memunculkan "KODE PESANAN" besar di layar pelanggan, lalu pelanggan harus berjalan ke kasir dan menyebutkan kode tersebut?
> 2. **Modifier:** Saat ini Modifier (misal: "Potongan Ayam") hanya bisa pilih 1. Apakah kita perlu opsi di mana pelanggan harus memilih *minimal* 1 dan *maksimal* 1 (menjadi Radio Button), atau bisa lebih dari 1 (Checkbox)? Kita akan tambahkan pengaturan `min_select` dan `max_select` di database.

## Proposed Changes

### 1. Struktur URL dan Pemisahan Komponen (Controller/Model)

#### [NEW] `src/services/api.ts`
- Berisi abstraksi semua fungsi database CRUD (Create, Read, Update, Delete) yang saat ini menggunakan Supabase.
- Jika kelak pindah ke VPS MySQL, file ini cukup diganti dengan implementasi `fetch()` ke API Backend.

#### [NEW] `src/hooks/`
- `useUnits.ts`, `useOutlets.ts`, `useProducts.ts`, `useOrders.ts`: Hooks untuk mengambil dan mengelola data (state) dari `services/api.ts`.
- Menyimpan *loading state*, *error handling*, dan logika bisnis (Controller).

#### [MODIFY] `src/App.tsx`
- Mengganti rute tunggal `/admin/dashboard` menjadi rute hierarkis:
  - `/admin/units` -> `<UnitsDashboard />`
  - `/admin/units/:unitId` -> `<OutletsDashboard />`
  - `/admin/outlets/:outletId` -> `<OutletWorkspace />`

#### [DELETE] `src/pages/Admin/Dashboard.tsx`
- File monolitik ini akan dihapus dan dipecah menjadi tiga komponen halaman baru (seperti disebutkan di atas) yang berada di dalam folder `src/pages/Admin/`.

### 2. URL State & Navigasi (Menjaga State saat "Back")

#### [NEW/MODIFY] Semua Halaman Admin
- Menggunakan `useSearchParams` (dari `react-router-dom`) untuk menyimpan state UI.
- Contoh: `/admin/outlets/outlet-123?tab=menu&page=2`.
- Saat pengguna menekan tombol "Back" di browser, mereka akan kembali ke tab `menu` halaman `2` dengan sempurna.

### 3. Modifiers Dinamis Terkelompok (Radio/Checkbox)

#### [MODIFY] Skema Database `product_modifiers` (melalui Migrasi Supabase)
- Menambahkan kolom `min_selections` (integer, default 0) dan `max_selections` (integer, default 1).
- Jika max = 1, UI otomatis berubah menjadi *Radio Button* (hanya bisa milih salah satu: Dada, Paha Atas, Sayap, dll).
- Jika max > 1, UI menjadi *Checkbox*.

#### [MODIFY] Komponen B2C (Order & Cart)
- Memperbarui komponen B2C agar membaca aturan min/max modifier dari database.

### 4. Perbaikan B2C Cart (`view-order`)

#### [MODIFY] `src/pages/B2C/Cart.tsx`
- Memastikan urutan form tepat:
  1. Informasi Pelanggan (Nama, Meja).
  2. Daftar Pesanan Baru (Keranjang).
  3. Catatan Pesanan Keseluruhan (General Notes).

### 5. QRIS Dinamis & Kode Konfirmasi

#### [MODIFY] `src/pages/B2C/Payment.tsx`
- Mengimplementasikan Hitungan Mundur 15 Menit (`900` detik) secara ketat. Jika habis, QRIS kadaluarsa.
- Setelah pembayaran berhasil, mengubah navigasi ke Halaman Ringkasan (Summary) dengan menampilkan KODE PESANAN (contoh: `#ORD-A1B2`).
- Pelanggan diinstruksikan memberikan kode tersebut kepada kasir.

## Verification Plan

### Automated / Code Tests
- Tidak ada pengujian otomatis khusus. Seluruh logika komponen React akan diuji fungsionalitasnya.

### Manual Verification
1. **Navigasi URL:** Menguji URL baru. Mengubah tab, melakukan pencarian, pindah halaman (paginasi). Menekan tombol "Back" dan memastikan tidak error/kehilangan status.
2. **Pembayaran QRIS:** Membuat pesanan via QRIS. Menguji waktu mundur (timer), membiarkannya hingga habis untuk melihat state kedaluwarsa. Melakukan simulasi sukses dan memastikan Kode Konfirmasi keluar.
3. **Database Kesiapan MySQL:** Membaca source code dan memastikan logika bisnis sudah terpusat di `/services` dan `/hooks`, memastikan UI komponen sangat bersih (bersih dari `supabase.from()`).
