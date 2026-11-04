-- Gestão de administradores (execute depois de schema.sql). Todas as funções exigem que quem chama já seja da equipe.
create or replace function public.listar_admins()
returns table (id uuid, email text, created_at timestamptz, last_sign_in_at timestamptz)
language plpgsql security definer set search_path = public, auth, extensions
as $fn$
begin
  if not public.eh_equipe() then raise exception 'acesso negado'; end if;
  return query
    select u.id, u.email::text, u.created_at, u.last_sign_in_at
    from public.equipe e join auth.users u on u.id = e.user_id
    order by u.created_at;
end
$fn$;

create or replace function public.criar_admin(p_email text, p_senha text)
returns uuid
language plpgsql security definer set search_path = public, auth, extensions
as $fn$
declare
  uid uuid := gen_random_uuid();
  em text := lower(trim(p_email));
begin
  if not public.eh_equipe() then raise exception 'acesso negado'; end if;
  if em !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'e-mail inválido'; end if;
  if length(p_senha) < 12 or p_senha !~ '[a-z]' or p_senha !~ '[A-Z]' or p_senha !~ '[0-9]' then
    raise exception 'senha fraca: use 12+ caracteres com maiúscula, minúscula e número';
  end if;
  if exists (select 1 from auth.users where lower(email) = em) then raise exception 'e-mail já cadastrado'; end if;

  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change, email_change_token_new)
  values ('00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated', em,
    crypt(p_senha, gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '');
  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), uid, uid::text,
    jsonb_build_object('sub', uid::text, 'email', em, 'email_verified', true), 'email', now(), now(), now());
  insert into public.equipe (user_id) values (uid);
  return uid;
end
$fn$;

create or replace function public.remover_admin(p_id uuid)
returns void
language plpgsql security definer set search_path = public, auth, extensions
as $fn$
begin
  if not public.eh_equipe() then raise exception 'acesso negado'; end if;
  if p_id = auth.uid() then raise exception 'você não pode remover o próprio acesso'; end if;
  delete from auth.users where id = p_id and id in (select user_id from public.equipe);
end
$fn$;

revoke all on function public.listar_admins() from public, anon;
revoke all on function public.criar_admin(text, text) from public, anon;
revoke all on function public.remover_admin(uuid) from public, anon;
grant execute on function public.listar_admins() to authenticated;
grant execute on function public.criar_admin(text, text) to authenticated;
grant execute on function public.remover_admin(uuid) to authenticated;
