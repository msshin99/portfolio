import { useEffect, useMemo, useRef } from "react";
import { gsap, prefersReducedMotion } from "../../lib/gsap";

export const DEFAULT_WORK_TOGETHER_TEXT = "Let's work together";

/** 포트폴리오(My Works) 섹션 바로 다음에 오는 섹션 — "Let's work together"
 *  문구 전체가 화면 오른쪽 밖에 있다가, 스크롤한 만큼씩 비례해서(scrub)
 *  왼쪽 제자리로 미끄러져 들어온다. 그 안에서 글자 하나하나는 각자 다른
 *  y축 오프셋(사인파 웨이브)에서 시작해 서로 다른 타이밍(stagger)에
 *  제자리로 튀어 오르며 자리를 잡아, 문구 전체가 한 덩어리로 밋밋하게
 *  들어오는 대신 리듬감 있게 등장한다. 섹션이 화면 중앙쯤 오면 완전히
 *  자리를 잡고, 그 뒤로는 더 움직이지 않고 고정된다. */
export default function WorkTogether({ text: TEXT = DEFAULT_WORK_TOGETHER_TEXT }: { text?: string }) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const textRef = useRef<HTMLHeadingElement | null>(null);
  const words = useMemo(() => TEXT.split(" "), [TEXT]);

  useEffect(() => {
    const section = sectionRef.current;
    const text = textRef.current;
    if (!section || !text) return;

    const chars = Array.from(text.querySelectorAll<HTMLElement>(".wt-char"));

    if (prefersReducedMotion()) {
      gsap.set(text, { x: 0 });
      gsap.set(chars, { y: 0, opacity: 1 });
      return;
    }

    // xPercent(자기 폭 기준)는 텍스트 폭이 뷰포트보다 좁을 때 화면 밖으로
    // 완전히 벗어나지 못한다 — 왼쪽 시작 위치(pl-10) + 자기 폭만큼만
    // 이동해서는 뷰포트 오른쪽 경계에 못 미칠 수 있기 때문. 뷰포트 폭
    // 기준의 절대값(100vw)으로 이동해야 모바일 포함 어떤 화면 폭에서도
    // 확실히 화면 밖에서 시작한다 — 모바일의 "이동 거리 축소"는 대신
    // 폰트 크기를 줄이는 쪽으로 반영했다(체감 이동 거리가 줄어든다).
    gsap.set(text, { x: "100vw" });

    // 글자마다 시작 y오프셋을 사인파로 흩어놔서, 등장할 때 위아래로
    // 들쭉날쭉한 웨이브를 그리며 자리를 잡게 한다(짝/홀 교대보다 더
    // 자연스러운 리듬을 만든다). y/opacity만 움직이므로 리플로우 없이
    // transform+opacity(둘 다 컴포지터 처리)만으로 애니메이션된다.
    const WAVE_AMPLITUDE = 30;
    chars.forEach((el, i) => {
      gsap.set(el, { y: Math.sin(i * 0.9) * WAVE_AMPLITUDE, opacity: 0 });
    });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: "top bottom",
        end: "center center",
        scrub: 0.6,
      },
    });
    tl.to(text, { x: 0, ease: "none" }, 0);
    tl.to(
      chars,
      {
        y: 0,
        opacity: 1,
        ease: "back.out(1.4)",
        stagger: { each: 0.03, from: "start" },
      },
      0
    );

    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
    };
  }, [TEXT]);

  return (
    <section
      ref={sectionRef}
      className="work-together overflow-hidden w-full py-[120px] pl-10 max-lg:pl-10 max-sm:pl-5 max-lg:py-[90px] max-sm:py-[60px]"
    >
      <h2
        ref={textRef}
        className="work-together-text inline-block whitespace-nowrap font-en font-bold leading-[1.05] text-white text-[clamp(212px,calc(8vw+180px),320px)] max-sm:text-[clamp(204px,calc(10vw+180px),244px)]"
      >
        {words.map((word, wi) => (
          <span key={wi} className="inline-block whitespace-nowrap">
            {Array.from(word).map((ch, ci) => (
              <span key={ci} className="wt-char inline-block">
                {ch}
              </span>
            ))}
            {wi < words.length - 1 ? " " : ""}
          </span>
        ))}
      </h2>
    </section>
  );
}
