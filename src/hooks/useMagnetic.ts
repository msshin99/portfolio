import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "../lib/gsap";

interface MagneticOptions {
  /** 요소가 커서 쪽으로 얼마나 끌려갈지(px). 실제 마우스 이동량에 이 비율을 곱해서 이동한다. */
  strength?: number;
}

/**
 * 링크/텍스트 같은 요소가 마우스가 다가오면 그 방향으로 살짝 끌려갔다가, 벗어나면
 * 원래 자리로 돌아오는 "마그네틱" 인터랙션. useTilt와 같은 패턴(gsap.to + overwrite:"auto")을
 * 쓰되, 여기서는 요소 전체를 아주 작은 범위에서만 이동시킨다 — 페이지 레이아웃 폭에는
 * 영향이 없도록 strength를 항상 작게 유지해야 한다(가로 스크롤이 생기지 않게).
 */
export function useMagnetic<T extends HTMLElement>({ strength = 18 }: MagneticOptions = {}) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;

    const handleMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const relX = (e.clientX - rect.left) / rect.width - 0.5;
      const relY = (e.clientY - rect.top) / rect.height - 0.5;
      gsap.to(el, { x: relX * strength, y: relY * strength, duration: 0.5, ease: "power3", overwrite: "auto" });
    };
    const handleLeave = () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1, 0.4)", overwrite: "auto" });
    };

    el.addEventListener("mousemove", handleMove);
    el.addEventListener("mouseleave", handleLeave);
    return () => {
      el.removeEventListener("mousemove", handleMove);
      el.removeEventListener("mouseleave", handleLeave);
    };
  }, [strength]);

  return ref;
}
