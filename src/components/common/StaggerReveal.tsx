import { useEffect, useRef, type ReactNode } from "react";
import { gsap, prefersReducedMotion } from "../../lib/gsap";

type StaggerTag = "ul" | "div";

interface StaggerRevealProps {
  as?: StaggerTag;
  className?: string;
  children: ReactNode;
  /** 시작 y 오프셋(px) */
  y?: number;
  /** 항목 간 딜레이(초) */
  stagger?: number;
  /** 시작 스케일 */
  fromScale?: number;
  /** 시작 3D rotateX(deg) — 카드가 살짝 뒤로 젖혀진 상태에서 세워짐 */
  rotateX?: number;
  /** 시작 rotateZ(deg) — 살짝 비뚤어진 상태에서 정렬됨 */
  rotateZ?: number;
  /** true면 짝/홀 인덱스에 따라 좌/우에서 번갈아 슬라이드인 */
  alternateX?: number;
}

/**
 * 컨테이너가 뷰포트에 들어오면 자식 요소들을 fade + y/rotate + scale로 순차
 * 등장시키는 GSAP 기반 카드 그리드 리빌 컴포넌트.
 * (work-list, keyword, service-list, skill-list 등)
 *
 * 트리거는 GSAP ScrollTrigger가 아니라 IntersectionObserver로 감지한다. ScrollTrigger는
 * 기본적으로 window 스크롤을 기준으로 트리거 위치를 계산하는데, PortfolioDetailModal처럼
 * 실제 스크롤이 window가 아니라 오버레이 자체의 overflow-y-auto에서 일어나는 곳에서는
 * 이 컨테이너가 화면에 들어와도 전혀 감지되지 않아 opacity:0에 영구히 멈춰버리는 문제가
 * 있었다(컬러 카드, Related Projects 카드가 안 보이던 원인). IntersectionObserver는 어떤
 * 조상이 스크롤되든 상관없이 뷰포트와의 교차 여부만 보므로 이 문제가 없다.
 */
export default function StaggerReveal({
  as = "div",
  className,
  children,
  y = 48,
  stagger = 0.08,
  fromScale = 0.94,
  rotateX = 0,
  rotateZ = 0,
  alternateX,
}: StaggerRevealProps) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;

    const items = Array.from(el.children) as HTMLElement[];
    if (items.length === 0) return;

    if (rotateX) gsap.set(el, { perspective: 1200 });

    items.forEach((item, i) => {
      const x = alternateX ? (i % 2 === 0 ? -alternateX : alternateX) : 0;
      gsap.set(item, { opacity: 0, y, x, scale: fromScale, rotateX, rotateZ, transformOrigin: "50% 100%" });
    });

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        gsap.to(items, {
          opacity: 1,
          y: 0,
          x: 0,
          scale: 1,
          rotateX: 0,
          rotateZ: 0,
          duration: 1,
          stagger,
          ease: "power3.out",
          // 등장 애니메이션이 끝나면 GSAP가 남겨둔 인라인 transform을 지운다 — 인라인
          // style은 클래스 기반 CSS(:hover 포함)보다 항상 우선하므로, 이걸 지우지 않으면
          // ColorCard 등 자식 요소에 준 hover:-translate-y 같은 hover transform 효과가
          // 절대 적용되지 않는다.
          clearProps: "transform",
        });
        observer.disconnect();
      },
      { rootMargin: "0px 0px -120px 0px", threshold: 0 }
    );
    observer.observe(el);

    return () => observer.disconnect();
  }, [y, stagger, fromScale, rotateX, rotateZ, alternateX]);

  const Tag = as as "div";

  return (
    <Tag ref={ref as never} className={className}>
      {children}
    </Tag>
  );
}
