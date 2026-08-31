import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "../lib/gsap";

interface TiltOptions {
  /** 최대 기울기 각도(deg) */
  max?: number;
  /** 호버 시 확대 비율 */
  scale?: number;
  /** perspective 값(px) */
  perspective?: number;
}

/**
 * 카드형 요소에 마우스 위치 기반 3D 기울기(tilt) 인터랙션을 부여하는 훅.
 * 반환된 ref를 애니메이션시킬 DOM 요소에 연결한다.
 */
export function useTilt<T extends HTMLElement>({ max = 10, scale = 1.03, perspective = 900 }: TiltOptions = {}) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;

    gsap.set(el, { transformPerspective: perspective, transformStyle: "preserve-3d" });

    // quickTo 대신 overwrite:"auto"를 쓴 gsap.to를 직접 호출한다. 이 프로젝트
    // 환경에서는 같은 엘리먼트에 여러 quickTo(rotateX/rotateY/scale)를 만들면
    // 내부 프로퍼티 캐시가 어긋나 값이 반영되지 않는 문제가 있었다.
    const animate = (rotateX: number, rotateY: number, scaleTo: number) => {
      gsap.to(el, { rotateX, rotateY, scale: scaleTo, duration: 0.5, ease: "power3", overwrite: "auto" });
    };

    const handleMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      animate(py * -max, px * max, scale);
    };

    const handleLeave = () => {
      animate(0, 0, 1);
    };

    el.addEventListener("mousemove", handleMove);
    el.addEventListener("mouseleave", handleLeave);
    return () => {
      el.removeEventListener("mousemove", handleMove);
      el.removeEventListener("mouseleave", handleLeave);
    };
  }, [max, scale, perspective]);

  return ref;
}
