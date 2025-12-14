-- Create crew table
create table if not exists crew (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects(id) on delete cascade not null,
  name text not null,
  role text,
  department text,
  rate numeric,
  email text,
  phone text,
  avatar text,
  created_at timestamptz default now()
);

-- Enable RLS for crew
alter table crew enable row level security;

-- Create policy for crew
create policy "Enable all access for authenticated users" on crew
  for all using (auth.role() = 'authenticated');


-- Create time_cards table
create table if not exists time_cards (
  id uuid default gen_random_uuid() primary key,
  shoot_day_id uuid references shoot_days(id) on delete cascade not null,
  crew_member_id uuid references crew(id) on delete set null,
  role text,
  department text,
  rate numeric,
  in_time text,
  out_time text,
  meal1_in text,
  meal1_out text,
  meal2_in text,
  meal2_out text,
  mp_count integer default 0,
  ndb boolean default false,
  grace boolean default false,
  ot_override boolean default false,
  created_at timestamptz default now()
);

-- Enable RLS for time_cards
alter table time_cards enable row level security;

create policy "Enable all access for authenticated users" on time_cards
  for all using (auth.role() = 'authenticated');
