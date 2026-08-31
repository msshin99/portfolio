-- 포트폴리오 리스트 페이지(/portfolio) 노출 순서. main_display_order는 홈 화면에 노출할
-- 최대 6개만을 위한 값(1~6 범위 제약)이라, 전체 목록 순서에는 쓸 수 없어 별도 컬럼을 둔다.
alter table public.portfolios add column list_display_order integer not null default 0;

-- 컬럼 추가 시점 기준으로 기존 생성 순서를 그대로 옮겨서, 이 마이그레이션 적용 전후로
-- 화면에 보이는 순서가 바뀌지 않게 한다. 이후로는 관리자가 드래그로 재배열한다.
with ordered as (
  select id, row_number() over (order by created_at asc) - 1 as rn
  from public.portfolios
)
update public.portfolios p
set list_display_order = ordered.rn
from ordered
where ordered.id = p.id;
