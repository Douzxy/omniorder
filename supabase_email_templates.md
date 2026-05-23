# Supabase Email Templates - Simple HTML (No Styling)

Berikut adalah template email sederhana dalam format HTML polos tanpa gaya desain (CSS/styling/warna). Template ini sangat natural, bersih, dan langsung ke intinya dalam bahasa Indonesia.

---

## 1. Confirm Signup (Konfirmasi Pendaftaran)
**Lokasi di Supabase:** Authentication -> Email Templates -> Confirm signup

### Subject (Judul Email)
```text
Konfirmasi alamat email Anda
```

### Body (Konten HTML)
```html
<h2>Konfirmasi alamat email Anda</h2>

<p>Terima kasih telah mendaftar. Silakan klik tautan di bawah ini untuk mengonfirmasi alamat email Anda dan menyelesaikan proses pendaftaran:</p>

<p><a href="{{ .ConfirmationURL }}">Konfirmasi alamat email</a></p>

<p>Jika Anda tidak merasa melakukan pendaftaran ini, silakan abaikan email ini dengan aman.</p>
```

---

## 2. Magic Link / Sign-In Link (Tautan Masuk)
**Lokasi di Supabase:** Authentication -> Email Templates -> Magic link

### Subject (Judul Email)
```text
Tautan masuk Anda
```

### Body (Konten HTML)
```html
<h2>Tautan masuk Anda</h2>

<p>Silakan klik tautan di bawah ini untuk masuk ke akun Anda. Tautan masuk ini hanya dapat digunakan satu kali dan akan segera kedaluwarsa demi alasan keamanan:</p>

<p><a href="{{ .ConfirmationURL }}">Masuk ke akun Anda</a></p>

<p>Jika Anda tidak meminta tautan masuk ini, silakan abaikan email ini dengan aman.</p>
```
