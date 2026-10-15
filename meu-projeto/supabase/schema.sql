-- Cole TUDO no Supabase > SQL Editor > Run

-- PERFIS (1 por usuário do Auth)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  name text not null,
  role text not null check (role in ('aluno','personal')),
  code text unique,            -- código do personal (PT-XXXXXX)
  personal_code text           -- código do personal vinculado ao aluno
);

-- DADOS DO APP por usuário (exercícios, treinos, histórico, calendário)
create table public.user_data (
  user_id uuid references auth.users(id) on delete cascade,
  key text,
  value jsonb,
  primary key (user_id, key)
);

alter table public.profiles enable row level security;
alter table public.user_data enable row level security;

-- funções auxiliares (evitam recursão nas políticas)
create function public.my_code() returns text
language sql stable security definer set search_path = public
as $$ select code from public.profiles where id = auth.uid() $$;

create function public.my_personal_code() returns text
language sql stable security definer set search_path = public
as $$ select personal_code from public.profiles where id = auth.uid() $$;

-- achar personal pelo código (usado no cadastro/vínculo do aluno)
create function public.find_personal(c text)
returns table(name text, code text)
language sql stable security definer set search_path = public
as $$ select p.name, p.code from public.profiles p where p.role = 'personal' and p.code = upper(trim(c)) $$;

grant execute on function public.find_personal(text) to anon, authenticated;

-- cria o perfil automaticamente ao cadastrar
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public
as $$
declare r text := coalesce(new.raw_user_meta_data->>'role', 'aluno');
begin
  if r not in ('aluno','personal') then r := 'aluno'; end if;
  insert into public.profiles (id, email, name, role, code, personal_code)
  values (
    new.id, new.email,
    coalesce(nullif(new.raw_user_meta_data->>'name',''), split_part(new.email,'@',1)),
    r,
    case when r = 'personal' then 'PT-' || upper(substr(md5(random()::text), 1, 6)) end,
    case when r = 'aluno' then nullif(upper(new.raw_user_meta_data->>'personal_code'), '') end
  );
  return new;
end $$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- POLÍTICAS
create policy "ver perfil" on public.profiles for select
  using (id = auth.uid() or personal_code = public.my_code() or code = public.my_personal_code());

create policy "editar proprio perfil" on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid());

-- aluno só pode alterar nome e vínculo (não o papel nem o código)
revoke update on public.profiles from authenticated;
grant update (name, personal_code) on public.profiles to authenticated;

create policy "dados proprios" on public.user_data for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "personal le dados dos alunos" on public.user_data for select
  using (exists (
    select 1 from public.profiles p
    where p.id = user_data.user_id and p.personal_code = public.my_code()
  ));
