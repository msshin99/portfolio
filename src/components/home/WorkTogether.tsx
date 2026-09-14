import { Fragment, useEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "../../lib/gsap";

export const DEFAULT_WORK_TOGETHER_TEXT = "Let's work together";

/** 화면 폭이 아주 넓어도(4K 모니터 등) 줄 끝에 빈 공간이 보이지 않도록 한
 *  바퀴 안에 문구를 넉넉히 반복해둔다. */
const REPEAT = 8;
/** 트랙이 자기 폭의 절반(=한 벌)만큼 흘러가는 데 걸리는 시간(초) — 이 값이
 *  체감 흐르는 속도를 결정한다. */
const SCROLL_DURATION = 50;
/** 글자 하나하나마다 물결(위아래 통통 튐)이 순서대로 번지는 간격(초). */
const WAVE_STEP = 0.06;
/** 글자가 위아래로 튀는 폭 — 값이 클수록(음수로 더 큼) 물결이 눈에 확 띈다. */
const WAVE_AMPLITUDE = "-0.5em";
/** 반복되는 문구 하나하나마다 네온 글로우가 밝아지는 시점을 살짝씩 늦춰서,
 *  빛이 문구를 타고 흘러가는(chase) 느낌을 만드는 간격(초). */
const GLOW_STEP = 0.35;

/** 포트폴리오(My Works) 섹션 바로 다음에 오는 섹션 — "Let's work together"가
 *  스크롤과 무관하게 화면을 가로질러 끊임없이 오른쪽에서 왼쪽으로 흘러가는
 *  대형 마퀴. GSAP 3개 트윈이 함께 만든다: ①트랙 전체를 xPercent -50까지
 *  등속으로 무한 반복 이동시켜 흐르게 하고(같은 내용을 두 벌 이어붙여서 첫
 *  벌이 화면 밖으로 다 빠져나가는 순간 두 번째 벌이 그 자리를 이어받아
 *  이음매 없이 반복된다), ②글자 하나하나를 stagger로 물결처럼 순서대로
 *  위아래로 통통 튀게 하고, ③반복 문구마다 브랜드 컬러 네온 글로우가 시차를
 *  두고 밝아졌다 사라지게 한다. */
export default function WorkTogether({ text = DEFAULT_WORK_TOGETHER_TEXT }: { text?: string }) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;

    if (prefersReducedMotion()) {
      gsap.set(track, { xPercent: 0 });
      return;
    }

    const chars = track.querySelectorAll<HTMLElement>(".wt-char");
    const repeats = track.querySelectorAll<HTMLElement>(".work-together-text");

    // 끊임없이 흐르는 xPercent 루프(scrollTween)와는 별개의 transform 축(x, px 단위)에
    // 얹는 "입장" 오프셋 — 사용자에게 이 문구가 처음 보이는 순간, 화면 오른쪽 바깥에서
    // 모니터 해상도 안으로 들어오는 것처럼 보이게 한다. GSAP는 x(px)와 xPercent를 독립적인
    // 축으로 합성하므로, 루프가 계속 도는 중에도 이 오프셋만 0으로 트윈하면 자연스럽게
    // 겹쳐진다.
    gsap.set(track, { x: window.innerWidth });

    const scrollTween = gsap.to(track, {
      xPercent: -50,
      ease: "none",
      duration: SCROLL_DURATION,
      repeat: -1,
      paused: true,
    });

    // stagger 객체 자체에 repeat/yoyo를 주면, 전체 트윈을 반복하는 대신
    // 타깃(글자/문구) 하나하나가 stagger 간격만큼 시차를 두고 각자 독립적으로
    // 영원히 왕복하는 "웨이브"가 만들어진다 — 리플로우 없는 transform(y)/
    // CSS 변수(--glow)만 움직이므로 저비용이다.
    const waveTween = gsap.to(chars, {
      y: WAVE_AMPLITUDE,
      duration: 1,
      ease: "sine.inOut",
      stagger: { each: WAVE_STEP, yoyo: true, repeat: -1 },
      paused: true,
    });

    const glowTween = gsap.to(repeats, {
      "--glow": 1,
      duration: 1.6,
      ease: "sine.inOut",
      stagger: { each: GLOW_STEP, yoyo: true, repeat: -1 },
      paused: true,
    });

    const tweens = [scrollTween, waveTween, glowTween];

    let hasEntered = false;

    // 스크롤로 화면 밖에 나가 있는 동안엔 세 트윈을 전부 멈춰서 불필요한
    // 리소스 소모를 막는다(Hero3DLogo/HeroEmbers/Footer와 같은 원칙). 스크롤
    // 입력 자체에 반응해서 움직이는 게 아니라, 화면에 들어오는 시점에 맞춰
    // 자동으로(사용자의 스크롤 동작과 무관하게) 화면 밖에서 흘러들어와 계속
    // 흐르게 한다.
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) {
        tweens.forEach((t) => t.pause());
        return;
      }
      if (!hasEntered) {
        hasEntered = true;
        gsap.to(track, {
          x: 0,
          duration: 1.4,
          ease: "power3.out",
          onComplete: () => tweens.forEach((t) => t.play()),
        });
        return;
      }
      tweens.forEach((t) => t.play());
    });
    observer.observe(section);

    return () => {
      observer.disconnect();
      tweens.forEach((t) => t.kill());
    };
  }, [text]);

  return (
    <section
      ref={sectionRef}
      className="work-together overflow-hidden w-full py-[120px] max-lg:py-[90px] max-sm:py-[60px]"
    >
      <div ref={trackRef} className="flex w-max shrink-0 items-center will-change-transform">
        <WorkTogetherSet text={text} />
        <WorkTogetherSet text={text} ariaHidden />
      </div>
    </section>
  );
}

function WorkTogetherSet({ text, ariaHidden }: { text: string; ariaHidden?: boolean }) {
  const words = text.split(" ");

  return (
    <div className="flex shrink-0 items-center" aria-hidden={ariaHidden ? "true" : undefined}>
      {Array.from({ length: REPEAT }).map((_, r) => (
        <span
          key={r}
          className="work-together-text inline-block whitespace-nowrap font-en font-bold leading-[1.05] text-white text-[clamp(80px,10vw,180px)] pr-[0.6em] max-sm:text-[clamp(48px,14vw,96px)]"
        >
          {words.map((word, wi) => (
            // 공백을 word-span "안쪽" 마지막 글자로 두면, inline-block은 그 자체로
            // 새 라인박스를 만들어서 CSS가 라인 끝 공백을 트리밍해버려(줄바꿈
            // 규칙과 동일) 단어가 옆 단어에 붙어버린다. word-span 바깥의 형제
            // 텍스트 노드로 빼야 트리밍 대상이 아닌 "라인 중간" 공백이 된다.
            <Fragment key={wi}>
              <span className="inline-block whitespace-nowrap">
                {Array.from(word).map((ch, ci) => (
                  <span key={ci} className="wt-char inline-block">
                    {ch}
                  </span>
                ))}
              </span>
              {wi < words.length - 1 ? " " : ""}
            </Fragment>
          ))}
        </span>
      ))}
    </div>
  );
}
