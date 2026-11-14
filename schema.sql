-- ==============================================================================
-- CINE SPARTAN - SUPABASE DATABASE SCHEMA
-- Perfis, Controle de Assinaturas, RLS e Triggers Automáticos
-- ==============================================================================

-- 1. Criação da Tabela de Perfis ('profiles')
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  whatsapp text,
  role text not null default 'client' check (role in ('admin', 'client')),
  status text not null default 'ativo' check (status in ('ativo', 'suspenso', 'vencido')),
  plan_name text not null default 'SPARTAN PRO',
  expires_at timestamptz not null default (now() + interval '3 days'),
  max_screens int not null default 1 check (max_screens >= 1),
  created_at timestamptz not null default now()
);

-- Garantir adição das colunas na tabela profiles caso ela já exista
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists whatsapp text;
alter table public.profiles add column if not exists is_trial boolean default true;
alter table public.profiles add column if not exists trial_used boolean default false;
alter table public.profiles add column if not exists active_devices jsonb default '[]'::jsonb;
alter table public.profiles add column if not exists admin_updated_at timestamptz;

-- Garante que o padrão seja apenas os dias de teste grátis (3 dias) e não 30 dias antes do pagamento
alter table public.profiles alter column expires_at set default (now() + interval '3 days');
alter table public.profiles alter column is_trial set default true;

-- 2. Tabela Permanente Anti-Fraude de Teste Grátis ('used_trials')
-- Impede que um usuário receba novo teste grátis mesmo se o seu perfil for excluído
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

-- Política de Leitura Pública para checagem instantânea de Anti-Fraude no cadastro (Web e APK)
drop policy if exists "Leitura publica anti fraude used_trials" on public.used_trials;
create policy "Leitura publica anti fraude used_trials"
  on public.used_trials for select
  using (true);

-- Permite inserção de registros de anti-fraude pelo sistema e pelo admin
drop policy if exists "Insercao anti fraude used_trials" on public.used_trials;
create policy "Insercao anti fraude used_trials"
  on public.used_trials for insert
  with check (true);

drop policy if exists "Admin pode gerenciar used_trials" on public.used_trials;
create policy "Admin pode gerenciar used_trials"
  on public.used_trials for all
  using (public.is_admin())
  with check (public.is_admin());

-- Índices para otimização de consultas e relatórios
create index if not exists idx_profiles_email on public.profiles(email);
create index if not exists idx_profiles_whatsapp on public.profiles(whatsapp);
create index if not exists idx_profiles_status on public.profiles(status);
create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_expires_at on public.profiles(expires_at);

-- 3. Habilitação de Row Level Security (RLS)
alter table public.profiles enable row level security;

-- 3. Função de Segurança Definer para checar se o usuário atual é Administrador
-- (Evita recursão infinita no RLS)
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  ) or (coalesce(auth.jwt() ->> 'email', '') = 'gleisson1984@gmail.com');
$$;

-- 4. Políticas de RLS (Row Level Security)

-- Drop de políticas anteriores se existirem (para permitir reexecução idempotente)
drop policy if exists "Perfis são legíveis pelo próprio usuário" on public.profiles;
drop policy if exists "Admin pode visualizar todos os perfis" on public.profiles;
drop policy if exists "Admin pode atualizar qualquer perfil" on public.profiles;
drop policy if exists "Usuario pode atualizar seu proprio perfil" on public.profiles;
drop policy if exists "Admin pode inserir perfis" on public.profiles;
drop policy if exists "Admin pode deletar perfis" on public.profiles;

-- Política 1: O próprio usuário pode ler seus próprios dados de perfil
create policy "Perfis são legíveis pelo próprio usuário"
on public.profiles
for select
using (
  auth.uid() = id
);

-- Política 2: O Administrador pode ler todos os perfis cadastrados
create policy "Admin pode visualizar todos os perfis"
on public.profiles
for select
using (
  public.is_admin()
);

