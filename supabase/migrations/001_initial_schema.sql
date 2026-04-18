create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email varchar(255) unique not null,
  name varchar(255) not null,
  major varchar(255),
  year varchar(50),
  residence varchar(255),
  bio text,
  profile_picture_url varchar(255),
  interests text[] default '{}',
  is_verified boolean default false,
  is_online boolean default false,
  searchable boolean default true,
  show_major boolean default true,
  show_year boolean default true,
  show_residence boolean default true,
  show_interests boolean default true,
  show_online_status boolean default true,
  message_permission varchar(50) default 'connected',
  blocked_users uuid[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint email_domain check (email like '%@clarku.edu')
);

create table if not exists user_status (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  activity varchar(50) not null,
  emoji varchar(10),
  location varchar(255),
  custom_text varchar(255),
  is_visible boolean default true,
  created_at timestamptz default now(),
  expires_at timestamptz default now() + interval '24 hours',
  unique(user_id)
);

create table if not exists students (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  email varchar(255) unique not null,
  name varchar(255) not null,
  major varchar(255),
  year varchar(50),
  residence varchar(255),
  bio text,
  profile_picture_url varchar(255),
  interests text[] default '{}',
  is_verified boolean default false,
  is_online boolean default false,
  current_status jsonb,
  search_text tsvector,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id)
);

create table if not exists connections (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid not null references users(id) on delete cascade,
  to_user_id uuid not null references users(id) on delete cascade,
  status varchar(50) default 'pending',
  created_at timestamptz default now(),
  responded_at timestamptz,
  constraint different_users check (from_user_id <> to_user_id),
  unique(from_user_id, to_user_id)
);

create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  participant_ids uuid[] not null,
  last_message text,
  last_message_sender_id uuid,
  last_message_at timestamptz default now(),
  created_at timestamptz default now(),
  check (array_length(participant_ids, 1) = 2)
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id uuid not null references users(id) on delete cascade,
  receiver_id uuid not null references users(id) on delete cascade,
  content text not null,
  is_read boolean default false,
  read_at timestamptz,
  created_at timestamptz default now(),
  constraint different_participants check (sender_id <> receiver_id)
);

create table if not exists chat_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  messages jsonb not null default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists campus_buildings (
  id uuid primary key default gen_random_uuid(),
  name varchar(255) not null,
  code varchar(50),
  category varchar(50),
  latitude decimal(10, 8) not null,
  longitude decimal(11, 8) not null,
  address varchar(255),
  phone varchar(20),
  email varchar(255),
  hours jsonb not null,
  facilities text[] default '{}',
  description text,
  image_url varchar(255),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists ai_knowledge_base (
  id uuid primary key default gen_random_uuid(),
  title varchar(255) not null,
  content text not null,
  keywords text[] not null default '{}',
  source varchar(255),
  category varchar(50),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_users_email on users(email);
create index if not exists idx_users_searchable on users(searchable, is_verified);
create index if not exists idx_users_major on users(major) where is_verified = true;
create index if not exists idx_user_status_user_id on user_status(user_id);
create index if not exists idx_user_status_expires_at on user_status(expires_at);
create index if not exists idx_students_name on students using gin (name gin_trgm_ops);
create index if not exists idx_students_search on students using gin (search_text);
create index if not exists idx_connections_status on connections(status);
create index if not exists idx_conversations_participants on conversations using gin (participant_ids);
create index if not exists idx_messages_conversation_id on messages(conversation_id);
create index if not exists idx_messages_created_at on messages(created_at desc);
create index if not exists idx_chat_conversations_user_id on chat_conversations(user_id);
create index if not exists idx_buildings_category on campus_buildings(category);
create index if not exists idx_buildings_name on campus_buildings using gin (name gin_trgm_ops);
create index if not exists idx_knowledge_base_keywords on ai_knowledge_base using gin (keywords);

create or replace function update_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace function refresh_student_search()
returns trigger as $$
begin
  new.search_text :=
    setweight(to_tsvector('english', coalesce(new.name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.major, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(new.year, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(new.residence, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(new.bio, '')), 'D');
  return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_users_updated_at on users;
create trigger trigger_users_updated_at
before update on users
for each row execute function update_timestamp();

drop trigger if exists trigger_students_updated_at on students;
create trigger trigger_students_updated_at
before update on students
for each row execute function update_timestamp();

drop trigger if exists trigger_buildings_updated_at on campus_buildings;
create trigger trigger_buildings_updated_at
before update on campus_buildings
for each row execute function update_timestamp();

drop trigger if exists trigger_knowledge_updated_at on ai_knowledge_base;
create trigger trigger_knowledge_updated_at
before update on ai_knowledge_base
for each row execute function update_timestamp();

drop trigger if exists trigger_students_search on students;
create trigger trigger_students_search
before insert or update on students
for each row execute function refresh_student_search();

alter table users enable row level security;
alter table user_status enable row level security;
alter table students enable row level security;
alter table connections enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table chat_conversations enable row level security;

create policy "users_manage_own_profile" on users
for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "users_read_verified_profiles" on users
for select using (is_verified = true);

create policy "students_read_verified" on students
for select using (is_verified = true);

create policy "status_read_visible" on user_status
for select using (is_visible = true);

create policy "status_manage_own" on user_status
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "connections_manage_participants" on connections
for all using (auth.uid() = from_user_id or auth.uid() = to_user_id)
with check (auth.uid() = from_user_id or auth.uid() = to_user_id);

create policy "conversations_manage_participants" on conversations
for all using (auth.uid() = any(participant_ids))
with check (auth.uid() = any(participant_ids));

create policy "messages_manage_participants" on messages
for all using (auth.uid() = sender_id or auth.uid() = receiver_id)
with check (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "chat_manage_own" on chat_conversations
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
