-- Catálogo de embarcações público (execute depois de schema.sql).
-- Só a equipe liga/desliga; cada mudança fica registrada com quem fez e quando.
create table if not exists public.catalogo_publico_config (
  id int primary key default 1 check (id = 1),
  ativo boolean not null default false,
  alterado_por text,
  alterado_em timestamptz
);
insert into public.catalogo_publico_config (id) values (1) on conflict do nothing;

create table if not exists public.catalogo_publico_log (
  id bigint generated always as identity primary key,
  acao text not null check (acao in ('liberado', 'bloqueado')),
  por text not null,
  user_id uuid,
  em timestamptz not null default now()
);

alter table public.catalogo_publico_config enable row level security;
alter table public.catalogo_publico_log enable row level security;

drop policy if exists cat_pub_cfg_ler on public.catalogo_publico_config;
create policy cat_pub_cfg_ler on public.catalogo_publico_config for select to authenticated using (public.eh_equipe());
drop policy if exists cat_pub_log_ler on public.catalogo_publico_log;
create policy cat_pub_log_ler on public.catalogo_publico_log for select to authenticated using (public.eh_equipe());

revoke all on public.catalogo_publico_config, public.catalogo_publico_log from anon, authenticated;
grant select on public.catalogo_publico_config, public.catalogo_publico_log to authenticated;

-- Visitantes só descobrem se o catálogo está liberado (nada sobre quem liberou).
create or replace function public.catalogo_publico_status()
returns boolean language sql security definer set search_path = public stable
as $$ select coalesce((select ativo from public.catalogo_publico_config where id = 1), false) $$;

create or replace function public.definir_catalogo_publico(p_ativo boolean)
returns void language plpgsql security definer set search_path = public, auth
as $fn$
declare v_por text := coalesce(auth.jwt() ->> 'email', 'desconhecido');
begin
  if not public.eh_equipe() then raise exception 'acesso negado'; end if;
  update public.catalogo_publico_config
    set ativo = p_ativo, alterado_por = v_por, alterado_em = now() where id = 1;
  insert into public.catalogo_publico_log (acao, por, user_id)
    values (case when p_ativo then 'liberado' else 'bloqueado' end, v_por, auth.uid());
end
$fn$;

revoke all on function public.catalogo_publico_status() from public;
revoke all on function public.definir_catalogo_publico(boolean) from public;
grant execute on function public.catalogo_publico_status() to anon, authenticated;
grant execute on function public.definir_catalogo_publico(boolean) to authenticated;
