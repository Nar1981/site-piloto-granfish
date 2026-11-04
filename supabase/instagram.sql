-- Publicações do Instagram exibidas no site (execute no SQL Editor do Supabase)
create table if not exists public.instagram_posts (
  id bigint generated always as identity primary key,
  url text not null unique
    check (url ~ '^https://www\.instagram\.com/(p|reel|tv)/[A-Za-z0-9_-]+/$'),
  ativo boolean not null default true,
  ordem int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.instagram_config (
  id int primary key default 1 check (id = 1),
  modo text not null default 'manual' check (modo in ('manual', 'automatico')),
  perfil text check (perfil is null or perfil ~ '^[A-Za-z0-9_.]{1,30}$')
);
insert into public.instagram_config (id) values (1) on conflict do nothing;

alter table public.instagram_posts enable row level security;
alter table public.instagram_config enable row level security;

drop policy if exists ig_posts_ler on public.instagram_posts;
create policy ig_posts_ler on public.instagram_posts for select to anon using (ativo);
drop policy if exists ig_posts_ler_equipe on public.instagram_posts;
create policy ig_posts_ler_equipe on public.instagram_posts for select to authenticated
  using (ativo or public.eh_equipe());
drop policy if exists ig_posts_gerir on public.instagram_posts;
create policy ig_posts_gerir on public.instagram_posts for all to authenticated
  using (public.eh_equipe()) with check (public.eh_equipe());

drop policy if exists ig_cfg_ler on public.instagram_config;
create policy ig_cfg_ler on public.instagram_config for select to anon, authenticated using (true);
drop policy if exists ig_cfg_gerir on public.instagram_config;
create policy ig_cfg_gerir on public.instagram_config for update to authenticated
  using (public.eh_equipe()) with check (public.eh_equipe());

revoke all on public.instagram_posts, public.instagram_config from anon, authenticated;
grant select on public.instagram_posts, public.instagram_config to anon, authenticated;
grant insert, update, delete on public.instagram_posts to authenticated;
grant update on public.instagram_config to authenticated;

insert into public.instagram_posts (url, ordem) values
  ('https://www.instagram.com/p/DcmESjDFT3_/', 1),
  ('https://www.instagram.com/p/DYkfULelQAh/', 2),
  ('https://www.instagram.com/p/DcGaIQOlRSb/', 3),
  ('https://www.instagram.com/p/Dbd_u9hFb8e/', 4),
  ('https://www.instagram.com/p/DbL8O6SlZyw/', 5),
  ('https://www.instagram.com/reel/DbEXftxpsiq/', 6),
  ('https://www.instagram.com/p/Dan460NFTzL/', 7),
  ('https://www.instagram.com/p/DaVwi53lZd5/', 8),
  ('https://www.instagram.com/p/DaK_6CWlYk6/', 9),
  ('https://www.instagram.com/p/DZyJJx7D2hs/', 10),
  ('https://www.instagram.com/reel/DXMSBBFh8Fm/', 11)
on conflict (url) do nothing;
