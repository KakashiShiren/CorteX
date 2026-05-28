create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.universities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  domain text not null unique,
  short_name text,
  city text,
  state text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint universities_domain_edu check (domain ~* '^[a-z0-9.-]+\.edu$')
);

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text not null,
  university_id uuid references public.universities(id) on delete restrict,
  major text,
  year text,
  residence text,
  bio text,
  profile_picture_url text,
  interests text[] not null default '{}',
  is_verified boolean not null default false,
  is_online boolean not null default false,
  searchable boolean not null default true,
  show_major boolean not null default true,
  show_year boolean not null default true,
  show_residence boolean not null default true,
  show_interests boolean not null default true,
  show_online_status boolean not null default true,
  message_permission text not null default 'connected',
  blocked_users uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint users_email_edu check (email ~* '^[^@]+@[a-z0-9.-]+\.edu$'),
  constraint users_message_permission check (message_permission in ('anyone', 'connected', 'none'))
);

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  email text not null unique,
  name text not null,
  university_id uuid references public.universities(id) on delete restrict,
  major text,
  year text,
  residence text,
  bio text,
  profile_picture_url text,
  interests text[] not null default '{}',
  is_verified boolean not null default false,
  is_online boolean not null default false,
  current_status jsonb,
  search_text tsvector,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint students_email_edu check (email ~* '^[^@]+@[a-z0-9.-]+\.edu$')
);

create table if not exists public.user_status (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  activity text not null,
  emoji text,
  location text,
  custom_text text,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '24 hours'
);

create table if not exists public.connections (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid not null references public.users(id) on delete cascade,
  to_user_id uuid not null references public.users(id) on delete cascade,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  constraint connections_distinct_users check (from_user_id <> to_user_id),
  constraint connections_status check (status in ('pending', 'accepted', 'rejected', 'blocked')),
  unique (from_user_id, to_user_id)
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  university_id uuid not null references public.universities(id) on delete cascade,
  content text not null,
  image_url text,
  post_type text not null default 'general',
  event_date timestamptz,
  event_location text,
  is_anonymous boolean not null default false,
  expires_at timestamptz,
  likes_count integer not null default 0,
  comments_count integer not null default 0,
  rsvp_going_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint posts_type check (post_type in ('general', 'event', 'party', 'trip', 'lostfound', 'rideshare', 'shoutout'))
);

create table if not exists public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.post_reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  reaction text not null default 'like',
  created_at timestamptz not null default now(),
  unique (post_id, user_id, reaction),
  constraint post_reactions_reaction check (reaction in ('like'))
);

create table if not exists public.post_rsvps (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  status text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (post_id, user_id),
  constraint post_rsvps_status check (status in ('going', 'not_interested'))
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  university_id uuid references public.universities(id) on delete cascade,
  participant_ids uuid[] not null,
  last_message text,
  last_message_sender_id uuid references public.users(id) on delete set null,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint conversations_two_participants check (array_length(participant_ids, 1) = 2),
  constraint conversations_distinct_participants check (participant_ids[1] <> participant_ids[2])
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.users(id) on delete cascade,
  receiver_id uuid not null references public.users(id) on delete cascade,
  content text not null,
  is_read boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  constraint messages_distinct_participants check (sender_id <> receiver_id)
);

