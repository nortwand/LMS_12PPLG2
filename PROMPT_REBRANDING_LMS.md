# Prompt Rebranding LMS

Salin prompt di bawah ini ke coding agent setelah membuat copy project LMS.
Ganti semua nilai di dalam tanda kurung siku sebelum digunakan.

```text
Saya sedang melakukan rebranding project LMS hasil copy dari project lama.
Tolong ubah seluruh identitas project dari brand lama menjadi brand baru berikut:

- Brand baru: [NAMA_BRAND]
- Nama database MySQL/MariaDB: [NAMA_DATABASE]
- Host database: [DB_HOST]
- Port database: [DB_PORT]
- User database: [DB_USER]
- Password database: [DB_PASSWORD]
- Domain email akun seed: [DOMAIN_EMAIL]
- Prefix internal/cookie/localStorage/event: [PREFIX_LOWERCASE]
- Nama package npm: [NAMA_PACKAGE_LOWERCASE]
- Tahun copyright: [TAHUN]

Kerjakan dengan aturan berikut:

1. Cari seluruh kemunculan brand lama dalam source code, termasuk variasi huruf besar-kecil.
   Abaikan node_modules, .next, dist, build, dan file cache/generated.

2. Ganti secara lengkap pada:
   - Logo, alt text, title, metadata, favicon label, header, navbar, footer, halaman login,
     halaman dashboard, email OTP, export Excel, README, dan dokumentasi.
   - Nama package di package.json dan package-lock.json.
   - Cookie name, JWT/session identifier, event name, localStorage key, cache key,
     dan identifier internal lain yang masih memakai brand lama.
   - Email seed, nama akun seed, domain email seed, dan account.txt.
   - DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, DATABASE_URL, dan fallback database.
   - URL, hostname, IP, port, atau konfigurasi environment yang masih menunjuk ke project lama.

3. Untuk branding UI:
   - Gunakan hanya brand baru: [NAMA_BRAND].
   - Jangan menyisakan teks brand lama di source code aktif.
   - Jangan mempertahankan logo/mark lama jika masih berkaitan dengan brand lama.
   - Pertahankan layout, fitur, API, role, dan alur aplikasi yang sudah ada.
   - Jangan menghapus data atau fitur yang tidak berhubungan dengan rebranding.

4. Untuk database dan Prisma:
   - Periksa prisma/schema.prisma, prisma.config.ts, lib/db.ts, dan prisma/seed.ts.
   - Pastikan semua konfigurasi menggunakan database [NAMA_DATABASE].
   - Pastikan seed menggunakan email dengan domain [DOMAIN_EMAIL].
   - Jangan melakukan reset database atau perintah --force-reset tanpa meminta persetujuan saya
     tepat sebelum menjalankannya.
   - Jika db push mendeteksi data loss, jelaskan tabel/data yang akan terdampak dan minta
     konfirmasi eksplisit terlebih dahulu.

5. Agar compiling tidak error:
   - Jangan melakukan replace buta pada seluruh folder.
   - Edit hanya file source/config yang relevan.
   - Setelah setiap perubahan besar, jalankan:
       npx tsc --noEmit
   - Perbaiki hanya error yang disebabkan oleh perubahan rebranding.
   - Jangan memperbaiki error lama yang tidak berkaitan kecuali saya minta.
   - Pastikan import yang tidak lagi digunakan ikut dihapus.
   - Pastikan JSX/TypeScript tetap valid.

6. Setelah source code valid, jalankan urutan berikut:
   - npx prisma validate
   - npx prisma generate
   - npx prisma db push
   - npx prisma db seed

7. Jika db push gagal karena foreign key/index/data legacy:
   - Jangan langsung reset database.
   - Jelaskan penyebabnya.
   - Tawarkan solusi yang paling aman.
   - Minta konfirmasi eksplisit sebelum memakai prisma db push --force-reset atau perintah
     destruktif lainnya.

8. Validasi akhir:
   - Jalankan npx tsc --noEmit.
   - Cari ulang brand lama hanya pada source/config aktif, bukan node_modules atau .next.
   - Jalankan git diff --check.
   - Laporkan file yang diubah, hasil compile, hasil Prisma, hasil seed, dan error lama yang
     masih tersisa bila ada.

Jangan membuat commit atau branch baru.
Jangan mengubah schema database selain jika memang diperlukan oleh konfigurasi brand/database.
Mulai dari pencarian source aktif, lalu lakukan perubahan kecil dan validasi bertahap.
```

## Contoh Pengisian

```text
Brand baru: Studify
Nama database MySQL/MariaDB: Studify
Host database: 127.0.0.1
Port database: 3306
User database: root
Password database:
Domain email akun seed: studify.sch.id
Prefix internal/cookie/localStorage/event: studify
Nama package npm: studify
Tahun copyright: 2026
```

## Perintah Prisma Manual

```powershell
npx prisma validate
npx prisma generate
npx prisma db push
npx prisma db seed
```

`prisma db push` dapat meminta konfirmasi jika perubahan berpotensi menghapus data. Jangan memakai `--force-reset` kecuali data lama memang boleh dihapus dan sudah mendapat persetujuan eksplisit.

---

## Opsi 2: Rebranding Project Untuk Dikirim Sebagai ZIP

