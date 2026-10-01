# Studify

## 1. Pengertian Studify

Studify adalah Learning Management System (LMS) berbasis web yang dirancang untuk mendukung kegiatan pembelajaran di sekolah secara digital. Platform ini menjadi tempat terpusat bagi admin, kepala sekolah, bagian kurikulum, guru, dan siswa untuk mengelola proses belajar mengajar.

Studify membantu sekolah menggantikan proses pembelajaran yang masih manual menjadi lebih terstruktur, terintegrasi, efisien, dan mudah dipantau. Seluruh aktivitas akademik dapat dikelola dalam satu sistem, mulai dari pengaturan pengguna dan kelas hingga penyampaian materi, pelaksanaan asesmen, pengumpulan tugas, penilaian, dan pemantauan perkembangan akademik.

## 2. Fitur dan Pengguna Studify

Studify menyediakan fitur utama berikut:

- Login dan autentikasi berdasarkan peran pengguna.
- Dashboard khusus untuk admin, kepala sekolah, bagian kurikulum, guru, dan siswa.
- Pengelolaan kelas serta anggota kelas.
- Penyampaian pengumuman sekolah dan pengumuman kelas.
- Pengunggahan dan pembagian materi pembelajaran.
- Pembuatan, pembagian, dan pengumpulan tugas.
- Pembuatan asesmen, soal, dan jawaban siswa.
- Pemeriksaan jawaban serta pemberian nilai.
- Pemantauan performa akademik siswa, kelas, mata pelajaran, dan sekolah.
- Ekspor data nilai untuk kebutuhan administrasi.

Setiap pengguna memiliki fungsi yang disesuaikan dengan kebutuhannya. Admin mengelola akun, kelas, dan data sistem. Kepala sekolah serta bagian kurikulum dapat memantau kegiatan dan performa akademik. Guru mengelola kelas, materi, tugas, dan asesmen, kemudian memeriksa hasil pekerjaan siswa. Siswa mengakses materi, mengumpulkan tugas, mengikuti asesmen, dan melihat perkembangan akademiknya.

## 3. Manfaat Studify bagi Sekolah, Guru, dan Siswa

### Bagi sekolah

Studify membantu sekolah mengintegrasikan administrasi dan kegiatan pembelajaran ke dalam satu platform. Data menjadi lebih terpusat, proses pemantauan lebih mudah, dan informasi akademik dapat diakses secara lebih cepat serta teratur.

### Bagi guru

Guru dapat mengelola materi, tugas, pengumuman, dan asesmen tanpa bergantung pada proses manual yang terpisah. Pengumpulan pekerjaan, pemeriksaan jawaban, pemberian nilai, dan pemantauan aktivitas siswa menjadi lebih efisien.

### Bagi siswa

Siswa dapat mengakses pembelajaran dari satu tempat, memperoleh materi dan pengumuman kelas, mengumpulkan tugas, mengikuti asesmen, serta melihat hasil dan perkembangan akademiknya secara lebih jelas.

A modern classroom and academic management app built with Next.js.

## Fitur Utama

- Autentikasi dan role-based access untuk Admin, Kepsek, Kurikulum, Guru, dan Siswa.
- Dashboard berbeda sesuai kebutuhan setiap role.
- Kelas, pengumuman, materi, tugas, asesmen, soal, dan jawaban siswa.
- Penilaian, detail submission read-only untuk role pengawas, dan ekspor nilai.
- Grafik performa akademik sekolah, kelas, dan mata pelajaran.

## Arsitektur

Frontend dan API berada dalam satu repository dan satu aplikasi Next.js:

```text
app/                 Halaman frontend dan route UI
app/api/             API Route Handlers backend
components/          Komponen UI yang dapat dipakai ulang
lib/                 Auth, database, RBAC, format, dan helper
prisma/              Schema, migration, dan seed database
public/              Asset frontend
```

Untuk kondisi project sekarang, satu repository lebih sederhana karena frontend dan API berbagi session, RBAC, Prisma Client, tipe data, dan komponen. Pisahkan menjadi repository frontend/backend hanya jika API akan dipakai client lain, memiliki siklus deployment berbeda, atau dikerjakan tim terpisah.

## Prasyarat

- Node.js 20 atau lebih baru
- npm
- MySQL atau MariaDB

## Instalasi

```bash
git clone <URL_REPOSITORY>
cd Studify
npm install
copy .env.example .env
```

Pada PowerShell, perintah `copy` di atas dapat digunakan. Isi nilai database dan secret di `.env` sebelum menjalankan aplikasi.

## Environment Variables

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=Studify
JWT_SECRET=ganti-dengan-secret-random
RESEND_API_KEY=
```

Jangan commit `.env`, `account.txt`, password, API key, atau file upload pengguna.

## Database

Pastikan database pada `.env` sudah tersedia, kemudian jalankan:

```bash
npx prisma migrate deploy
npx prisma generate
npx prisma db seed
```

Untuk pengembangan schema lokal, gunakan `npx prisma migrate dev`.

## Menjalankan Aplikasi

Mode development:

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) dengan browser Anda.

Validasi dan production build:

```bash
npm run lint
npm run build
npm start
```

Project ini menggunakan `next/font` untuk otomatis optimize dan load Geist.

## Push ke GitHub

Project ini cukup memakai satu repository:

```bash
git init
git add .
git status
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<username>/<repository>.git
git push -u origin main
```

Sebelum `git add .`, pastikan `account.txt`, `.env`, dan upload lokal tidak muncul pada `git status`.

## Dokumentasi Penting

- [Next.js App Router](https://nextjs.org/docs/app)
- [Next.js Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Prisma ORM](https://www.prisma.io/docs)
- [Prisma Migrate](https://www.prisma.io/docs/orm/prisma-migrate)
- [GitHub Documentation](https://docs.github.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)
- [Next.js GitHub repository](https://github.com/vercel/next.js)

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new).

For deployment details, see the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying).

## Lisensi

Belum ditentukan.
