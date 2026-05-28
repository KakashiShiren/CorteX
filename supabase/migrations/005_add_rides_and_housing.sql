create table if not exists ride_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  university_id uuid references universities(id),
  post_type varchar(20) not null,
  departure_location varchar(255),
  destination varchar(255),
  departure_time timestamp,
  seats_available integer,
  cost_per_seat decimal(10, 2),
  flexible_timing boolean default false,
  description text,
  image_url varchar(500),
  is_recurring boolean default false,
  recurring_days varchar(50),
  status varchar(20) default 'active',
  expires_at timestamp,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

create index if not exists idx_ride_posts_university_id on ride_posts(university_id);
create index if not exists idx_ride_posts_post_type on ride_posts(post_type);
create index if not exists idx_ride_posts_departure_time on ride_posts(departure_time);
create index if not exists idx_ride_posts_created_at on ride_posts(created_at desc);

create table if not exists ride_matches (
  id uuid primary key default gen_random_uuid(),
  ride_post_id uuid not null references ride_posts(id) on delete cascade,
  passenger_id uuid not null references users(id) on delete cascade,
  status varchar(20) default 'pending',
  seats_requested integer default 1,
  message text,
  created_at timestamp default now()
);

create index if not exists idx_ride_matches_ride_post_id on ride_matches(ride_post_id);
create index if not exists idx_ride_matches_passenger_id on ride_matches(passenger_id);
create index if not exists idx_ride_matches_status on ride_matches(status);

create table if not exists housing_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  university_id uuid references universities(id),
  title varchar(255) not null,
  description text,
  location varchar(255) not null,
  latitude decimal(10, 8),
  longitude decimal(11, 8),
  price_per_month decimal(10, 2) not null,
  bedrooms integer,
  bathrooms decimal(3, 1),
  square_feet integer,
  amenities text[],
  available_from date,
  lease_length varchar(50),
  contact_email varchar(255),
  contact_phone varchar(20),
  images_url text[],
  status varchar(20) default 'active',
  created_at timestamp default now(),
  updated_at timestamp default now()
);

create index if not exists idx_housing_posts_university_id on housing_posts(university_id);
create index if not exists idx_housing_posts_location on housing_posts(location);
create index if not exists idx_housing_posts_price on housing_posts(price_per_month);
create index if not exists idx_housing_posts_available_from on housing_posts(available_from);
create index if not exists idx_housing_posts_created_at on housing_posts(created_at desc);

create table if not exists housing_inquiries (
  id uuid primary key default gen_random_uuid(),
  housing_post_id uuid not null references housing_posts(id) on delete cascade,
  student_id uuid not null references users(id) on delete cascade,
  message text,
  created_at timestamp default now()
);

create index if not exists idx_housing_inquiries_housing_post_id on housing_inquiries(housing_post_id);
create index if not exists idx_housing_inquiries_student_id on housing_inquiries(student_id);

create table if not exists housing_comments (
  id uuid primary key default gen_random_uuid(),
  housing_post_id uuid not null references housing_posts(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  content text not null,
  created_at timestamp default now()
);

create index if not exists idx_housing_comments_housing_post_id on housing_comments(housing_post_id);
create index if not exists idx_housing_comments_user_id on housing_comments(user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('rides', 'rides', true, 5242880, array['image/jpeg', 'image/png']),
  ('housing', 'housing', true, 5242880, array['image/jpeg', 'image/png'])
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table ride_posts enable row level security;
alter table ride_matches enable row level security;
alter table housing_posts enable row level security;
alter table housing_inquiries enable row level security;
alter table housing_comments enable row level security;

drop policy if exists "Users can read posts from their university" on ride_posts;
create policy "Users can read posts from their university"
  on ride_posts for select
  using (
    university_id = (select university_id from users where id = auth.uid())
    or auth.uid() = user_id
  );

drop policy if exists "Users can create ride posts" on ride_posts;
create policy "Users can create ride posts"
  on ride_posts for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own ride posts" on ride_posts;
create policy "Users can update own ride posts"
  on ride_posts for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own ride posts" on ride_posts;
create policy "Users can delete own ride posts"
  on ride_posts for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can read ride matches on their posts" on ride_matches;
create policy "Users can read ride matches on their posts"
  on ride_matches for select
  using (
    ride_post_id in (
      select id from ride_posts where user_id = auth.uid()
    )
    or passenger_id = auth.uid()
  );

drop policy if exists "Users can create ride matches" on ride_matches;
create policy "Users can create ride matches"
  on ride_matches for insert
  with check (auth.uid() = passenger_id);

drop policy if exists "Users can read housing from their university" on housing_posts;
create policy "Users can read housing from their university"
  on housing_posts for select
  using (
    university_id = (select university_id from users where id = auth.uid())
    or auth.uid() = user_id
  );

drop policy if exists "Users can create housing posts" on housing_posts;
create policy "Users can create housing posts"
  on housing_posts for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own housing posts" on housing_posts;
create policy "Users can update own housing posts"
  on housing_posts for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own housing posts" on housing_posts;
create policy "Users can delete own housing posts"
  on housing_posts for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can read housing inquiries on their posts" on housing_inquiries;
create policy "Users can read housing inquiries on their posts"
  on housing_inquiries for select
  using (
    housing_post_id in (
      select id from housing_posts where user_id = auth.uid()
    )
    or student_id = auth.uid()
  );

drop policy if exists "Users can create housing inquiries" on housing_inquiries;
create policy "Users can create housing inquiries"
  on housing_inquiries for insert
  with check (auth.uid() = student_id);

drop policy if exists "Users can read housing comments" on housing_comments;
create policy "Users can read housing comments"
  on housing_comments for select using (true);

drop policy if exists "Users can create housing comments" on housing_comments;
create policy "Users can create housing comments"
  on housing_comments for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own housing comments" on housing_comments;
create policy "Users can delete own housing comments"
  on housing_comments for delete
  using (auth.uid() = user_id);
