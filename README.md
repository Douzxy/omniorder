# OmniOrder

**OmniOrder** adalah solusi platform *Point of Sales* (POS) dan *Self-Ordering* modern yang dirancang khusus untuk industri F&B (Food & Beverage). Sistem ini memudahkan pelanggan untuk memesan makanan dan minuman langsung dari perangkat mereka—baik untuk *Dine-in* (lewat pindaian QR Code meja), *Takeaway*, maupun *Delivery*.

## ✨ Fitur Utama

### 📱 Modul B2C (Aplikasi Pelanggan)
- **Self-Ordering Cepat:** Memindai QR Code untuk langsung mengakses katalog menu outlet secara *real-time*.
- **UI/UX Elegan & Interaktif:** Antarmuka responsif dengan desain *mobile-first*, *glassmorphism*, dan animasi yang mulus.
- **Pencarian Cerdas (Inline Search):** Temukan menu favorit dengan filter langsung (instan) tanpa perlu berpindah halaman atau membuka modal.
- **Navigasi Pintar (Scrollspy):** Tab kategori akan bergeser secara otomatis (*auto-scroll*) mengikuti posisi daftar menu saat pengguna melakukan *scroll*.
- **Kustomisasi Pesanan (Modifiers):** Dukungan penuh untuk *product modifiers* (misal: tingkat kepedasan, ukuran, varian rasa) dan catatan khusus per produk.
- **Keranjang Pintar:** Manajemen keranjang yang menghitung total harga secara otomatis beserta pengaturan pajak sebelum konfirmasi ke kasir.

### ⚙️ Modul B2B (Dasbor Admin & Manajemen Outlet)
- **Manajemen Menu & Kategori:** Menambah, mengubah, dan mematikan menu (*sold out*) secara langsung.
- **Pengelolaan Modifier:** Kontrol penuh terhadap opsi ekstra pada menu (baik yang wajib diisi maupun opsional).
- **Riwayat & Pantauan Pesanan:** Melihat arus pesanan yang masuk beserta detail status pembayarannya.
- **QR Code Generator:** Pembuatan QR Code dinamis untuk setiap nomor meja, sehingga pesanan langsung terikat ke meja tertentu.

## 🛠️ Teknologi yang Digunakan
Proyek ini dibangun di atas tumpukan teknologi modern:
- **Frontend Framework:** React + Vite
- **Bahasa Pemrograman:** TypeScript
- **Styling:** Tailwind CSS
- **Ikonografi:** Lucide React
- **Routing:** React Router DOM
- **Backend & Database:** Supabase (PostgreSQL, Real-time API)

## 🚀 Cara Menjalankan Proyek Secara Lokal

1. **Clone Repositori:**
   ```bash
   git clone <repository-url>
   cd omniorder
   ```

2. **Instal Dependensi:**
   ```bash
   npm install
   ```

3. **Konfigurasi Environment Variables:**
   Buat file `.env` di bagian *root* proyek dan tambahkan kunci akses Supabase Anda:
   ```env
   VITE_SUPABASE_URL=url_supabase_anda
   VITE_SUPABASE_ANON_KEY=key_anon_supabase_anda
   ```

4. **Jalankan Server Development:**
   ```bash
   npm run dev
   ```

5. **Akses Aplikasi:**
   Kunjungi tautan (biasanya `http://localhost:5173`) yang muncul pada terminal browser Anda.

---
*Dibuat untuk merevolusi kemudahan transaksi industri F&B.*
