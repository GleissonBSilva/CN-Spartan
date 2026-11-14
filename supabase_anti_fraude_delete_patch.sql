-- ==============================================================================
-- CINE SPARTAN - SCRIPT ATUALIZAÇÃO ANTI-FRAUDE & EXCLUSÃO DEFINITIVA NO SUPABASE
-- Execute este script no SQL Editor do Supabase (https://supabase.com/dashboard)
-- Objetivo:
-- 1. Excluir clientes deletados de public.profiles e auth.users para economizar cota no plano gratuito
-- 2. Salvar permanentemente o e-mail e WhatsApp em used_trials (Anti-Fraude)
-- 3. Garantir que clientes excluídos ou que já usaram teste fiquem com status 'vencido' ao se recadastrarem
-- 4. Garantir que clientes bloqueados/suspensos continuem suspensos até o admin liberar
-- ==============================================================================

-- 1. Garantir tabela de Anti-Fraude (used_trials)
create table if not exists public.used_trials (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  whatsapp text,
  claimed_at timestamptz not null default now(),
  trial_days int not null default 3,
  notes text default 'Teste grátis utilizado'
);

create index if not exists idx_used_trials_email on public.used_trials(lower(email));
create index if not exists idx_used_trials_whatsapp on public.used_trials(whatsapp);

alter table public.used_trials enable row level security;

-- Garante que novos perfis criados no Supabase recebam apenas os dias de teste grátis (3 dias) e não 30 dias de plano antes do pagamento
alter table public.profiles alter column expires_at set default (now() + interval '3 days');
alter table public.profiles alter column is_trial set default true;

-- Permissões de Leitura e Inserção para checagem de teste grátis no app
drop policy if exists "Leitura publica anti fraude used_trials" on public.used_trials;
create policy "Leitura publica anti fraude used_trials"
  on public.used_trials for select
  using (true);

drop policy if exists "Insercao anti fraude used_trials" on public.used_trials;
create policy "Insercao anti fraude used_trials"
  on public.used_trials for insert
  with check (true);

drop policy if exists "Admin pode gerenciar used_trials" on public.used_trials;
create policy "Admin pode gerenciar used_trials"
  on public.used_trials for all
  using (true)
  with check (true);

-- 2. Função de Verificação Anti-Fraude
create or replace function public.check_trial_used(check_email text, check_phone text default '')
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  clean_p text;
  is_used boolean := false;
begin
  clean_p := regexp_replace(coalesce(check_phone, ''), '\D', '', 'g');
  
  select exists (
    select 1 from public.used_trials
    where lower(email) = lower(trim(coalesce(check_email, '')))
       or (clean_p <> '' and clean_p is not null and regexp_replace(coalesce(whatsapp, ''), '\D', '', 'g') = clean_p)
  ) into is_used;

  return is_used;
end;
$$;

grant execute on function public.check_trial_used(text, text) to anon, authenticated, service_role;

-- 3. Função de Exclusão Definitiva de Usuários pelo Administrador
-- Exclui de auth.users e public.profiles, mas grava permanentemente no Anti-Fraude (used_trials)
create or replace function public.delete_user_by_admin(target_user_id uuid default null, target_email text default null)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_email text;
  v_phone text;
  v_user_id uuid := target_user_id;
  v_deleted_count int := 0;
begin
  -- Identifica o e-mail e whatsapp do usuário
  if v_user_id is not null then
    select lower(email), regexp_replace(coalesce(whatsapp, ''), '\D', '', 'g')
    into v_email, v_phone
    from public.profiles
    where id = v_user_id;
    
    if v_email is null then
      select lower(email), regexp_replace(coalesce(raw_user_meta_data->>'whatsapp', ''), '\D', '', 'g')
      into v_email, v_phone
      from auth.users
      where id = v_user_id;
    end if;
  elsif target_email is not null and trim(target_email) <> '' then
    v_email := lower(trim(target_email));
    
    select id, regexp_replace(coalesce(whatsapp, ''), '\D', '', 'g')
    into v_user_id, v_phone
    from public.profiles
    where lower(email) = v_email
    limit 1;
    
    if v_user_id is null then
      select id, regexp_replace(coalesce(raw_user_meta_data->>'whatsapp', ''), '\D', '', 'g')
      into v_user_id, v_phone
      from auth.users
      where lower(email) = v_email
      limit 1;
    end if;
  end if;

  -- 1. Salva permanentemente no Anti-Fraude (se não for o Master Admin)
  if v_email is not null and v_email <> 'gleisson1984@gmail.com' then
    insert into public.used_trials (email, whatsapp, trial_days, notes)
    values (
      v_email,
      nullif(v_phone, ''),
      3,
      'Cliente excluído pelo Administrador - Anti-Fraude Permanente'
    )
    on conflict do nothing;
  end if;

  -- 2. Exclui da tabela public.profiles
  if v_user_id is not null then
    delete from public.profiles where id = v_user_id;
  end if;
  if v_email is not null and v_email <> 'gleisson1984@gmail.com' then
    delete from public.profiles where lower(email) = v_email;
  end if;

  -- 3. Exclui da tabela auth.users (Supabase Authentication Engine - libera cota do plano gratuito)
  if v_user_id is not null and (v_email is null or v_email <> 'gleisson1984@gmail.com') then
    delete from auth.users where id = v_user_id;
    get diagnostics v_deleted_count = row_count;
  end if;
  if (v_deleted_count = 0 or v_user_id is null) and v_email is not null and v_email <> 'gleisson1984@gmail.com' then
    delete from auth.users where lower(email) = v_email;
    get diagnostics v_deleted_count = row_count;
  end if;

  return jsonb_build_object(
    'success', true,
    'email', v_email,
    'deleted_user_id', v_user_id,
    'deleted_auth_rows', v_deleted_count
  );
end;
$$;

-- Sobrecargas para compatibilidade máxima com chamadas do frontend
create or replace function public.delete_user_by_admin(target_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  return public.delete_user_by_admin(target_user_id, null);
end;
$$;

create or replace function public.delete_user_by_email_admin(target_email text)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  return public.delete_user_by_admin(null, target_email);
end;
$$;

grant execute on function public.delete_user_by_admin(uuid, text) to anon, authenticated, service_role;
grant execute on function public.delete_user_by_admin(uuid) to anon, authenticated, service_role;
grant execute on function public.delete_user_by_email_admin(text) to anon, authenticated, service_role;

-- 3.1 Função RPC para Atualização de Status pelo Administrador sem bloqueio de RLS
-- Garante que 'suspenso', 'ativo' ou 'vencido' seja gravado imediatamente no Supabase
create or replace function public.update_profile_status_admin(target_user_id uuid, new_status text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if new_status not in ('ativo', 'suspenso', 'vencido') then
    raise exception 'Status inválido. Deve ser ativo, suspenso ou vencido.';
  end if;

  update public.profiles
  set 
    status = new_status,
    admin_updated_at = now()
  where id = target_user_id;

  return jsonb_build_object(
    'success', true,
    'user_id', target_user_id,
    'status', new_status
  );
end;
$$;

grant execute on function public.update_profile_status_admin(uuid, text) to anon, authenticated, service_role;

-- 4. Atualizar o Trigger de Novos Usuários para Bloquear Teste Grátis de Contas Excluídas ou já Utilizadas
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  user_role text;
  already_used_trial boolean := false;
  clean_phone text;
  customer_name text;
  chosen_plan text;
  chosen_screens int := 1;
  initial_status text;
  initial_expiry timestamptz;
  initial_plan text;
  is_trial_flag boolean;
  trial_used_flag boolean;
  cfg_trial_days int := 3;
  cfg_trial_enabled boolean := true;
begin
  customer_name := coalesce(
    nullif(new.raw_user_meta_data->>'full_name', ''),
    nullif(new.raw_user_meta_data->>'display_name', ''),
    ''
  );
  chosen_plan := coalesce(nullif(new.raw_user_meta_data->>'plan_name', ''), 'SPARTAN PRO');
  begin
    chosen_screens := greatest(1, coalesce((new.raw_user_meta_data->>'max_screens')::int, 1));
  exception when others then
    chosen_screens := 1;
  end;

  -- Se for o administrador principal (Master Admin)
  if lower(new.email) = 'gleisson1984@gmail.com' then
    user_role := 'admin';
    initial_status := 'ativo';
    initial_expiry := now() + interval '365 days';
    initial_plan := 'Master Admin';
    chosen_screens := 5;
    is_trial_flag := false;
    trial_used_flag := false;
  else
    user_role := 'client';
    clean_phone := regexp_replace(coalesce(new.raw_user_meta_data->>'whatsapp', ''), '\D', '', 'g');

    -- 1. Tenta carregar regra de teste grátis configurada pelo Admin em system_settings
    begin
      select 
        coalesce((value->>'trial_days')::int, 3),
        coalesce((value->>'enabled')::boolean, true)
      into cfg_trial_days, cfg_trial_enabled
      from public.system_settings
      where key = 'trial_config';
    exception when others then
      cfg_trial_days := 3;
      cfg_trial_enabled := true;
    end;

    -- 2. Se o payload de cadastro enviou dias específicos no user_metadata
    if (new.raw_user_meta_data->>'trial_days') is not null then
      cfg_trial_days := greatest(0, (new.raw_user_meta_data->>'trial_days')::int);
      if cfg_trial_days = 0 then
        cfg_trial_enabled := false;
      end if;
    end if;

    -- 3. Anti-Fraude: Verifica se este e-mail ou WhatsApp já utilizou teste grátis ou foi excluído
    select exists (
      select 1 from public.used_trials
      where lower(email) = lower(new.email)
         or (clean_phone <> '' and clean_phone is not null and regexp_replace(coalesce(whatsapp, ''), '\D', '', 'g') = clean_phone)
    ) into already_used_trial;

    if already_used_trial then
      -- Já usou o teste grátis ou foi excluído anteriormente! Cria a conta bloqueada (vencida)
      initial_status := 'vencido';
      initial_expiry := now();
      initial_plan := chosen_plan;
      is_trial_flag := false;
      trial_used_flag := true;
    elsif not cfg_trial_enabled or cfg_trial_days <= 0 then
      initial_status := 'vencido';
      initial_expiry := now();
      initial_plan := chosen_plan;
      is_trial_flag := false;
      trial_used_flag := false;
    else
      -- Novo cliente legítimo
      initial_status := 'ativo';
      initial_expiry := now() + (cfg_trial_days || ' days')::interval;
      initial_plan := chosen_plan;
      is_trial_flag := true;
      trial_used_flag := true;

      -- Registra de forma permanente na tabela anti-fraude
      insert into public.used_trials (email, whatsapp, trial_days, notes)
      values (lower(new.email), clean_phone, cfg_trial_days, 'Concedido no primeiro cadastro (' || chosen_plan || ')');
    end if;
  end if;

  insert into public.profiles (
    id,
    email,
    full_name,
    whatsapp,
    role,
    status,
    plan_name,
    is_trial,
    trial_used,
    expires_at,
    max_screens,
    created_at
  ) values (
    new.id,
    new.email,
    customer_name,
    coalesce(new.raw_user_meta_data->>'whatsapp', ''),
    user_role,
    initial_status,
    initial_plan,
    is_trial_flag,
    trial_used_flag,
    initial_expiry,
    chosen_screens,
    now()
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(nullif(excluded.full_name, ''), public.profiles.full_name),
    whatsapp = coalesce(nullif(excluded.whatsapp, ''), public.profiles.whatsapp),
    plan_name = coalesce(nullif(excluded.plan_name, ''), public.profiles.plan_name),
    max_screens = coalesce(excluded.max_screens, public.profiles.max_screens),
    status = case
      when public.profiles.status = 'suspenso' then 'suspenso' -- Mantém suspenso!
      else excluded.status
    end,
    role = case 
      when lower(excluded.email) = 'gleisson1984@gmail.com' then 'admin'
      else public.profiles.role
    end;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
