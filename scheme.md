# WiseFlow — Supabase SQL Schema

> This file documents the database schema for the WiseFlow project.
> Update this file every time a new database-related feature is added.

---

## Tables

### `profiles`
Extends Supabase's built-in `auth.users`. Stores public user data.

```sql
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text,
  avatar_url  text,
  email       text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Auto-create profile on sign up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

---

### `workspaces`
Each user can have multiple workspaces (like teams/organizations).

```sql
create table public.workspaces (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  owner_id    uuid references public.profiles(id) on delete cascade,
  plan        text default 'free', -- 'free' | 'startup' | 'enterprise'
  created_at  timestamptz default now()
);
```

---

### `workspace_members`
Many-to-many: users can be members of multiple workspaces.

```sql
create table public.workspace_members (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid references public.workspaces(id) on delete cascade,
  user_id       uuid references public.profiles(id) on delete cascade,
  role          text default 'member', -- 'owner' | 'admin' | 'member'
  joined_at     timestamptz default now(),
  unique (workspace_id, user_id)
);
```

---

### `projects`
Projects live inside a workspace (e.g. "Design Engineering", "Sales & Marketing").

```sql
create table public.projects (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid references public.workspaces(id) on delete cascade,
  name          text not null,
  description   text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
```

---

### `tasks`
Core task entity. Belongs to a project and workspace.

```sql
create type task_status   as enum ('todo', 'in_progress', 'done', 'cancel');
create type task_priority as enum ('Low', 'Medium', 'High');

create table public.tasks (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid references public.workspaces(id) on delete cascade,
  project_id    uuid references public.projects(id) on delete set null,
  title         text not null,
  description   text,
  category      text,                          -- e.g. 'Back-End', 'Front-End', 'UI/UX Design'
  tag_id        text,                          -- e.g. 'D-149'
  status        task_status default 'todo',
  priority      task_priority default 'Medium',
  progress      int default 0 check (progress >= 0 and progress <= 100),
  cover_url     text,                          -- optional task cover image
  due_date      date,
  created_by    uuid references public.profiles(id) on delete set null,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
```

---

### `task_assignees`
Many-to-many: multiple users can be assigned to a task.

```sql
create table public.task_assignees (
  task_id   uuid references public.tasks(id) on delete cascade,
  user_id   uuid references public.profiles(id) on delete cascade,
  primary key (task_id, user_id)
);
```

---

### `task_comments`
Comments on a task.

```sql
create table public.task_comments (
  id          uuid primary key default gen_random_uuid(),
  task_id     uuid references public.tasks(id) on delete cascade,
  user_id     uuid references public.profiles(id) on delete set null,
  content     text not null,
  created_at  timestamptz default now()
);
```

---

### `task_attachments`
File attachments on a task (stored in Supabase Storage).

```sql
create table public.task_attachments (
  id          uuid primary key default gen_random_uuid(),
  task_id     uuid references public.tasks(id) on delete cascade,
  user_id     uuid references public.profiles(id) on delete set null,
  file_name   text not null,
  file_url    text not null,   -- Supabase Storage public URL
  file_size   int,             -- bytes
  created_at  timestamptz default now()
);
```

---

### `notifications`
In-app notifications for users.

```sql
create type notification_type as enum ('info', 'update', 'mention', 'system');

create table public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.profiles(id) on delete cascade,
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

Enable RLS on all tables:

```sql
alter table public.profiles          enable row level security;
alter table public.workspaces        enable row level security;
alter table public.workspace_members enable row level security;
alter table public.projects          enable row level security;
alter table public.tasks             enable row level security;
alter table public.task_assignees    enable row level security;
alter table public.task_comments     enable row level security;
alter table public.task_attachments  enable row level security;
alter table public.notifications     enable row level security;
```

### Example RLS Policies

```sql
-- Profiles: users can only read/update their own profile
create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Tasks: only workspace members can see tasks
create policy "Workspace members can view tasks"
  on public.tasks for select using (
    exists (
      select 1 from public.workspace_members
      where workspace_id = tasks.workspace_id
        and user_id = auth.uid()
    )
  );

-- Notifications: users can only see their own
create policy "Users can view own notifications"
  on public.notifications for select using (auth.uid() = user_id);
```

---

## Storage Buckets

```sql
-- Task cover images and attachments
insert into storage.buckets (id, name, public)
values ('task-attachments', 'task-attachments', true);

-- User avatars
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true);
```

---

## Changelog

| Date | Change |
|------|--------|
| 2026-02-25 | Initial schema: profiles, workspaces, workspace_members, projects, tasks, task_assignees, task_comments, task_attachments, notifications |