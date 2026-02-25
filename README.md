# WiseFlow

**WiseFlow** is a task management and productivity application built with Next.js. Designed to help teams stay organized, active, and focused.

## Features

- 📋 **Kanban View** — Manage tasks with drag & drop across columns (To Do, On Progress, Done, Cancel)
- 📊 **List View** — Full table view with priority, category, status, and progress details
- 🗂️ **Workspace & Folders** — Organize documents and tasks within a structured workspace
- 🌗 **Dark Mode** — Light and dark theme support
- ⚡ **Smooth Animations** — Interactive UI with animated tabs and elegant transitions

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org) (App Router)
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **Drag & Drop**: @dnd-kit
- **Animations**: Motion (Framer Motion)
- **Database**: Supabase
- **Icons**: Lucide React

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
app/
├── dashboard/
│   ├── task/         # Task page (Kanban & List view)
│   └── layout.tsx
components/
├── dash/             # KanbanView, ListView
├── animate-ui/       # Animated components (tabs, etc.)
└── ui/               # shadcn/ui components
lib/                  # Utilities & dummy data
hooks/                # Custom React hooks
```

## Deploy

Deploy to [Vercel](https://vercel.com) in one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/krystallix/wiseflow)
