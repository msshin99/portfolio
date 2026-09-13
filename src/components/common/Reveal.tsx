import { createElement, useEffect, useRef, type ReactNode } from "react";
import { gsap, isMobileViewport, prefersReducedMotion } from "../../lib/gsap";

type RevealTag = "div" | "section" | "footer";

interface RevealProps {
  as?: RevealTag;
  duration?: number;
  className?: string;
  children: ReactNode;
  /** IntersectionObserver의 rootMargin. 기본값(아래쪽 -120px)은 섹션이 실제로
   *  화면에 상당히 들어온 뒤에야 리빌을 시작한다 — 대부분의 섹션은 이 정도가
   *  자연스럽지만, 안에 무거운 콘텐츠(이미지 카드 그리드 등)가 있어 리빌+내부
   *  애니메이션이 겹치는 섹션은 사용자가 스크롤을 멈추고 바라볼 때 이미 흐릿한
   *  채로 눈에 띄어 "늦게 나온다"는 인상을 준다. 이런 곳엔 양수 값(예: 아래쪽
   *  +300px)을 넘겨서, 섹션이 실제로 화면에 보이기 전에 미리 리빌이 끝나도록
   *  당겨줄 수 있다. */
  rootMargin?: string;
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
export default function Reveal({
  as = "div",
  duration = 3000,
  className,
  children,
  rootMargin = "0px 0px -120px 0px",
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (prefersReducedMotion()) {
      gsap.set(el, { clearProps: "all" });
      return;
    }

    gsap.set(el, { transformPerspective: 1000, transformOrigin: "50% 100%" });

    // 데스크탑의 느긋한 3초짜리 시네마틱 리빌을 모바일에도 그대로 쓰면,
    // 스크롤을 내리는 동안 섹션이 한참 블러/축소된 채로 머물러 있어서
    // "화면이 이상하게 비어 보인다"는 체감으로 이어진다 — 화면이 작아
    // 스크롤 자체가 빠른 모바일에서는 훨씬 짧게 잡아, 뷰포트에 들어오면
    // 거의 즉시 또렷하게 자리잡도록 한다.
    const mobile = isMobileViewport();
    const effectiveDuration = mobile ? Math.min(duration, 500) : duration;

    const hide = () =>
      gsap.set(el, {
        opacity: 0,
        y: mobile ? 30 : 90,
        scale: mobile ? 0.97 : 0.92,
        rotateX: mobile ? 0 : 6,
        filter: mobile ? "blur(4px)" : "blur(14px)",
      });
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
          duration: effectiveDuration / 1000,
          ease: "power4.out",
          // 애니메이션이 끝나면 GSAP가 남겨둔 인라인 transform/filter를 지운다 —
          // 인라인 style은 hover 등 클래스 기반 CSS보다 항상 우선하므로, 이걸
          // 지우지 않으면 자식/자신에 걸린 hover transform 효과가 막힐 수 있다.
          clearProps: "transform,filter",
        });

        // 모바일에서는 한 번 나타난 뒤로는 다시 숨기지 않는다 — 옵저버를 아예
        // 끊어서, 스크롤을 내렸다가 다시 올릴 때 재생 대기 없이 항상 보이게 한다.
        if (mobile) observer.disconnect();
      },
      { rootMargin, threshold: 0 }
    );
    observer.observe(el);

    return () => observer.disconnect();
  }, [duration, rootMargin]);

  return createElement(as, { ref, className }, children);
}