-- Política 3: O Administrador pode atualizar o status, plano e validade de qualquer perfil
create policy "Admin pode atualizar qualquer perfil"
on public.profiles
for update
using (
  public.is_admin()
)
with check (
  public.is_admin()
);

-- Política 3b: O próprio usuário pode sincronizar dados de cadastro/dispositivos/expiração do próprio perfil
-- (Colunas sensíveis de assinatura são protegidas pelo trigger protect_profile_sensitive_columns abaixo)
create policy "Usuario pode atualizar seu proprio perfil"
on public.profiles
for update
using (
  auth.uid() = id
)
with check (
  auth.uid() = id
);

-- Trigger de Segurança (Anti-Escalação de Privilégio):
-- Impede que usuários comuns (não-admin) alterem seu próprio role, validade, limite de telas ou reativem contas vencidas/suspensas
create or replace function public.protect_profile_sensitive_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Se a operação vem do service_role/postgres (auth.uid() nulo) ou de um Administrador, permite tudo
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  -- Preserva colunas administrativas críticas contra adulteração no client-side
  new.role := old.role;
  new.expires_at := old.expires_at;
  new.max_screens := old.max_screens;
  new.is_trial := old.is_trial;
  new.trial_used := old.trial_used;
  new.admin_updated_at := old.admin_updated_at;

  -- O cliente só pode mudar o próprio status para 'vencido' quando o prazo realmente expirou;
  -- nunca pode promover a própria conta para 'ativo' se estava 'vencido' ou 'suspenso'.
  if new.status <> old.status then
    if new.status = 'vencido' and old.expires_at <= now() then
      new.status := 'vencido';
    else
      new.status := old.status;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_protect_profile_sensitive_columns on public.profiles;
create trigger trg_protect_profile_sensitive_columns
  before update on public.profiles
  for each row execute function public.protect_profile_sensitive_columns();

-- Política 4: O Administrador pode criar e deletar perfis se necessário
create policy "Admin pode inserir perfis"
on public.profiles
for insert
with check (
  public.is_admin() or auth.uid() = id
);

create policy "Admin pode deletar perfis"
on public.profiles
for delete
using (
  public.is_admin()
);

-- 5. Trigger Automático após Cadastro em auth.users com Controle Anti-Fraude e Dias de Teste Grátis Configuráveis
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

    -- 3. Verifica se este e-mail ou WhatsApp já utilizou o teste grátis anteriormente
    select exists (
      select 1 from public.used_trials
      where lower(email) = lower(new.email)
         or (clean_phone <> '' and clean_phone is not null and regexp_replace(coalesce(whatsapp, ''), '\D', '', 'g') = clean_phone)
    ) into already_used_trial;

    if already_used_trial then
      -- Já usou o teste grátis! Cria a conta bloqueada (vencida) mantendo o plano escolhido para pagamento
      initial_status := 'vencido';
      initial_expiry := now();
      initial_plan := chosen_plan;
      is_trial_flag := false;
      trial_used_flag := true;
    elsif not cfg_trial_enabled or cfg_trial_days <= 0 then
      -- Teste grátis desativado pelo administrador no painel
      initial_status := 'vencido';
      initial_expiry := now();
      initial_plan := chosen_plan;
      is_trial_flag := false;
      trial_used_flag := false;
    else
      -- Novo cliente legítimo: Inicia no Período de Teste do Plano Escolhido!
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
    role = case 
      when lower(excluded.email) = 'gleisson1984@gmail.com' then 'admin'
      else public.profiles.role
    end;

  return new;
end;
$$;

