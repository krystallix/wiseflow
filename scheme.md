# WiseFlow — Supabase SQL Schema

> Personal productivity app — single user per account.
> Auth is handled by Supabase Auth (`auth.uid()`), no custom profiles or workspaces needed.
> Update this file every time a new database-related feature is added.

---

## Setup

```sql
-- Create custom schema (run once)
create schema if not exists risenwise;
```

---

## Tables

### `projects`
Personal projects to group tasks under (e.g. "Design Engineering", "Travel").

```sql
create table risenwise.projects (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  description text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
```

---

### `tasks`
Core task entity. Belongs to a project (optional).

```sql
create type task_status   as enum ('todo', 'in_progress', 'done', 'cancel');
create type task_priority as enum ('Low', 'Medium', 'High');

create table risenwise.tasks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  project_id  uuid references risenwise.projects(id) on delete set null,
  title       text not null,
  description text,
  category    text,                          -- e.g. 'Back-End', 'Front-End', 'UI/UX Design'
  tag_id      text,                          -- e.g. 'D-149'
  status      task_status default 'todo',
  priority    task_priority default 'Medium',
  progress    int default 0 check (progress >= 0 and progress <= 100),
  cover_url   text,                          -- optional cover image (Supabase Storage URL)
  due_date    date,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
```

---

### `task_subtasks`
Sub-tasks under a parent task. Supports ordering and completion status.

```sql
create table risenwise.task_subtasks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  task_id     uuid not null references risenwise.tasks(id) on delete cascade,
  title       text not null,
  is_done     boolean default false,
  sort_order  int default 0,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
```

---

### `task_comments`
Personal notes / comments on a task.

```sql
create table risenwise.task_comments (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  task_id     uuid not null references risenwise.tasks(id) on delete cascade,
  content     text not null,
  created_at  timestamptz default now()
);
```

---

### `task_attachments`
File attachments on a task (stored in Supabase Storage).

```sql
create table risenwise.task_attachments (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  task_id     uuid not null references risenwise.tasks(id) on delete cascade,
  file_name   text not null,
  file_url    text not null,   -- Supabase Storage public URL
  file_size   int,             -- bytes
  created_at  timestamptz default now()
);
```

---

### `notifications`
In-app notifications for the user.

```sql
create type notification_type as enum ('info', 'update', 'mention', 'system');

create table risenwise.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  type        notification_type default 'info',
  title       text not null,
  body        text,
  is_read     boolean default false,
  is_pinned   boolean default false,
  created_at  timestamptz default now()
);
```

---

## Row Level Security (RLS)

Enable RLS on all tables — users can only access their own data.

```sql
alter table risenwise.projects          enable row level security;
alter table risenwise.tasks             enable row level security;
alter table risenwise.task_subtasks     enable row level security;
alter table risenwise.task_comments     enable row level security;
alter table risenwise.task_attachments  enable row level security;
alter table risenwise.notifications     enable row level security;
```

### Policies

```sql
-- Projects
create policy "Owner only" on risenwise.projects
  for all using (auth.uid() = user_id);

-- Tasks
create policy "Owner only" on risenwise.tasks
  for all using (auth.uid() = user_id);

-- Subtasks
create policy "Owner only" on risenwise.task_subtasks
  for all using (auth.uid() = user_id);

-- Task Comments
create policy "Owner only" on risenwise.task_comments
  for all using (auth.uid() = user_id);

-- Task Attachments
create policy "Owner only" on risenwise.task_attachments
  for all using (auth.uid() = user_id);

-- Notifications
create policy "Owner only" on risenwise.notifications
  for all using (auth.uid() = user_id);
```

---

## Storage Buckets

```sql
-- Task cover images and file attachments
insert into storage.buckets (id, name, public)
values ('task-attachments', 'task-attachments', false);
```

---

## Changelog

| Date       | Change |
|------------|--------|
| 2026-02-25 | Initial schema: projects, tasks, task_comments, task_attachments, notifications |
| 2026-02-25 | Simplified to single-user — removed profiles, workspaces, workspace_members, task_assignees |
| 2026-02-25 | Added task_subtasks table with ordering and completion status |
| 2026-02-26 | Renamed schema from `public` to `risenwise` |