import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, type Location } from "react-router-dom";
import { motion } from "framer-motion";
import Header from "../components/layout/Header";
import PortfolioDetailContent from "./PortfolioDetailContent";
import { usePortfolios, mapRowToPortfolioDetail } from "../lib/portfolioApi";
import { getAdjacentSlug, isDetailSlug } from "../lib/portfolioNav";

interface PortfolioDetailModalProps {
  slug: string;
}

interface NavState {
  backgroundLocation?: Location;
  /** WorkCard가 클릭된 그 인스턴스의 layoutId를 실어 보낸 것 — 같은 슬러그를 가리키는
   *  카드가 화면에 여러 개 있을 수 있어서, 슬러그만으로 다시 계산하면 안 되고 반드시 클릭된
   *  인스턴스의 값을 그대로 써야 한다(자세한 이유는 portfolioNav.ts의 heroLayoutId 주석 참고).
   *  Prev/Next 이동이나 Related Projects 클릭처럼 특정 인스턴스가 없는 경우는 undefined —
   *  이때는 모프 없이 일반 크로스페이드로 표시된다. */
  heroLayoutId?: string;
}

/** 흰 배경/본문이 나타나는 속도(히어로가 다 자리잡은 뒤 트리거됨) 및 닫을 때 페이드아웃 속도. */
const REVEAL_TRANSITION = { duration: 0.5, ease: [0.65, 0, 0.35, 1] as const };

/**
 * PortfolioList 위에 뜨는 상세 오버레이. App.tsx가 URL의 backgroundLocation state를 보고
 * 이 컴포넌트를 리스트 위에 추가로 얹어 렌더링한다 — 리스트(배경)는 그대로 유지되고,
 * 클릭했던 썸네일 이미지는 PortfolioDetailContent의 히어로 이미지와 같은 layoutId를 공유해
 * framer-motion이 자동으로 위치/크기를 모프한다.
 *
 * 흰 배경은 처음부터 화면을 덮지 않는다 — 클릭 직후엔 투명한 채로 시작해서 배경 리스트가
 * 그대로 보이고, 그 위에서 히어로 이미지만 실시간으로 커진다. 이미지가 다 자리잡는 순간에만
 * (onHeroSettled) 흰 배경과 제목/설명 등 본문이 함께 페이드인한다. 그렇지 않으면 흰 배경이
 * 이미지보다 먼저 화면 전체를 덮어버려서 "화면이 하얗게 됐다가 이미 커진 이미지로 넘어간다"처럼
 * 보이는 문제가 있었다.
 *
 * 상단은 별도 Close 버튼 대신 풀 페이지(PortfolioDetail.tsx)와 동일한 Header를 그대로 쓴다 —
 * 로고 클릭(Home)이나 GNB의 Portfolio 링크로 자연스럽게 빠져나갈 수 있고, ESC/뒤로가기는
 * 그대로 유지된다.
 */
export default function PortfolioDetailModal({ slug }: PortfolioDetailModalProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const rootRef = useRef<HTMLDivElement>(null);
  const navState = location.state as NavState | null;
  const backgroundLocation = navState?.backgroundLocation;
  const heroLayoutId = navState?.heroLayoutId;
  // heroLayoutId가 없으면(Prev/Next, Related Projects 클릭 등 특정 인스턴스가 없는 경우)
  // 히어로가 plain <img>로 렌더돼 onLayoutAnimationComplete가 호출되지 않으므로, 모프를
  // 기다리지 않고 바로 본문을 보여준다.
  const [heroSettled, setHeroSettled] = useState(!heroLayoutId);
  const { rows } = usePortfolios();
  const knownSlugs = rows?.map((r) => r.slug) ?? [];
  const row = rows?.find((r) => r.slug === slug);
  const detail = row ? mapRowToPortfolioDetail(row) : undefined;

  const close = () => {
    if (backgroundLocation) {
      navigate({ pathname: backgroundLocation.pathname, search: backgroundLocation.search });
    } else {
      navigate("/portfolio");
    }
  };

  const goToSlug = (target: string) => {
    // Prev/Next로 이동할 때도 "원래" 배경(리스트)을 그대로 이어서 넘겨야, 계속 같은 리스트가
    // 배경에 유지되고 ESC/뒤로가기를 누르면 항상 진짜 출발점(리스트)으로 돌아간다.
    navigate(target, { state: { backgroundLocation } });
  };

  // 상세 뷰 진입/전환 시 포커스를 오버레이 컨테이너로 이동(접근성 요구사항) — 전용 Close
  // 버튼이 없으므로, 스크린 리더가 새 영역에 들어왔음을 알리고 키보드 사용자가 Tab으로
  // Header의 GNB부터 자연스럽게 훑을 수 있도록 컨테이너 자체에 포커스를 준다.
  useEffect(() => {
    rootRef.current?.focus();
  }, [slug]);

  // ESC로 닫기.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backgroundLocation]);

  if (!detail || !isDetailSlug(slug, knownSlugs)) return null;

  const prevSlug = getAdjacentSlug(slug, -1, knownSlugs);
  const nextSlug = getAdjacentSlug(slug, 1, knownSlugs);
  const prevTitle = rows?.find((r) => r.slug === prevSlug)?.title ?? prevSlug;
  const nextTitle = rows?.find((r) => r.slug === nextSlug)?.title ?? nextSlug;

  return (
    <motion.div
      ref={rootRef}
      tabIndex={-1}
      className="fixed inset-0 z-[500] overflow-y-auto text-sub-primary-txt outline-none"
      initial={false}
      animate={{ backgroundColor: heroSettled ? "#ffffff" : "rgba(255,255,255,0)" }}
      exit={{ opacity: 0 }}
      transition={REVEAL_TRANSITION}
    >
      <Header variant="default" />

      <PortfolioDetailContent
        detail={detail}
        heroLayoutId={heroLayoutId}
        heroSettled={heroSettled}
        onHeroSettled={() => setHeroSettled(true)}
      />

      {/* 하단: 이전/다음 프로젝트 — 흰 배경/본문과 같은 타이밍에 함께 나타난다 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: heroSettled ? 1 : 0 }}
        transition={REVEAL_TRANSITION}
      >
        <div className="subpage max-w-[1880px] mx-auto px-10 max-sm:px-4 pb-20">
          <div className="flex justify-between items-center border-t border-black/10 pt-10 max-sm:flex-col max-sm:items-start max-sm:gap-4">
            <button
              type="button"
              onClick={() => goToSlug(`/portfolio/${prevSlug}`)}
              className="font-en text-lg font-medium underline underline-offset-4 decoration-1 hover:text-sub-tertiary-txt transition-colors max-sm:text-base"
            >
              ← {prevTitle}
            </button>
            <button
              type="button"
              onClick={() => goToSlug(`/portfolio/${nextSlug}`)}
              className="font-en text-lg font-medium underline underline-offset-4 decoration-1 hover:text-sub-tertiary-txt transition-colors max-sm:text-base"
            >
              {nextTitle} →
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
