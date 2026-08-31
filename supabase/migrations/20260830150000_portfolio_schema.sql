-- portfolios: 상세 콘텐츠가 있는 프로젝트(nordune/goalcheck/prmr 등). content_blocks는
-- 타입이 있는 섹션(box_container/font_info/color_info/main_image 등)을 순서대로 담는
-- 배열이라, 새 섹션 타입이 필요해질 때도 스키마 마이그레이션 없이 확장할 수 있다.
create table public.portfolios (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  -- 리스트/메인 카드에 쓰이는 짧은 문구(예: "Furniture Webdesign") — 상세 페이지 태그라인과는 별개.
  list_caption text not null default '',
  -- 카드에 표시되는 날짜 문구. 기존 데이터가 "2025.06"/"2025.7"처럼 형식이 들쭉날쭉해서
  -- 실제 date 타입이 아니라 표시용 텍스트 그대로 둔다.
  list_date_label text not null default '',
  subtitle text not null default '',
  description text[] not null default '{}',
  meta jsonb not null default '[]',
  website_url text,
  -- 리스트 썸네일과 상세 히어로가 반드시 같은 파일이어야 layoutId shared transition이
  -- "같은 사진이 커진다"로 보인다. 컬럼을 분리하면 한쪽만 바뀌는 실수가 날 수 있어 하나로 통합.
  hero_image_url text,
  content_blocks jsonb not null default '[]',
  is_featured_on_main boolean not null default false,
  main_display_order integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint main_display_order_range
    check (main_display_order is null or (main_display_order between 1 and 6))
);

-- is_featured_on_main = true인 항목들 사이에서만 main_display_order가 유일하면 된다
-- (featured가 아닌 행은 main_display_order가 무의미하므로 유일성 검사에서 제외).
create unique index portfolios_main_display_order_unique
  on public.portfolios (main_display_order)
  where is_featured_on_main = true;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger portfolios_set_updated_at
  before update on public.portfolios
  for each row execute function public.set_updated_at();

-- site_content: 포트폴리오 항목이 아닌 사이트 전역 문구/이미지(예: 메인 히어로 카피,
-- About 소개글)를 key-value로 관리.
create table public.site_content (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value_text text,
  value_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger site_content_set_updated_at
  before update on public.site_content
  for each row execute function public.set_updated_at();

alter table public.portfolios enable row level security;
alter table public.site_content enable row level security;

-- 포트폴리오 사이트 특성상 데이터 자체는 전부 공개 열람 대상.
create policy "portfolios are publicly readable"
  on public.portfolios for select
  to anon, authenticated
  using (true);

create policy "site_content is publicly readable"
  on public.site_content for select
  to anon, authenticated
  using (true);

-- 쓰기(등록/수정/삭제)는 로그인한 관리자만.
create policy "authenticated users can insert portfolios"
  on public.portfolios for insert
  to authenticated
  with check (true);

create policy "authenticated users can update portfolios"
  on public.portfolios for update
  to authenticated
  using (true)
  with check (true);

create policy "authenticated users can delete portfolios"
  on public.portfolios for delete
  to authenticated
  using (true);

create policy "authenticated users can insert site_content"
  on public.site_content for insert
  to authenticated
  with check (true);

create policy "authenticated users can update site_content"
  on public.site_content for update
  to authenticated
  using (true)
  with check (true);

create policy "authenticated users can delete site_content"
  on public.site_content for delete
  to authenticated
  using (true);