-- Vincular o Trigger à tabela auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Trigger Anti-Fraude: quando o Admin deleta um perfil de cliente,
-- grava permanentemente o e-mail e WhatsApp em used_trials para NUNCA mais ter direito a teste grátis!
create or replace function public.record_deleted_profile_trial()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if lower(old.email) <> 'gleisson1984@gmail.com' then
    insert into public.used_trials (email, whatsapp, trial_days, notes)
    values (
      lower(old.email), 
      regexp_replace(coalesce(old.whatsapp, ''), '\D', '', 'g'), 
      3, 
      'Gravado na exclusão do cliente para impedir novo teste grátis'
    )
    on conflict do nothing;
  end if;
  return old;
end;
$$;

drop trigger if exists on_profile_deleted_record_trial on public.profiles;
create trigger on_profile_deleted_record_trial
  before delete on public.profiles
  for each row execute function public.record_deleted_profile_trial();

-- 6. Garantir extensão pgcrypto para criptografia de senhas
create extension if not exists pgcrypto;

-- 7. Confirmar o e-mail e metadados do Administrador Master (gleisson1984@gmail.com)
-- NOTA DE SEGURANÇA: A senha do administrador deve ser definida/alterada pelo painel do Supabase Auth
-- ou via variável de ambiente segura, nunca exposta em texto plano no versionamento.
update auth.users
set 
  email_confirmed_at = coalesce(email_confirmed_at, now()),
  raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || '{"whatsapp": "5592993746740"}'::jsonb,
  updated_at = now()
where lower(email) = 'gleisson1984@gmail.com';

-- 8. Tabela de Configurações Dinâmicas do Sistema (Trial, Pix, Planos e Segurança do App)
create table if not exists public.system_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);

alter table public.system_settings enable row level security;

-- Leitura pública para todos os visitantes e clientes
drop policy if exists "Configuracoes publicas para leitura" on public.system_settings;
create policy "Configuracoes publicas para leitura"
  on public.system_settings for select
  using (true);

-- Apenas administradores podem alterar configurações
drop policy if exists "Apenas admin master pode gerenciar configuracoes" on public.system_settings;
create policy "Apenas admin master pode gerenciar configuracoes"
  on public.system_settings for all
  using (public.is_admin())
  with check (public.is_admin());

-- Inserir configuração padrão de teste grátis (3 dias ativo)
insert into public.system_settings (key, value)
values ('trial_config', '{"trial_days": 3, "enabled": true}'::jsonb)
on conflict (key) do nothing;

-- 9. Retroalimentação (Backfill) para usuários já existentes em auth.users
insert into public.profiles (id, email, whatsapp, role, status, plan_name, expires_at, max_screens, created_at)
select 
  id, 
  email, 
  coalesce(raw_user_meta_data->>'whatsapp', case when lower(email) = 'gleisson1984@gmail.com' then '5592993746740' else '' end) as whatsapp,
  case when lower(email) = 'gleisson1984@gmail.com' then 'admin' else 'client' end as role,
  'ativo' as status,
  'Mensal' as plan_name,
  now() + interval '365 days' as expires_at,
  5 as max_screens,
  now() as created_at
from auth.users
on conflict (id) do update set
  email = excluded.email,
  whatsapp = coalesce(nullif(excluded.whatsapp, ''), public.profiles.whatsapp),
  role = case 
    when lower(excluded.email) = 'gleisson1984@gmail.com' then 'admin' 
    else public.profiles.role 
  end;

-- 10. Funções RPC de Anti-Fraude e Exclusão Definitiva de Usuários pelo Administrador

-- 10.1 RPC para checagem rápida de Anti-Fraude antes de conceder teste grátis
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

-- 10.2 RPC de Exclusão Definitiva: Exclui tanto de auth.users quanto de public.profiles,
-- preservando os dados permanentemente no Anti-Fraude (used_trials) para economizar cota do plano gratuito do Supabase.
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

  -- 3. Exclui da tabela auth.users (Supabase Authentication Engine - libera cota de usuários)
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

-- 10.3 Função RPC para Atualização de Status pelo Administrador sem bloqueio de RLS
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

-- ==============================================================================
-- Fim do script schema.sql
-- ==============================================================================
