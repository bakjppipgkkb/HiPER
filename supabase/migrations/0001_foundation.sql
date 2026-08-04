begin;

create extension if not exists pgcrypto;

create type public.user_role as enum ('STUDENT', 'ADMIN');
create type public.publish_status as enum ('DRAFT', 'PUBLISHED', 'ARCHIVED');
create type public.tabung_type as enum ('COLLECTION', 'DISTRIBUTION');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  student_id text unique,
  role public.user_role not null default 'STUDENT',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.site_settings (
  id smallint primary key default 1 check (id = 1),
  site_name jsonb not null default '{"bm":"Hab Perbendaharaan Digital","en":"Digital Treasury Hub"}'::jsonb,
  tagline jsonb not null default '{"bm":"Pengurusan kewangan yang cekap, telus dan berintegriti.","en":"Efficient, transparent and accountable financial management."}'::jsonb,
  official_email text,
  address_lines jsonb not null default '[]'::jsonb,
  logo_path text,
  donation_qr_path text,
  donation_bank_name text,
  donation_account_name text,
  donation_account_number text,
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now()
);

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title_bm text not null check (length(trim(title_bm)) > 0),
  title_en text not null check (length(trim(title_en)) > 0),
  body_bm text not null check (length(trim(body_bm)) > 0),
  body_en text not null check (length(trim(body_en)) > 0),
  category text not null,
  poster_path text,
  status public.publish_status not null default 'DRAFT',
  published_at timestamptz,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((status = 'PUBLISHED' and published_at is not null) or status <> 'PUBLISHED')
);

create table public.tabung_records (
  id uuid primary key default gen_random_uuid(),
  type public.tabung_type not null,
  amount_sen bigint not null check (amount_sen > 0),
  description_bm text not null,
  description_en text not null,
  recipient text,
  occurred_on date not null,
  public_visible boolean not null default false,
  source text not null default 'HIPER_STUDIO',
  submitted_by uuid references public.profiles(id),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (type = 'COLLECTION' or recipient is not null)
);

create table public.organisation_units (
  id uuid primary key default gen_random_uuid(),
  name_bm text not null,
  name_en text not null,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organisation_officers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text,
  photo_path text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organisation_assignments (
  id uuid primary key default gen_random_uuid(),
  officer_id uuid not null references public.organisation_officers(id) on delete cascade,
  unit_id uuid references public.organisation_units(id) on delete set null,
  position_bm text not null,
  position_en text not null,
  level integer not null default 0 check (level >= 0),
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (officer_id, position_bm, unit_id)
);

create table public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id),
  action text not null,
  entity_type text not null,
  entity_id text,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    coalesce(new.email, new.id::text || '@invalid.local'),
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name')
  );
  return new;
end;
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'ADMIN' and is_active = true
  );
$$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger site_settings_updated_at before update on public.site_settings for each row execute function public.set_updated_at();
create trigger announcements_updated_at before update on public.announcements for each row execute function public.set_updated_at();
create trigger tabung_records_updated_at before update on public.tabung_records for each row execute function public.set_updated_at();
create trigger organisation_units_updated_at before update on public.organisation_units for each row execute function public.set_updated_at();
create trigger organisation_officers_updated_at before update on public.organisation_officers for each row execute function public.set_updated_at();
create trigger organisation_assignments_updated_at before update on public.organisation_assignments for each row execute function public.set_updated_at();

insert into public.site_settings (id) values (1) on conflict (id) do nothing;

alter table public.profiles enable row level security;
alter table public.site_settings enable row level security;
alter table public.announcements enable row level security;
alter table public.tabung_records enable row level security;
alter table public.organisation_units enable row level security;
alter table public.organisation_officers enable row level security;
alter table public.organisation_assignments enable row level security;
alter table public.audit_log enable row level security;

create policy "users read own profile" on public.profiles for select to authenticated using (id = auth.uid());
create policy "admins manage profiles" on public.profiles for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "public reads settings" on public.site_settings for select to anon, authenticated using (true);
create policy "admins update settings" on public.site_settings for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "public reads published announcements" on public.announcements for select to anon, authenticated using (status = 'PUBLISHED');
create policy "admins manage announcements" on public.announcements for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "public reads visible tabung" on public.tabung_records for select to anon, authenticated using (public_visible = true);
create policy "students read own tabung submissions" on public.tabung_records for select to authenticated using (submitted_by = auth.uid());
create policy "students create own collection submission" on public.tabung_records for insert to authenticated with check (
  submitted_by = auth.uid() and type = 'COLLECTION' and source = 'PUBLIC_PORTAL' and amount_sen > 0 and public_visible = false
);
create policy "admins manage tabung" on public.tabung_records for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "public reads active units" on public.organisation_units for select to anon, authenticated using (is_active = true);
create policy "admins manage units" on public.organisation_units for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "public reads active officers" on public.organisation_officers for select to anon, authenticated using (is_active = true);
create policy "admins manage officers" on public.organisation_officers for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "public reads active assignments" on public.organisation_assignments for select to anon, authenticated using (is_active = true);
create policy "admins manage assignments" on public.organisation_assignments for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "admins read audit log" on public.audit_log for select to authenticated using (public.is_admin());
create policy "authenticated insert own audit entry" on public.audit_log for insert to authenticated with check (actor_id = auth.uid());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('announcement-posters', 'announcement-posters', true, 10485760, array['image/png','image/jpeg'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('organisation-photos', 'organisation-photos', true, 5242880, array['image/png','image/jpeg','image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "public reads announcement posters" on storage.objects for select to anon, authenticated using (bucket_id = 'announcement-posters');
create policy "admins insert announcement posters" on storage.objects for insert to authenticated with check (bucket_id = 'announcement-posters' and public.is_admin());
create policy "admins update announcement posters" on storage.objects for update to authenticated using (bucket_id = 'announcement-posters' and public.is_admin()) with check (bucket_id = 'announcement-posters' and public.is_admin());
create policy "admins delete announcement posters" on storage.objects for delete to authenticated using (bucket_id = 'announcement-posters' and public.is_admin());

create policy "public reads organisation photos" on storage.objects for select to anon, authenticated using (bucket_id = 'organisation-photos');
create policy "admins insert organisation photos" on storage.objects for insert to authenticated with check (bucket_id = 'organisation-photos' and public.is_admin());
create policy "admins update organisation photos" on storage.objects for update to authenticated using (bucket_id = 'organisation-photos' and public.is_admin()) with check (bucket_id = 'organisation-photos' and public.is_admin());
create policy "admins delete organisation photos" on storage.objects for delete to authenticated using (bucket_id = 'organisation-photos' and public.is_admin());

commit;
