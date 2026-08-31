-- 그래픽 디자인 카드에 "썸네일(image_url)"과 별개로 "메인 이미지"를 등록할 수 있게 한다.
-- 메인 이미지가 있으면 그 항목만의 상세페이지(/portfolio/:slug, PortfolioImage 컴포넌트)가
-- 자동으로 생겨야 하므로 slug 컬럼도 추가한다 — chairpdp/cosmeticpdp처럼 href만 갖는 기존
-- 항목(외부 링크 등)은 slug가 없어도 되므로 nullable로 둔다.
alter table public.graphic_works add column main_image_url text;
alter table public.graphic_works add column slug text unique;