Gunakan prompt ini jika project akan dikirim ke orang lain dalam bentuk ZIP.
Ganti semua nilai dalam tanda kurung siku sebelum digunakan.

```text
Saya menerima project LMS dalam bentuk ZIP hasil copy dari project lama.

Tolong lakukan rebranding dan siapkan project ini agar bisa dikirim ke orang lain
dan dijalankan dari awal dengan konfigurasi mereka sendiri.

Identitas project baru:
- Brand baru: [NAMA_BRAND]
- Nama database MySQL/MariaDB: [NAMA_DATABASE]
- DB host: [DB_HOST]
- DB port: [DB_PORT]
- DB user: [DB_USER]
- DB password: [DB_PASSWORD]
- Domain email akun seed: [DOMAIN_EMAIL]
- Prefix cookie/session/localStorage/event: [PREFIX_LOWERCASE]
- Nama package npm: [NAMA_PACKAGE_LOWERCASE]
- Tahun copyright: [TAHUN]

Kerjakan dengan aturan berikut:

1. Cari seluruh kemunculan brand lama pada source code aktif, termasuk variasi huruf besar
   dan kecil. Abaikan node_modules, .next, dist, build, cache, dan file generated.

2. Ganti semua unsur brand lama pada:
   - Logo, alt text, title, metadata, header, navbar, footer, login, dan dashboard.
   - Email OTP, template email, export Excel, README, dokumentasi, dan account.txt.
   - package.json dan package-lock.json.
   - Cookie name, JWT/session identifier, event name, localStorage key, dan cache key.
   - prisma/seed.ts, prisma.config.ts, lib/db.ts, proxy.ts, dan seluruh konfigurasi database.
   - URL, hostname, IP, port, domain email, dan fallback environment project lama.

3. Gunakan hanya brand baru [NAMA_BRAND]. Jangan sisakan teks, logo, atau identifier brand
   lama pada source/config aktif.

4. Pertahankan seluruh fitur, role, API, layout, alur aplikasi, dan schema database yang
   sudah ada. Jangan menghapus fitur yang tidak berkaitan dengan rebranding.

5. Siapkan environment untuk project yang akan dibagikan:
   - Buat atau perbarui .env.example dengan semua variable yang diperlukan.
   - Jangan memasukkan .env asli ke dalam ZIP.
   - Jangan memasukkan JWT secret asli, password database, API key, token, atau credential.
   - Pastikan .env tercantum di .gitignore.
   - Tambahkan placeholder yang jelas di .env.example.
   - Jika perlu JWT secret, jelaskan bahwa penerima harus membuat secret baru dengan:
       node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

6. Pastikan file/folder berikut tidak ikut dikirim dalam ZIP:
   - node_modules
   - .next
   - dist
   - build
   - .env
   - file credential pribadi
   - log dan cache lokal

7. Pastikan package.json memiliki script berikut:
   - dev
   - build
   - start
   - lint

8. Agar compile tidak error:
   - Jangan melakukan replace buta ke seluruh folder.
   - Edit hanya file source/config yang relevan.
   - Hapus import yang tidak lagi dipakai.
   - Jalankan npx tsc --noEmit setelah perubahan besar.
   - Perbaiki error yang disebabkan oleh rebranding saja.
   - Jangan memperbaiki error lama yang tidak berkaitan tanpa instruksi tambahan.

9. Validasi project sebelum dikirim:
   - npx tsc --noEmit
   - npx prisma validate
   - npx prisma generate
   - Cari ulang brand lama pada source/config aktif.
   - Jalankan git diff --check jika repository memakai Git.

10. Pastikan README atau dokumentasi project berisi langkah setup berikut:
    - npm install
    - Copy-Item .env.example .env
    - Isi konfigurasi .env milik pengguna.
    - npx prisma generate
    - npx prisma db push
    - npx prisma db seed
    - npm run dev

11. Setelah project siap, laporkan:
    - File yang berubah.
    - Hasil pencarian brand lama.
    - Hasil TypeScript.
    - Hasil prisma validate dan prisma generate.
    - Isi file/folder yang harus dikeluarkan dari ZIP.
    - Perintah yang harus dijalankan oleh penerima ZIP.

12. Jangan menjalankan prisma db push --force-reset atau perintah destruktif lain tanpa
    meminta persetujuan eksplisit tepat sebelum menjalankannya.

Jangan membuat commit atau branch baru.
Jangan memasukkan credential rahasia ke dalam project atau ZIP.
```

### Contoh Konfigurasi ZIP

```text
Brand baru: Studify
Nama database MySQL/MariaDB: Studify
DB host: 127.0.0.1
DB port: 3306
DB user: root
DB password:
Domain email akun seed: studify.sch.id
Prefix cookie/session/localStorage/event: studify
Nama package npm: studify
Tahun copyright: 2026
```

### Perintah Penerima ZIP

Setelah menerima dan mengekstrak ZIP, jalankan dari folder project:

```powershell
npm install
Copy-Item .env.example .env
notepad .env
npx prisma generate
npx prisma db push
npx prisma db seed
npm run dev
```

Isi `.env` dengan konfigurasi database dan JWT secret milik penerima. Jangan membagikan
file `.env` yang berisi secret atau credential pribadi.
