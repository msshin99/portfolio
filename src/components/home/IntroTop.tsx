import { useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger, prefersReducedMotion } from "../../lib/gsap";

function splitWords(text: string) {
  return text.split(" ");
}

/** 글자 단위로 쪼갠다. 공백은 inline-block span 안에서 폭이 사라지지 않도록 nbsp로 바꾼다. */
function splitChars(text: string) {
  return Array.from(text).map((ch) => (ch === String.fromCharCode(32) ? String.fromCharCode(160) : ch));
}

const HANGUL_RE = /[ㄱ-ㆎ가-힣]/;

interface IntroTopProps {
  heading: string;
  /** 있으면 heading에 hover했을 때 이 다른 언어 버전으로 글자 단위 물결 효과와 함께
   *  바뀐다(한글 원문이면 영문으로, 영문 원문이면 한글로 — 방향은 자유). 없으면 hover해도
   *  아무 일도 일어나지 않는다(기존 그대로). */
  hoverHeading?: string;
  description: string;
}

export default function IntroTop({ heading, hoverHeading, description }: IntroTopProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const labelRef = useRef<HTMLSpanElement | null>(null);
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const paraRef = useRef<HTMLParagraphElement | null>(null);
  const [isHoverShown, setIsHoverShown] = useState(false);
  const isFirstWaveRef = useRef(true);

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

  // hover로 원문 <-> 다른 언어가 바뀔 때, 글자 하나하나가 순서대로(왼쪽부터 오른쪽으로) 살짝
  // 시차를 두고 오르내리며 사라지고 나타나서 "물결이 훑고 지나가는" 것처럼 보이게 한다.
  useEffect(() => {
    if (!hoverHeading) return;
    const baseChars = headingRef.current?.querySelectorAll<HTMLElement>(".base-char");
    const hoverChars = headingRef.current?.querySelectorAll<HTMLElement>(".hover-char");
    if (!baseChars?.length || !hoverChars?.length) return;

    if (isFirstWaveRef.current) {
      // 최초 마운트 시점엔 애니메이션 없이 기본 상태(원문 보임/hover 텍스트 숨김)만 즉시
      // 세팅한다 — 페이지 로드와 동시에 물결이 재생되면 hover와 무관해 보여 어색하다.
      isFirstWaveRef.current = false;
      gsap.set(baseChars, { opacity: 1, y: 0, filter: "blur(0px)" });
      gsap.set(hoverChars, { opacity: 0, y: 10, filter: "blur(8px)" });
      return;
    }

    if (prefersReducedMotion()) {
      gsap.set(baseChars, { opacity: isHoverShown ? 0 : 1, y: 0, filter: "blur(0px)" });
      gsap.set(hoverChars, { opacity: isHoverShown ? 1 : 0, y: 0, filter: "blur(0px)" });
      return;
    }

    const outChars = isHoverShown ? baseChars : hoverChars;
    const inChars = isHoverShown ? hoverChars : baseChars;

    // 글자 수가 많은 헤딩(예: 홈 인트로의 긴 문단)일수록 "each"(글자당 고정 시차)는 총 소요
    // 시간이 글자 수에 비례해 계속 늘어나 물결이 몇 초씩 걸리는 문제가 있었다. "amount"(전체
    // 시차를 이 시간에 걸쳐 균등 분배)로 바꾸면 글자가 몇 개든 물결이 훑는 총 시간이 항상
    // 동일하게 유지된다.
    const tl = gsap.timeline();
    tl.to(outChars, {
      y: -12,
      opacity: 0,
      filter: "blur(7px)",
      duration: 0.26,
      ease: "sine.in",
      stagger: { amount: 0.3, from: "start" },
    }).fromTo(
      inChars,
      { y: 12, opacity: 0, filter: "blur(7px)" },
      {
        y: 0,
        opacity: 1,
        filter: "blur(0px)",
        duration: 0.32,
        ease: "sine.out",
        stagger: { amount: 0.34, from: "start" },
      },
      "-=0.14"
    );

    return () => {
      tl.kill();
    };
  }, [isHoverShown, hoverHeading]);

  const hoverIsLatin = !!hoverHeading && !HANGUL_RE.test(hoverHeading);

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
          onMouseEnter={() => hoverHeading && setIsHoverShown(true)}
          onMouseLeave={() => setIsHoverShown(false)}
          className={[
            "relative text-[60px] leading-[72px] font-bold mb-10 max-lg:text-[48px] max-lg:leading-[60px] max-lg:mb-7 max-sm:text-[40px] max-sm:leading-[48px] max-sm:mb-5",
            hoverHeading ? "cursor-default" : "",
          ].join(" ")}
        >
          <span className="inline-block">
            {splitWords(heading).map((word, i) => (
              <span key={i} className="inline-block overflow-hidden align-top pb-[0.15em] -mb-[0.15em]">
                <span className="split-word inline-block will-change-transform">
                  {splitChars(`${word} `).map((ch, j) => (
                    <span key={j} className="base-char inline-block will-change-transform">
                      {ch}
                    </span>
                  ))}
                </span>
              </span>
            ))}
          </span>
          {/* 원문보다 길어질 수 있는 다른 언어 버전이라 h3의 실제 높이(레이아웃)에는 전혀
              관여하지 않게 absolute로 겹쳐 얹는다 — 그래야 hover 전/후로 페이지가 늘었다
              줄었다 하지 않는다. 폰트 크기도 h3 자체 크기의 0.68em 배수라 max-lg/max-sm
              브레이크포인트마다 같은 비율로 자동으로 따라 줄어든다. 원문이 여러 줄로 감싸지는
              긴 문단(홈 인트로)이면 hover 텍스트도 그 높이 안에서 자유롭게 줄바꿈되고,
              원문이 한 줄뿐인 짧은 헤딩(About)이면 자연스럽게 한 줄 안에 들어간다 — 단어
              단위(inline-block)로 감싸 줄바꿈은 단어 경계에서만 일어나게 한다. */}
          {hoverHeading ? (
            <span
              aria-hidden={!isHoverShown}
              className={[
                "absolute inset-0 flex items-center overflow-hidden text-[0.68em] font-semibold tracking-tight",
                hoverIsLatin ? "font-en" : "font-ko",
              ].join(" ")}
            >
              <span className="inline-block">
                {splitWords(hoverHeading).map((word, i) => (
                  <span key={i} className="inline-block">
                    {splitChars(`${word} `).map((ch, j) => (
                      <span key={j} className="hover-char inline-block will-change-transform">
                        {ch}
                      </span>
                    ))}
                  </span>
                ))}
              </span>
            </span>
          ) : null}
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
