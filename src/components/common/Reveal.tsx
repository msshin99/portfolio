import { createElement, useEffect, useRef, type ReactNode } from "react";
import { gsap, prefersReducedMotion } from "../../lib/gsap";

type RevealTag = "div" | "section" | "footer";

interface RevealProps {
  as?: RevealTag;
  duration?: number;
  className?: string;
  children: ReactNode;
}

/**
 * 섹션 전체가 뷰포트에 들어올 때 등장하는 리빌. 예전엔 AOS(fade-up) 그대로
 * — opacity + translateY만 움직이는 단순한 CSS transition이라, 다른 곳(카드
 * 틸트, 키워드 hover, 섹션 타이틀 단어 stagger 등)의 화려한 모션들 사이에서
 * 유독 밋밋하게 느껴졌다. scale(살짝 작았다가 커짐) + blur(흐릿했다가
 * 선명해짐) + 아주 살짝의 3D rotateX(뒤로 젖혀져 있다가 세워짐)를 더해서,
 * 화면에 "훅 들어오는" 느낌을 준다. 재진입(스크롤 위/아래로 벗어났다 다시
 * 들어옴) 때마다 처음부터 다시 재생되는 동작은 기존 AOS(once:false)와
 * 동일하게 유지한다.
 */
export default function Reveal({ as = "div", duration = 3000, className, children }: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (prefersReducedMotion()) {
      gsap.set(el, { clearProps: "all" });
      return;
    }

    gsap.set(el, { transformPerspective: 1000, transformOrigin: "50% 100%" });

    const hide = () =>
      gsap.set(el, { opacity: 0, y: 90, scale: 0.92, rotateX: 6, filter: "blur(14px)" });
    hide();

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          // 재진입 시 처음부터 다시 재생되도록, 화면을 벗어나는 즉시(애니메이션
          // 없이) 숨김 상태로 되돌려둔다.
          hide();
          return;
        }
        gsap.to(el, {
          opacity: 1,
          y: 0,
          scale: 1,
          rotateX: 0,
          filter: "blur(0px)",
          duration: duration / 1000,
          ease: "power4.out",
          // 애니메이션이 끝나면 GSAP가 남겨둔 인라인 transform/filter를 지운다 —
          // 인라인 style은 hover 등 클래스 기반 CSS보다 항상 우선하므로, 이걸
          // 지우지 않으면 자식/자신에 걸린 hover transform 효과가 막힐 수 있다.
          clearProps: "transform,filter",
        });
      },
      { rootMargin: "0px 0px -120px 0px", threshold: 0 }
    );
    observer.observe(el);

    return () => observer.disconnect();
  }, [duration]);

  return createElement(as, { ref, className }, children);
}
