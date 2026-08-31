-- graphic_works: 포트폴리오 리스트의 "GRAPIC DESIGN" 그룹에 노출되는 항목. web design과
-- 달리 상세페이지(box_container/font_info/color_info 등)가 없는 단순 썸네일+링크 카드라
-- portfolios 테이블과 분리된 훨씬 가벼운 테이블로 관리한다. href는 내부 경로
-- (/portfolio/chairpdp 등)일 수도, 외부 URL(Behance 등)일 수도 있다.
create table public.graphic_works (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  date_label text not null default '',
  caption text not null default '',
  image_url text not null default '',
  href text not null default '',
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger graphic_works_set_updated_at
  before update on public.graphic_works
  for each row execute function public.set_updated_at();

alter table public.graphic_works enable row level security;

create policy "graphic_works are publicly readable"
  on public.graphic_works for select
  to anon, authenticated
  using (true);

create policy "authenticated users can insert graphic_works"
  on public.graphic_works for insert
  to authenticated
  with check (true);

create policy "authenticated users can update graphic_works"
  on public.graphic_works for update
  to authenticated
  using (true)
  with check (true);

create policy "authenticated users can delete graphic_works"
  on public.graphic_works for delete
  to authenticated
  using (true);
