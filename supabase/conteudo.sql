create table if not exists public.site_conteudo (
  chave text primary key check (chave ~ '^[a-z0-9_]{1,40}$'),
  valor text not null check (length(valor) <= 2000),
  atualizado_em timestamptz not null default now()
);
alter table public.site_conteudo enable row level security;
drop policy if exists sc_ler on public.site_conteudo;
create policy sc_ler on public.site_conteudo for select to anon using (true);
drop policy if exists sc_ler_equipe on public.site_conteudo;
create policy sc_ler_equipe on public.site_conteudo for select to authenticated using (true);
drop policy if exists sc_gerir on public.site_conteudo;
create policy sc_gerir on public.site_conteudo for all to authenticated
  using (public.eh_equipe()) with check (public.eh_equipe());
revoke all on public.site_conteudo from anon, authenticated;
grant select on public.site_conteudo to anon, authenticated;
grant insert, update, delete on public.site_conteudo to authenticated;