create table if not exists public.ai_knowledge_base (
  id uuid primary key default gen_random_uuid(),
  university_id uuid references public.universities(id) on delete cascade,
  title text not null,
  content text not null,
  chunk text,
  keywords text[] not null default '{}',
  metadata jsonb not null default '{}',
  source text,
  category text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.campus_buildings (
  id uuid primary key default gen_random_uuid(),
  university_id uuid references public.universities(id) on delete cascade,
  name text not null,
  code text,
  category text,
  latitude numeric(10, 8) not null,
  longitude numeric(11, 8) not null,
  address text,
  phone text,
  email text,
  hours jsonb not null default '{}',
  facilities text[] not null default '{}',
  description text,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.chat_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  university_id uuid references public.universities(id) on delete cascade,
  messages jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.refresh_student_search()
returns trigger
language plpgsql
as $$
begin
  new.search_text :=
    setweight(to_tsvector('english', coalesce(new.name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.major, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(new.year, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(new.residence, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(new.bio, '')), 'D');
  return new;
end;
$$;

create or replace function public.sync_post_counts()
returns trigger
language plpgsql
as $$
begin
  if tg_table_name = 'post_comments' then
    update public.posts
    set comments_count = (select count(*) from public.post_comments where post_id = coalesce(new.post_id, old.post_id)),
        updated_at = now()
    where id = coalesce(new.post_id, old.post_id);
  elsif tg_table_name = 'post_reactions' then
    update public.posts
    set likes_count = (select count(*) from public.post_reactions where post_id = coalesce(new.post_id, old.post_id) and reaction = 'like'),
        updated_at = now()
    where id = coalesce(new.post_id, old.post_id);
  elsif tg_table_name = 'post_rsvps' then
    update public.posts
    set rsvp_going_count = (select count(*) from public.post_rsvps where post_id = coalesce(new.post_id, old.post_id) and status = 'going'),
        updated_at = now()
    where id = coalesce(new.post_id, old.post_id);
  end if;
  return coalesce(new, old);
end;
$$;

create or replace function public.sync_message_preview()
returns trigger
language plpgsql
as $$
begin
  update public.conversations
  set last_message = new.content,
      last_message_sender_id = new.sender_id,
      last_message_at = new.created_at,
      updated_at = now()
  where id = new.conversation_id;
  return new;
end;
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'universities', 'users', 'students', 'posts', 'post_comments',
    'post_rsvps', 'conversations', 'ai_knowledge_base',
    'campus_buildings', 'chat_conversations'
  ]
  loop
    execute format('drop trigger if exists set_%I_updated_at on public.%I', table_name, table_name);
    execute format('create trigger set_%I_updated_at before update on public.%I for each row execute function public.update_updated_at()', table_name, table_name);
  end loop;
end;
$$;

drop trigger if exists refresh_students_search_text on public.students;
create trigger refresh_students_search_text
before insert or update on public.students
for each row execute function public.refresh_student_search();

drop trigger if exists sync_post_comment_count on public.post_comments;
create trigger sync_post_comment_count
after insert or update or delete on public.post_comments
for each row execute function public.sync_post_counts();

drop trigger if exists sync_post_reaction_count on public.post_reactions;
create trigger sync_post_reaction_count
after insert or update or delete on public.post_reactions
for each row execute function public.sync_post_counts();

drop trigger if exists sync_post_rsvp_count on public.post_rsvps;
create trigger sync_post_rsvp_count
after insert or update or delete on public.post_rsvps
for each row execute function public.sync_post_counts();

drop trigger if exists sync_conversation_message_preview on public.messages;
create trigger sync_conversation_message_preview
after insert on public.messages
for each row execute function public.sync_message_preview();

create index if not exists universities_domain_idx on public.universities(domain);
create index if not exists users_university_id_idx on public.users(university_id);
create index if not exists users_email_idx on public.users(email);
create index if not exists users_verified_searchable_idx on public.users(university_id, is_verified, searchable);
create index if not exists students_user_id_idx on public.students(user_id);
create index if not exists students_university_verified_idx on public.students(university_id, is_verified, updated_at desc);
create index if not exists students_name_trgm_idx on public.students using gin (name gin_trgm_ops);
create index if not exists students_search_text_idx on public.students using gin (search_text);
create index if not exists user_status_user_id_idx on public.user_status(user_id);
create index if not exists user_status_visible_expires_idx on public.user_status(is_visible, expires_at desc);
create index if not exists connections_from_user_idx on public.connections(from_user_id);
create index if not exists connections_to_user_idx on public.connections(to_user_id);
create index if not exists connections_status_idx on public.connections(status);
create index if not exists posts_university_feed_idx on public.posts(university_id, created_at desc) where expires_at is null;
create index if not exists posts_university_active_idx on public.posts(university_id, post_type, created_at desc);
create index if not exists posts_expires_at_idx on public.posts(expires_at);
create index if not exists post_comments_post_created_idx on public.post_comments(post_id, created_at desc);
create index if not exists post_comments_user_idx on public.post_comments(user_id);
create index if not exists post_reactions_post_idx on public.post_reactions(post_id);
create index if not exists post_reactions_user_idx on public.post_reactions(user_id);
create index if not exists post_rsvps_post_idx on public.post_rsvps(post_id);
create index if not exists post_rsvps_user_idx on public.post_rsvps(user_id);
create index if not exists conversations_university_idx on public.conversations(university_id);
create index if not exists conversations_participant_ids_idx on public.conversations using gin (participant_ids);
create index if not exists conversations_last_message_at_idx on public.conversations(last_message_at desc);
create index if not exists messages_conversation_created_idx on public.messages(conversation_id, created_at desc);
create index if not exists messages_sender_idx on public.messages(sender_id);
create index if not exists messages_receiver_unread_idx on public.messages(receiver_id, is_read, created_at desc);
create index if not exists ai_knowledge_university_idx on public.ai_knowledge_base(university_id);
create index if not exists ai_knowledge_keywords_idx on public.ai_knowledge_base using gin (keywords);
create index if not exists campus_buildings_university_idx on public.campus_buildings(university_id);
create index if not exists campus_buildings_name_trgm_idx on public.campus_buildings using gin (name gin_trgm_ops);

alter table public.universities enable row level security;
alter table public.users enable row level security;
alter table public.students enable row level security;
alter table public.user_status enable row level security;
alter table public.connections enable row level security;
alter table public.posts enable row level security;
alter table public.post_comments enable row level security;
alter table public.post_reactions enable row level security;
alter table public.post_rsvps enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.ai_knowledge_base enable row level security;
alter table public.campus_buildings enable row level security;
alter table public.chat_conversations enable row level security;

grant usage on schema public to anon, authenticated;
grant select on public.universities, public.campus_buildings to anon, authenticated;
grant select on public.users, public.students, public.user_status, public.posts, public.post_comments, public.post_reactions, public.post_rsvps, public.conversations, public.messages, public.ai_knowledge_base to anon, authenticated;
grant insert, update, delete on public.users, public.students, public.user_status, public.connections, public.posts, public.post_comments, public.post_reactions, public.post_rsvps, public.conversations, public.messages, public.chat_conversations to authenticated;

drop policy if exists universities_read_active on public.universities;
create policy universities_read_active on public.universities
for select using (is_active = true);

drop policy if exists users_read_verified on public.users;
create policy users_read_verified on public.users
for select using (is_verified = true);

drop policy if exists users_manage_own on public.users;
create policy users_manage_own on public.users
for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists students_read_verified on public.students;
create policy students_read_verified on public.students
for select using (is_verified = true);

drop policy if exists students_manage_own on public.students;
create policy students_manage_own on public.students
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists status_read_visible on public.user_status;
create policy status_read_visible on public.user_status
for select using (is_visible = true and expires_at > now());

drop policy if exists status_manage_own on public.user_status;
create policy status_manage_own on public.user_status
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists connections_manage_participants on public.connections;
create policy connections_manage_participants on public.connections
for all using (auth.uid() = from_user_id or auth.uid() = to_user_id)
with check (auth.uid() = from_user_id or auth.uid() = to_user_id);

drop policy if exists posts_read_active on public.posts;
create policy posts_read_active on public.posts
for select using (expires_at is null or expires_at > now());

drop policy if exists posts_manage_own on public.posts;
create policy posts_manage_own on public.posts
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists comments_read on public.post_comments;
create policy comments_read on public.post_comments
for select using (true);

drop policy if exists comments_manage_own on public.post_comments;
create policy comments_manage_own on public.post_comments
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists reactions_read on public.post_reactions;
create policy reactions_read on public.post_reactions
for select using (true);

drop policy if exists reactions_manage_own on public.post_reactions;
create policy reactions_manage_own on public.post_reactions
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists rsvps_read on public.post_rsvps;
create policy rsvps_read on public.post_rsvps
for select using (true);

drop policy if exists rsvps_manage_own on public.post_rsvps;
create policy rsvps_manage_own on public.post_rsvps
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists conversations_manage_participants on public.conversations;
create policy conversations_manage_participants on public.conversations
for all using (auth.uid() = any(participant_ids))
with check (auth.uid() = any(participant_ids));

drop policy if exists messages_manage_participants on public.messages;
create policy messages_manage_participants on public.messages
for all using (auth.uid() = sender_id or auth.uid() = receiver_id)
with check (auth.uid() = sender_id or auth.uid() = receiver_id);

drop policy if exists ai_knowledge_read on public.ai_knowledge_base;
create policy ai_knowledge_read on public.ai_knowledge_base
for select using (true);

drop policy if exists campus_buildings_read on public.campus_buildings;
create policy campus_buildings_read on public.campus_buildings
for select using (true);

drop policy if exists chat_manage_own on public.chat_conversations;
create policy chat_manage_own on public.chat_conversations
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

insert into public.universities (name, short_name, domain, city, state, is_active)
values
  ('Clark University', 'Clark', 'clarku.edu', 'Worcester', 'MA', true),
  ('Northeastern University', 'Northeastern', 'northeastern.edu', 'Boston', 'MA', true),
  ('Boston University', 'BU', 'bu.edu', 'Boston', 'MA', true),
  ('Worcester Polytechnic Institute', 'WPI', 'wpi.edu', 'Worcester', 'MA', true)
on conflict (domain) do update
set name = excluded.name,
    short_name = excluded.short_name,
    city = excluded.city,
    state = excluded.state,
    is_active = excluded.is_active,
    updated_at = now();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', false, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('posts', 'posts', false, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('events', 'events', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

alter publication supabase_realtime add table public.posts;
alter publication supabase_realtime add table public.post_comments;
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.user_status;
