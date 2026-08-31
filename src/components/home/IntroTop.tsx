import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger, prefersReducedMotion } from "../../lib/gsap";

function splitWords(text: string) {
  return text.split(" ");
}

interface IntroTopProps {
  heading: string;
  description: string;
}

export default function IntroTop({ heading, description }: IntroTopProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const labelRef = useRef<HTMLSpanElement | null>(null);
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const paraRef = useRef<HTMLParagraphElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || prefersReducedMotion()) return;

    const words = headingRef.current?.querySelectorAll<HTMLElement>(".split-word");

    gsap.set(labelRef.current, { opacity: 0, x: -24 });
    gsap.set(words ?? [], { yPercent: 115, scale: 0.88, filter: "blur(10px)" });
    gsap.set(paraRef.current, { opacity: 0, y: 20 });

    // 이 섹션이 화면에 들어오는(=로딩되는) 순간 한 번 재생되는 GSAP 진입 연출. 단어가 아래에서
    // 올라오면서 동시에 블러가 걷히고 살짝 확대되며 또렷해진다 — 색은 항상 흰색 그대로 유지하고,
    // 움직임/블러/스케일만으로 인터랙티브한 느낌을 준다.
    const trigger = ScrollTrigger.create({
      trigger: container,
      start: "top 80%",
      once: true,
      onEnter: () => {
        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
        tl.to(labelRef.current, { opacity: 1, x: 0, duration: 0.6 })
          .to(
            words ?? [],
            { yPercent: 0, scale: 1, filter: "blur(0px)", duration: 0.9, stagger: 0.05, ease: "power4.out" },
            "-=0.3"
          )
          .to(paraRef.current, { opacity: 1, y: 0, duration: 0.7 }, "-=0.35");
      },
    });

    return () => trigger.kill();
    // heading이 사이트 콘텐츠 fetch 완료 후 기본값에서 실제 값으로 바뀌면 단어 span 구성이
    // 달라질 수 있어, 그때마다 애니메이션 셋업을 다시 캡처한다.
  }, [heading]);

  return (
    <div
      ref={containerRef}
      className="top flex items-start justify-between gap-[60px] mb-[100px] max-lg:flex-col max-lg:gap-8 max-sm:gap-5"
    >
      <span
        ref={labelRef}
        className="sub-txt font-en text-xl leading-7 font-light text-secondary-txt max-lg:text-lg max-lg:leading-[26px] max-sm:text-base max-sm:leading-6"
      >
        (About)
      </span>
      <div className="right max-w-[1190px]">
        <h3
          ref={headingRef}
          className="text-[60px] leading-[72px] font-bold mb-10 max-lg:text-[48px] max-lg:leading-[60px] max-lg:mb-7 max-sm:text-[40px] max-sm:leading-[48px] max-sm:mb-5"
        >
          {splitWords(heading).map((word, i) => (
            <span key={i} className="inline-block overflow-hidden align-top pb-[0.15em] -mb-[0.15em]">
              <span className="split-word inline-block will-change-transform">
                {word}
                {" "}
              </span>
            </span>
          ))}
        </h3>
        <p
          ref={paraRef}
          className="font-ko text-base leading-6 font-light text-secondary-txt max-lg:text-sm max-lg:leading-[22px]"
        >
          {description}
        </p>
      </div>
    </div>
  );
}
