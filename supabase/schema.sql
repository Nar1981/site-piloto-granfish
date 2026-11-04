create table if not exists public.cadastros (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  tipo text not null check (tipo in ('Pessoa Física', 'Pessoa Jurídica')),
  finalidades text[] not null default '{}',
  finalidade_outro text,
  nome text not null check (char_length(nome) between 2 and 200),
  documento text not null check (char_length(documento) between 11 and 18),
  email text not null check (char_length(email) between 5 and 200),
  telefone text not null check (char_length(telefone) between 8 and 30),
  dados jsonb not null default '{}'::jsonb check (pg_column_size(dados) < 20000),
  aceite_lgpd boolean not null check (aceite_lgpd),
  status text not null default 'Pendente' check (status in ('Pendente', 'Aprovado', 'Atualização necessária')),
  responsavel text,
  observacoes text
);

create index if not exists cadastros_created_idx on public.cadastros (created_at desc);

alter table public.cadastros enable row level security;

-- Visitantes (chave anon) só podem inserir, sempre como Pendente.
drop policy if exists "visitante envia cadastro" on public.cadastros;
create policy "visitante envia cadastro" on public.cadastros
  for insert to anon
  with check (status = 'Pendente' and responsavel is null and observacoes is null and aceite_lgpd);

-- Somente usuários listados em public.equipe acessam os dados, mesmo que alguém consiga criar uma conta.
create table if not exists public.equipe (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.equipe enable row level security;
revoke all on public.equipe from anon, authenticated;

create or replace function public.eh_equipe() returns boolean
language sql security definer set search_path = public stable
as $$ select exists (select 1 from public.equipe where user_id = auth.uid()) $$;
revoke all on function public.eh_equipe() from public, anon;
grant execute on function public.eh_equipe() to authenticated;

drop policy if exists "equipe le cadastros" on public.cadastros;
create policy "equipe le cadastros" on public.cadastros
  for select to authenticated using (public.eh_equipe());

drop policy if exists "equipe atualiza cadastros" on public.cadastros;
create policy "equipe atualiza cadastros" on public.cadastros
  for update to authenticated using (public.eh_equipe()) with check (public.eh_equipe());

grant insert on public.cadastros to anon;
grant select, update on public.cadastros to authenticated;

-- Depois de criar o usuário em Authentication > Users, autorize-o:
-- insert into public.equipe (user_id) select id from auth.users where email = 'SEU_EMAIL_AQUI';
