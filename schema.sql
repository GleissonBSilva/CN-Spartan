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
  plan_name text not null default 'Mensal',
  expires_at timestamptz not null default (now() + interval '30 days'),
  max_screens int not null default 1 check (max_screens >= 1),
  created_at timestamptz not null default now()
);

-- Garantir adição da coluna whatsapp caso a tabela já exista
alter table public.profiles add column if not exists whatsapp text;

-- Índices para otimização de consultas e relatórios
create index if not exists idx_profiles_email on public.profiles(email);
create index if not exists idx_profiles_whatsapp on public.profiles(whatsapp);
create index if not exists idx_profiles_status on public.profiles(status);
create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_expires_at on public.profiles(expires_at);

-- 2. Habilitação de Row Level Security (RLS)
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

-- 5. Trigger Automático após Cadastro em auth.users
-- Cria o perfil imediatamente após o cadastro, definindo role='admin' para o e-mail mestre
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  user_role text;
begin
  -- Se for o e-mail do administrador principal, concede role de admin
  if lower(new.email) = 'gleisson1984@gmail.com' then
    user_role := 'admin';
  else
    user_role := 'client';
  end if;

  insert into public.profiles (
    id,
    email,
    whatsapp,
    role,
    status,
    plan_name,
    expires_at,
    max_screens,
    created_at
  ) values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'whatsapp', ''),
    user_role,
    'ativo',
    'Mensal',
    now() + interval '30 days',
    1,
    now()
  )
  on conflict (id) do update set
    email = excluded.email,
    whatsapp = coalesce(nullif(excluded.whatsapp, ''), public.profiles.whatsapp),
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

-- 6. Garantir extensão pgcrypto para criptografia de senhas
create extension if not exists pgcrypto;

-- 7. Atualizar a senha e confirmar o e-mail do Administrador (gleisson1984@gmail.com)
update auth.users
set 
  encrypted_password = crypt('SpartanAg@200624', gen_salt('bf')),
  email_confirmed_at = coalesce(email_confirmed_at, now()),
  raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || '{"whatsapp": "5592993746740"}'::jsonb,
  updated_at = now()
where lower(email) = 'gleisson1984@gmail.com';

-- 8. Retroalimentação (Backfill) para usuários já existentes em auth.users
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

-- ==============================================================================
-- Fim do script schema.sql
-- ==============================================================================
