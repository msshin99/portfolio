import { createElement, useEffect, useRef, useState, type ReactNode } from "react";

type RevealTag = "div" | "section" | "footer";

interface RevealProps {
  as?: RevealTag;
  duration?: number;
  className?: string;
  children: ReactNode;
}

/**
 * AOS(fade-up)의 aos@2.3.1 기본 동작을 재현한다:
 * opacity 0 -> 1, transform translate3d(0,100px,0) -> translateZ(0),
 * easing "ease", offset 120px, once:false(재진입 시 다시 애니메이션).
 */
export default function Reveal({ as = "div", duration = 3000, className, children }: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: "0px 0px -120px 0px", threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return createElement(
    as,
    {
      ref,
      className,
      style: {
        opacity: visible ? 1 : 0,
        transform: visible ? "translateZ(0)" : "translate3d(0, 100px, 0)",
        transitionProperty: "opacity, transform",
        transitionDuration: `${duration}ms`,
        transitionTimingFunction: "ease",
      },
    },
    children
  );
}
