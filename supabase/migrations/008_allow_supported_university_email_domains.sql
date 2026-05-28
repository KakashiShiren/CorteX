alter table users
drop constraint if exists email_domain;

alter table users
add constraint email_domain
check (
  lower(email) like '%@clarku.edu'
  or lower(email) like '%@northeastern.edu'
  or lower(email) like '%@wpi.edu'
  or lower(email) like '%@bu.edu'
  or lower(email) in (
    'cortextest1@gmail.com',
    'cortextest2@gmail.com',
    'cortextest3@gmail.com',
    'cortextest4@gmail.com',
    'cortextest5@gmail.com'
  )
) not valid;

insert into universities (name, domain, is_active)
values
  ('Clark University', 'clarku.edu', true),
  ('Northeastern University', 'northeastern.edu', true),
  ('Worcester Polytechnic Institute', 'wpi.edu', true),
  ('Boston University', 'bu.edu', true)
on conflict (domain) do update
set
  name = excluded.name,
  is_active = true,
  updated_at = now();
