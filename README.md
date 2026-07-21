# Kedai Sepijak

Platform digital untuk manajemen kedai kopi — mulai dari tampilan menu, sistem feedback pelanggan, polling event, sampai dashboard admin untuk pengelolaan operasional sehari-hari.

Project ini dibangun sebagai fullstack app dengan frontend Vue.js dan backend Node.js/Express, terhubung ke database MySQL.

---

## Fitur Utama

### Sisi Pelanggan (Public)
- **Halaman utama** — landing page dengan informasi kedai
- **Menu digital** — browsing menu berdasarkan kategori
- **Feedback** — pelanggan bisa memberikan rating dan komentar terhadap pelayanan
- **Polling** — voting untuk event atau menu baru yang diinginkan

### Sisi Admin (Dashboard)
- **Login admin** — autentikasi dengan JWT
- **Dashboard overview** — statistik feedback, rating rata-rata, performa waiters
- **Manajemen waiters** — CRUD data pelayan (active/inactive)
- **Manajemen feedback** — filter berdasarkan rating, kategori, tanggal
- **Manajemen polling** — buat polling baru, lihat hasil voting, toggle status
- **Export data** — generate laporan ke PDF

---

## Tech Stack

| Layer | Teknologi |
|---|---|
| Frontend | Vue.js 3, Vue Router, Pinia |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| HTTP Client | Axios |
| Chart | Chart.js + vue-chartjs |
| PDF Export | jsPDF + jspdf-autotable |
| Animation | AOS (Animate On Scroll) |
| Backend | Node.js, Express.js |
| Database | MySQL (mysql2) |
| Auth | JWT (jsonwebtoken), bcrypt |
| Security | Helmet, CORS, express-validator |
| Dev Tools | Nodemon, PostCSS, Autoprefixer |

---

## Struktur Project

```
├── Kedai_Sepijak/                 # Frontend + Server Routes
│   ├── src/
│   │   ├── components/            # Komponen UI (Header, Menu, Feedback, dll)
│   │   ├── views/                 # Halaman (Home, Feedback, Polling, Admin)
│   │   ├── stores/                # Pinia state management
│   │   ├── services/              # API service layer
│   │   ├── composables/           # Vue composables
│   │   ├── middleware/            # Auth & security middleware
│   │   ├── router/                # Vue Router config
│   │   ├── utils/                 # Utility functions
│   │   └── assets/                # CSS & static assets
│   ├── server/                    # Server-side API routes
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── config/
│   ├── public/
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── Kedai_Sepijak_Backend/         # Backend API
│   ├── src/
│   │   ├── controllers/           # Business logic (menu, feedback, polling, dll)
│   │   ├── routes/                # API route definitions
│   │   ├── middleware/            # JWT auth middleware
│   │   └── config/                # Database config
│   ├── database/
│   │   └── seed-admin.js          # Script buat admin default
│   ├── server.js
│   └── package.json
```

---

## Instalasi & Setup

### Prasyarat
- Node.js v16+
- MySQL Server
- npm atau yarn

### 1. Clone repository

```bash
git clone https://github.com/Yopa28/sepijak_kedai.git
cd sepijak_kedai
```

### 2. Setup Database

Buat database MySQL:

```sql
CREATE DATABASE kedai_sepijak CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. Setup Backend

```bash
cd Kedai_Sepijak_Backend
npm install
cp .env.example .env
```

Edit file `.env` — sesuaikan `DB_PASSWORD`, `JWT_SECRET`, dan konfigurasi lainnya.

Jalankan seeder untuk membuat admin default:

```bash
node database/seed-admin.js
```

Start backend:

```bash
npm run dev
```

Backend jalan di `http://localhost:5000`.

### 4. Setup Frontend

```bash
cd Kedai_Sepijak
npm install
cp .env.example .env
```

Edit `.env` — pastikan `VITE_API_BASE_URL` mengarah ke backend (`http://localhost:5000/api`).

Start frontend:

```bash
npm run dev
```

Frontend jalan di `http://localhost:5173`.

---

## API Endpoints

| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/menu` | Daftar menu |
| `GET` | `/api/menu/by-category` | Menu per kategori |
| `GET` | `/api/waiters` | Daftar waiters |
| `GET` | `/api/feedback` | Daftar feedback |
| `POST` | `/api/feedback` | Submit feedback baru |
| `GET` | `/api/polling` | Daftar polling aktif |
| `POST` | `/api/polling/vote` | Submit vote |
| `POST` | `/api/auth/login` | Login admin |
| `GET` | `/api/dashboard/stats` | Statistik dashboard |

---

## Catatan

- File `.env.example` sudah disediakan sebagai template konfigurasi.
- Jangan lupa ganti `JWT_SECRET` dan `DB_PASSWORD` untuk environment production.
- Admin default: `admin` / `admin123` — segera ganti setelah login pertama.

---

