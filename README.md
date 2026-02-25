# WiseFlow

**WiseFlow** adalah aplikasi manajemen tugas dan produktivitas yang dibangun dengan Next.js. Dirancang untuk membantu tim tetap terorganisir, aktif, dan fokus.

## Fitur

- 📋 **Kanban View** — Kelola tugas dengan drag & drop antar kolom (To Do, On Progress, Done, Cancel)
- 📊 **List View** — Tampilan tabel lengkap dengan informasi prioritas, kategori, status, dan progress
- 🗂️ **Workspace & Folder** — Organisasi dokumen dan tugas dalam workspace yang terstruktur
- 🌗 **Dark Mode** — Mendukung tema terang dan gelap
- ⚡ **Animasi Halus** — UI interaktif dengan animated tabs dan transisi yang elegan

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org) (App Router)
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **Drag & Drop**: @dnd-kit
- **Animasi**: Motion (Framer Motion)
- **Database**: Supabase
- **Icons**: Lucide React

## Memulai

Install dependencies:

```bash
npm install
```

Jalankan development server:

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

## Struktur Folder

```
app/
├── dashboard/
│   ├── task/         # Halaman task (Kanban & List view)
│   └── layout.tsx
components/
├── dash/             # KanbanView, ListView
├── animate-ui/       # Animated components (tabs, dll)
└── ui/               # shadcn/ui components
lib/                  # Utilities & dummy data
hooks/                # Custom React hooks
```

## Deploy

Deploy ke [Vercel](https://vercel.com) dengan satu klik:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/krystallix/wiseflow)
