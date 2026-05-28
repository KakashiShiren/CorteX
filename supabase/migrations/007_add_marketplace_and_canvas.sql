create table if not exists marketplace_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  university_id uuid references universities(id),
  title varchar(255) not null,
  description text,
  category varchar(50) not null,
  condition varchar(20),
  price decimal(10, 2) not null,
  image_urls text[] default '{}',
  is_available boolean default true,
  is_featured boolean default false,
  featured_until timestamp,
  shipping_available boolean default false,
  local_pickup boolean default true,
  status varchar(20) default 'active',
  contact_preference varchar(20) default 'direct_message',
  contact_phone varchar(30),
  allows_negotiation boolean default false,
  specifications jsonb default '{}'::jsonb,
  views_count integer default 0,
  saves_count integer default 0,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

create index if not exists idx_marketplace_items_university_id on marketplace_items(university_id);
create index if not exists idx_marketplace_items_category on marketplace_items(category);
create index if not exists idx_marketplace_items_user_id on marketplace_items(user_id);
create index if not exists idx_marketplace_items_is_available on marketplace_items(is_available);
create index if not exists idx_marketplace_items_status on marketplace_items(status);
create index if not exists idx_marketplace_items_created_at on marketplace_items(created_at desc);

create table if not exists marketplace_orders (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references marketplace_items(id),
  buyer_id uuid not null references users(id),
  seller_id uuid not null references users(id),
  price_paid decimal(10, 2) not null,
  platform_fee decimal(10, 2) not null,
  seller_earnings decimal(10, 2) not null,
  status varchar(20) default 'pending',
  stripe_payment_intent_id varchar(255),
  delivery_method varchar(20),
  created_at timestamp default now(),
  completed_at timestamp
);

create index if not exists idx_marketplace_orders_buyer_id on marketplace_orders(buyer_id);
create index if not exists idx_marketplace_orders_seller_id on marketplace_orders(seller_id);
create index if not exists idx_marketplace_orders_status on marketplace_orders(status);
create index if not exists idx_marketplace_orders_item_id on marketplace_orders(item_id);
create unique index if not exists idx_marketplace_orders_payment_intent
  on marketplace_orders(stripe_payment_intent_id)
  where stripe_payment_intent_id is not null;

create table if not exists marketplace_reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references marketplace_orders(id),
  reviewer_id uuid not null references users(id),
  reviewee_id uuid not null references users(id),
  rating integer check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamp default now()
);

create index if not exists idx_marketplace_reviews_reviewee_id on marketplace_reviews(reviewee_id);
create index if not exists idx_marketplace_reviews_order_id on marketplace_reviews(order_id);

create table if not exists marketplace_saves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  item_id uuid not null references marketplace_items(id) on delete cascade,
  created_at timestamp default now(),
  unique(user_id, item_id)
);

create index if not exists idx_marketplace_saves_user_id on marketplace_saves(user_id);
create index if not exists idx_marketplace_saves_item_id on marketplace_saves(item_id);

create table if not exists canvas_integrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  canvas_user_id varchar(255),
  canvas_access_token varchar(500),
  canvas_refresh_token varchar(500),
  token_expires_at timestamp,
  university_id uuid references universities(id),
  canvas_base_url varchar(255),
  last_synced_at timestamp,
  is_active boolean default true,
  created_at timestamp default now(),
  updated_at timestamp default now(),
  unique(user_id)
);

create index if not exists idx_canvas_integrations_user_id on canvas_integrations(user_id);
create index if not exists idx_canvas_integrations_university_id on canvas_integrations(university_id);

create table if not exists canvas_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  canvas_assignment_id varchar(255),
  canvas_course_id varchar(255),
  course_name varchar(255),
  assignment_name varchar(255),
  description text,
  due_date timestamp,
  submitted boolean default false,
  canvas_url varchar(500),
  locally_done boolean default false,
  created_at timestamp default now(),
  updated_at timestamp default now(),
  unique(user_id, canvas_assignment_id)
);

create index if not exists idx_canvas_assignments_user_id on canvas_assignments(user_id);
create index if not exists idx_canvas_assignments_due_date on canvas_assignments(due_date);
create index if not exists idx_canvas_assignments_course_id on canvas_assignments(canvas_course_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('marketplace', 'marketplace', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop trigger if exists trigger_marketplace_items_updated_at on marketplace_items;
create trigger trigger_marketplace_items_updated_at
before update on marketplace_items
for each row execute function update_timestamp();

drop trigger if exists trigger_canvas_integrations_updated_at on canvas_integrations;
create trigger trigger_canvas_integrations_updated_at
before update on canvas_integrations
for each row execute function update_timestamp();

drop trigger if exists trigger_canvas_assignments_updated_at on canvas_assignments;
create trigger trigger_canvas_assignments_updated_at
before update on canvas_assignments
for each row execute function update_timestamp();

alter table marketplace_items enable row level security;
alter table marketplace_orders enable row level security;
alter table marketplace_reviews enable row level security;
alter table marketplace_saves enable row level security;
alter table canvas_integrations enable row level security;
alter table canvas_assignments enable row level security;

drop policy if exists "Users can read items from their university" on marketplace_items;
create policy "Users can read items from their university"
  on marketplace_items for select
  using (
    university_id = (select university_id from users where id = auth.uid())
    or auth.uid() = user_id
  );

drop policy if exists "Users can create marketplace items" on marketplace_items;
create policy "Users can create marketplace items"
  on marketplace_items for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own items" on marketplace_items;
create policy "Users can update own items"
  on marketplace_items for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own items" on marketplace_items;
create policy "Users can delete own items"
  on marketplace_items for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can read own orders" on marketplace_orders;
create policy "Users can read own orders"
  on marketplace_orders for select
  using (
    auth.uid() = buyer_id or auth.uid() = seller_id
  );

drop policy if exists "System can create orders" on marketplace_orders;
create policy "System can create orders"
  on marketplace_orders for insert
  with check (true);

drop policy if exists "Users can update own orders" on marketplace_orders;
create policy "Users can update own orders"
  on marketplace_orders for update
  using (auth.uid() = buyer_id or auth.uid() = seller_id);

drop policy if exists "Users can read all reviews" on marketplace_reviews;
create policy "Users can read all reviews"
  on marketplace_reviews for select using (true);

drop policy if exists "Users can create reviews" on marketplace_reviews;
create policy "Users can create reviews"
  on marketplace_reviews for insert
  with check (auth.uid() = reviewer_id);

drop policy if exists "Users can manage own saves" on marketplace_saves;
create policy "Users can manage own saves"
  on marketplace_saves for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can manage own canvas integration" on canvas_integrations;
create policy "Users can manage own canvas integration"
  on canvas_integrations for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can read own canvas assignments" on canvas_assignments;
create policy "Users can read own canvas assignments"
  on canvas_assignments for select
  using (auth.uid() = user_id);

drop policy if exists "Users can update own local assignment state" on canvas_assignments;
create policy "Users can update own local assignment state"
  on canvas_assignments for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
