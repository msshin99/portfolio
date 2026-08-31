import { useEffect, useRef } from "react";
import { gsap } from "../../lib/gsap";

const headingClass = [
  "font-en text-center text-[100px] leading-[132px] font-bold mb-6",
  "max-lg:text-[76px] max-lg:leading-[88px] max-lg:mb-[18px]",
  "max-sm:text-[60px] max-sm:leading-[72px] max-sm:mb-2.5",
  "bg-[linear-gradient(90deg,#1f2937,#6b7280,#f9fafb,#1f2937)] [background-size:400%_400%]",
  "bg-clip-text text-transparent",
  "animate-[visualtxt_16s_ease_infinite,hue-spin_18s_linear_infinite]",
  "[will-change:background-position,filter]",
].join(" ");

interface HeroProps {
  image: string;
  /** 관리자 페이지(site_content: hero_heading)에서 값을 넣으면 그걸로 대체됨. 줄바꿈(\n)
   *  기준으로 나눠서 각 줄을 <br/>로 렌더링한다. */
  heading: string;
  /** site_content: hero_subtext */
  subtext: string;
}

export default function Hero({ image, heading, subtext }: HeroProps) {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const textRef = useRef<HTMLDivElement | null>(null);
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const subRef = useRef<HTMLParagraphElement | null>(null);
  const glowRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = gsap.context(() => {
      if (reduceMotion) {
        gsap.set([imageRef.current, headingRef.current, subRef.current], { clearProps: "all" });
        return;
      }

      // ---- 진입 애니메이션: 이미지 줌아웃 + 헤드라인 스케일업 페이드인 + 서브텍스트 페이드업 ----
      // (filter는 h2 자체의 hue-spin CSS 애니메이션과 겹치므로 transform/opacity만 사용)
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from(imageRef.current, { scale: 1.22, opacity: 0, duration: 1.7, ease: "power2.out" })
        .from(headingRef.current, { opacity: 0, y: 36, scale: 0.94, duration: 1.2, ease: "power3.out" }, "-=1.2")
        .from(subRef.current, { y: 20, opacity: 0, duration: 0.9 }, "-=0.5");

      // ---- 마우스 패럴랙스: 이미지/텍스트가 커서에 반응해 미세하게 움직임 ----
      // quickTo 대신 overwrite:"auto"를 쓴 gsap.to를 직접 호출한다(이 프로젝트
      // 환경에서 같은 엘리먼트에 여러 quickTo를 만들면 내부 캐시가 어긋나는 문제가 있었다).
      const moveTo = (el: Element | null, x: number, y: number, duration: number) => {
        if (!el) return;
        gsap.to(el, { x, y, duration, ease: "power3", overwrite: "auto" });
      };

      const handlePointerMove = (e: PointerEvent) => {
        const rect = sectionRef.current?.getBoundingClientRect();
        if (!rect) return;
        const relX = (e.clientX - rect.left) / rect.width - 0.5;
        const relY = (e.clientY - rect.top) / rect.height - 0.5;

        moveTo(imageRef.current, relX * -26, relY * -26, 0.9);
        moveTo(textRef.current, relX * 14, relY * 14, 1.1);
        moveTo(glowRef.current, e.clientX - rect.left, e.clientY - rect.top, 0.5);
      };

      sectionRef.current?.addEventListener("pointermove", handlePointerMove);

      // ---- 스크롤 패럴랙스: 배경은 느리게 따라오고, 텍스트는 먼저 위로 사라짐 ----
      gsap.to(imageRef.current, {
        yPercent: 18,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });

      gsap.to(textRef.current, {
        yPercent: -35,
        opacity: 0,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "70% top",
          scrub: true,
        },
      });

      return () => {
        sectionRef.current?.removeEventListener("pointermove", handlePointerMove);
      };
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={sectionRef} className="visual relative w-full h-[100vh] overflow-hidden mb-[100px]">
      <figure className="w-full h-full">
        <img
          ref={imageRef}
          src={image}
          alt=""
          className="w-full h-full object-cover block scale-110"
        />
      </figure>

      <div
        ref={glowRef}
        className="pointer-events-none absolute top-0 left-0 w-[600px] h-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40 mix-blend-screen [background:radial-gradient(circle,rgba(111,71,219,0.55),rgba(14,203,123,0.25)_45%,transparent_70%)]"
      />

      <div ref={textRef} className="txt absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full">
        <h2 ref={headingRef} className={headingClass}>
          {heading.split("\n").map((line, i, arr) => (
            <span key={i}>
              {line}
              {i < arr.length - 1 && <br />}
            </span>
          ))}
        </h2>
        <p
          ref={subRef}
          className="font-en text-2xl leading-9 font-medium text-center opacity-60 max-lg:text-xl max-lg:leading-7 max-sm:text-lg max-sm:leading-[26px]"
        >
          {subtext}
        </p>
      </div>
    </div>
  );
}
