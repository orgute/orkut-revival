-- ── INVITES TABLE ────────────────────────────────────────────
create table if not exists invites (
  id          uuid primary key default uuid_generate_v4(),
  code        text unique not null,
  created_by  uuid references profiles(id) on delete cascade,
  used_by     uuid references profiles(id) on delete set null,
  used_at     timestamptz,
  created_at  timestamptz default now()
);

alter table invites enable row level security;

create policy "Users can see own invites"
  on invites for select using (auth.uid() = created_by or auth.uid() = used_by);

create policy "Anyone can check a code (anon too)"
  on invites for select using (true);

create policy "System inserts invites"
  on invites for insert with check (true);

create policy "System updates invites"
  on invites for update using (true);

-- ── AUTO-GENERATE 10 INVITES ON SIGNUP ───────────────────────
create or replace function generate_invites_for_user(user_id uuid)
returns void language plpgsql security definer as $$
declare
  i int;
  code text;
begin
  for i in 1..10 loop
    -- 8-char alphanumeric code
    code := upper(substring(md5(random()::text || user_id::text || i::text) from 1 for 8));
    insert into invites (code, created_by) values (code, user_id)
    on conflict (code) do nothing;
  end loop;
end;
$$;

-- ── TRIGGER: generate invites when profile is created ────────
create or replace function handle_new_profile()
returns trigger language plpgsql security definer as $$
begin
  perform generate_invites_for_user(new.id);
  return new;
end;
$$;

drop trigger if exists on_profile_created on profiles;
create trigger on_profile_created
  after insert on profiles
  for each row execute procedure handle_new_profile();

-- ── SEED: give the admin user 10 invites right now ───────────
-- Run this after creating your account:
-- select generate_invites_for_user((select id from profiles limit 1));
