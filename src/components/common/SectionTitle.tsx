import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { useTilt } from "../../hooks/useTilt";
import { gsap, prefersReducedMotion } from "../../lib/gsap";

interface SectionTitleProps {
  subTxt: string;
  title: string;
  description?: ReactNode;
}

export default function SectionTitle({ subTxt, title, description }: SectionTitleProps) {
  // 헤딩 자체를 살짝 3D로 기울여서, 스크롤로 지나치기 쉬운 큰 타이틀에도 마우스로
  // 다가가면 반응하는 인터랙션을 준다(카드형 요소에 이미 쓰던 tilt를 텍스트에 적용).
  const tiltRef = useTilt<HTMLHeadingElement>({ max: 6, scale: 1.03 });
  const containerRef = useRef<HTMLDivElement | null>(null);
  const subRef = useRef<HTMLSpanElement | null>(null);
  const descRef = useRef<HTMLParagraphElement | null>(null);
  const words = useMemo(() => title.split(" "), [title]);

  // 화면에 들어올 때 라벨 -> 큰 타이틀(단어 단위로 순차 등장) -> 설명 순서로
  // 살짝 시차를 두고 나타난다. 다른 Reveal 계열과 달리 한 번 나타난 뒤에는
  // 다시 사라지지 않는다 — observer.unobserve()로 재실행 자체를 막는다.
  useEffect(() => {
    const container = containerRef.current;
    const heading = tiltRef.current;
    if (!container || !heading || prefersReducedMotion()) return;

    const sub = subRef.current;
    const desc = descRef.current;
    const wordEls = Array.from(heading.querySelectorAll<HTMLElement>(".title-word"));

    gsap.set([sub, ...wordEls, desc].filter(Boolean), { opacity: 0, y: 30 });

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;

        const tl = gsap.timeline({ defaults: { ease: "power3.out", duration: 0.8 } });
        tl.to(sub, { opacity: 1, y: 0 })
          .to(wordEls, { opacity: 1, y: 0, stagger: 0.08 }, "-=0.55")
          .to(desc, { opacity: 1, y: 0 }, "-=0.5");

        observer.unobserve(container);
      },
      { rootMargin: "0px 0px -120px 0px", threshold: 0 },
    );
    observer.observe(container);

    return () => observer.disconnect();
  }, [subTxt, title, description]);

  return (
    <div ref={containerRef} className="section-title mb-[60px] max-lg:mb-10 max-sm:mb-[26px]">
      <span
        ref={subRef}
        className="sub-txt font-en text-xl leading-7 font-light text-secondary-txt mb-8 block max-lg:text-lg max-lg:leading-[26px] max-lg:mb-7 max-sm:text-base max-sm:leading-6 max-sm:mb-5"
      >
        {subTxt}
      </span>
      <div className="main-txt flex justify-between items-start flex-wrap gap-10 max-lg:gap-[18px] max-sm:gap-2.5">
        <h2
          ref={tiltRef}
          className="font-en text-[68px] leading-[76px] font-bold will-change-transform max-lg:text-[56px] max-lg:leading-[66px] max-sm:text-[40px] max-sm:leading-[48px]"
        >
          {words.map((word, wi) => (
            <span key={wi} className="title-word inline-block will-change-transform">
              {word}
              {wi < words.length - 1 ? " " : ""}
            </span>
          ))}
        </h2>
        {description ? (
          <p
            ref={descRef}
            className="font-ko text-base leading-6 font-light text-secondary-txt max-w-[720px] max-lg:max-w-full max-sm:text-sm max-sm:leading-[22px]"
          >
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}
