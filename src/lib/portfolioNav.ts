export function slugFromHref(href: string): string | null {
  const match = href.match(/^\/portfolio\/([^/]+)$/);
  return match ? match[1] : null;
}

/** 상단 네비게이션/Close, 하단 Prev/Next 등 "진짜 상세 콘텐츠"가 있는 slug만 shared-element
 *  모달 전환의 대상이 된다. knownSlugs는 현재 Supabase에서 불러온 portfolios의 slug
 *  목록(usePortfolios 캐시 기준) — 관리자가 새 프로젝트를 등록하면 자동으로 여기 포함된다.
 *  chairpdp/cosmeticpdp처럼 이미지 한 장짜리 별도 템플릿(PortfolioImage)은 이 목록에
 *  없으므로 자동으로 대상에서 빠진다. */
export function isDetailSlug(slug: string | null | undefined, knownSlugs: readonly string[]): slug is string {
  return !!slug && knownSlugs.includes(slug);
}

export function getAdjacentSlug(slug: string, direction: 1 | -1, knownSlugs: readonly string[]): string {
  const currentIndex = knownSlugs.indexOf(slug);
  const nextIndex = (currentIndex + direction + knownSlugs.length) % knownSlugs.length;
  return knownSlugs[nextIndex];
}

/** WorkCard <-> PortfolioDetailModal이 공유하는 framer-motion layoutId 네이밍 규칙.
 *
 * 같은 slug를 가리키는 WorkCard가 한 화면에 여러 번 렌더될 수 있는 곳(Home의 2번째 줄이
 * 1번째 줄과 같은 프로젝트를 다시 보여주는 경우 등)에서는 instanceKey로 각 인스턴스를
 * 구분해야 한다. 구분하지 않으면 어느 인스턴스를 클릭하든 모달의 히어로 이미지는 항상 같은
 * layoutId를 가진 "처음 만난" 인스턴스(예: 1번째 줄)의 화면 위치를 시작점으로 써버려서,
 * 실제로 클릭한 인스턴스와 다른 위치에서 애니메이션이 시작되는 버그가 생긴다. */
export function heroLayoutId(slug: string, instanceKey?: string): string {
  return instanceKey ? `work-image-${slug}:${instanceKey}` : `work-image-${slug}`;
}
