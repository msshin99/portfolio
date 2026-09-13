import { useEffect, useRef } from "react";
import { gsap } from "../../lib/gsap";
import Hero3DLogo from "./Hero3DLogo";
import HeroBackdrop from "./HeroBackdrop";
import {
  DEFAULT_HERO_LABEL,
  DEFAULT_HERO_TAGLINE,
  DEFAULT_HERO_STATEMENT,
  DEFAULT_HERO_BIO,
  DEFAULT_HERO_BIO_KO,
} from "../../data/siteDefaults";

const WORDMARK = "MSSHIN";

interface HeroProps {
  /** 좌상단 짧은 라벨 — 줄바꿈(\n) 기준 두 줄. */
  label?: string;
  /** 우상단 태그라인 — 줄바꿈(\n) 기준 두 줄. */
  tagline?: string;
  /** 좌하단 굵은 스테이트먼트 — 줄바꿈(\n) 기준 두 줄. */
  statement?: string;
  /** 우하단 짧은 소개 문단(영문). readyToReveal이 true가 된 뒤로 bioKo와
   *  번갈아가며 무한 반복 전환된다. */
  bio?: string;
  /** bio의 한글 버전. bio와 번갈아가며 무한 반복 전환된다. */
  bioKo?: string;
  /** true가 되는 순간, 네 귀퉁이 텍스트와 3D 로고의 등장 애니메이션이
   *  재생되고 bio 전환 카운트다운도 시작된다. 기본값 true라 Hero를 단독으로
   *  쓰면 마운트 즉시 재생되지만, Preloader처럼 화면을 한동안 가리는 것과
   *  같이 쓸 때는 그 인트로가 실제로 콘텐츠를 드러내기 시작하는 시점
   *  (onFinish)에 이 값을 true로 넘겨야 한다 — 그렇지 않으면 등장 애니메이션도
   *  bio 전환 타이머도 프리로더 뒤에서 다 흘러버려, 사용자 눈엔 아무 일도
   *  없었던 것처럼(또는 이미 다 드러난 화면 위에서 뒤늦게 재생되는 것처럼
   *  어색하게) 보인다. */
  readyToReveal?: boolean;
}

// DEFAULT_LABEL 등 기본값 상수는 data/siteDefaults.ts로 옮겼다 — admin
// 페이지가 이 파일(Hero3DLogo의 GLB preload 부수효과를 가진)을 거치지 않고
// 기본값만 가져올 수 있어야 하기 때문이다. 하위 호환을 위해 그대로 재노출한다.
export const DEFAULT_LABEL = DEFAULT_HERO_LABEL;
export const DEFAULT_TAGLINE = DEFAULT_HERO_TAGLINE;
export const DEFAULT_STATEMENT = DEFAULT_HERO_STATEMENT;
export const DEFAULT_BIO = DEFAULT_HERO_BIO;
export const DEFAULT_BIO_KO = DEFAULT_HERO_BIO_KO;
/** 한 언어가 화면에 머무는 시간(ms) — 이 간격마다 영↔한이 번갈아 전환되며
 *  무한 반복된다. */
const BIO_SWITCH_DELAY_MS = 2000;

/** 한글 글자가 풀리기 전까지 잠깐씩 보여줄 코드 같은 글자 후보. 알파벳(A-Z)이
 *  섞여 있으면 한글이 다 드러나기 전 짧은 순간(문단이 이미 opacity:1이 된
 *  뒤로도 뒷글자들은 아직 풀리는 중이라, 그 사이에 알파벳이 언뜻 보인다)에
 *  "한글에서 영어로, 다시 다른 언어로" 계속 바뀌는 것처럼 보여서 실제
 *  버그처럼 오인되었다 — 실제 언어처럼 읽히지 않는 숫자/기호만 남긴다. */
const CODE_CHARS = "01{}<>;:=+-*#$%&/\\|~^";
/** 글자가 무작위 코드 글리프로 바뀌는 주기(ms). */
const DECODE_TICK_MS = 30;
/** 글자 하나당 인덱스(왼→오)가 늘어날 때마다 더해지는 지연 — 이 간격으로
 *  왼쪽부터 순서대로 실제 한글로 풀려난다. 값을 낮출수록 전체 해독이 빨리
 *  끝나서, 기기가 느리거나 다른 작업(3D 로고 렌더링 등)과 겹쳐 프레임이
 *  밀려도 "글자가 코드 글리프인 채로 오래 남아있는" 구간 자체가 짧아진다. */
const DECODE_STAGGER_MS = 3;
/** 마지막 글자가 풀린 뒤에도 한 번 더 여유를 두는 안전 마진(ms). */
const DECODE_SAFETY_MARGIN_MS = 100;

function randomCodeChar() {
  return CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
}

function TwoLines({ text, className }: { text: string; className?: string }) {
  return (
    <>
      {text.split("\n").map((line, i, arr) => (
        <span key={i} className={className}>
          {line}
          {i < arr.length - 1 && <br />}
        </span>
      ))}
    </>
  );
}

/** 한글 bio 전용 렌더러 — 글자 하나하나를 span으로 쪼개 ref 배열에 순서대로
 *  등록해둔다. 원래 글자는 data-ch에 보관해서, textContent를 코드 글리프로
 *  덮어썼다가도 정확히 원래 글자로 복원할 수 있게 한다. */
function DecodeLines({
  text,
  lettersRef,
}: {
  text: string;
  lettersRef: React.MutableRefObject<(HTMLSpanElement | null)[]>;
}) {
  let i = -1;
  return (
    <>
      {text.split("\n").map((line, li, arr) => (
        <span key={li}>
          {Array.from(line).map((ch) => {
            i += 1;
            const idx = i;
            const displayCh = ch === " " ? " " : ch;
            return (
              <span
                key={idx}
                ref={(el) => {
                  lettersRef.current[idx] = el;
                }}
                data-ch={displayCh}
              >
                {displayCh}
              </span>
            );
          })}
          {li < arr.length - 1 && <br />}
        </span>
      ))}
    </>
  );
}

export default function Hero({
  label = DEFAULT_LABEL,
  tagline = DEFAULT_TAGLINE,
  statement = DEFAULT_STATEMENT,
  bio = DEFAULT_BIO,
  bioKo = DEFAULT_BIO_KO,
  readyToReveal = true,
}: HeroProps) {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const logoWrapRef = useRef<HTMLDivElement | null>(null);
  const labelRef = useRef<HTMLParagraphElement | null>(null);
  const taglineRef = useRef<HTMLParagraphElement | null>(null);
  const statementRef = useRef<HTMLHeadingElement | null>(null);
  const bioRef = useRef<HTMLDivElement | null>(null);
  const bioEnRef = useRef<HTMLParagraphElement | null>(null);
  const bioKoRef = useRef<HTMLParagraphElement | null>(null);
  const bioKoLettersRef = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    // Preloader처럼 화면을 한동안 가리는 것과 같이 쓰일 때, 그게 실제로
    // 콘텐츠를 드러내기 전이면 아직 재생하지 않는다 — 안 그러면 아무도 못
    // 보는 프리로더 뒤에서 이 애니메이션이 다 끝나버리거나, 반대로 이미 다
    // 드러난 화면 위에서 뒤늦게 다시 재생되는 것처럼 어색하게 겹쳐 보인다.
    if (!readyToReveal) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const els = [labelRef.current, taglineRef.current, logoWrapRef.current, statementRef.current, bioRef.current];

    const ctx = gsap.context(() => {
      if (reduceMotion) {
        gsap.set(els, { clearProps: "all" });
        return;
      }

      // ---- 진입 애니메이션: 네 귀퉁이 텍스트가 먼저 페이드업하고, 중앙 3D 로고가
      // 살짝 늦게 스케일업하며 무게감 있게 자리잡는다 ----
      // 텍스트는 3D 로고에 호버해서 웨이브 인터랙션을 걸 때도 흔들리지 않도록,
      // 진입 애니메이션 이후에는 위치를 그대로 고정해둔다(마우스 패럴랙스 없음).
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from([labelRef.current, taglineRef.current], { opacity: 0, y: -16, duration: 0.9, stagger: 0.1 })
        .from(logoWrapRef.current, { opacity: 0, scale: 0.92, duration: 1.3, ease: "power2.out" }, "-=0.5")
        .from([statementRef.current, bioRef.current], { opacity: 0, y: 24, duration: 0.9, stagger: 0.1 }, "-=0.7");
    }, sectionRef);

    return () => ctx.revert();
  }, [readyToReveal]);

  useEffect(() => {
    // 프리로더처럼 화면을 한동안 가리는 것과 같이 쓰일 때, 그게 끝나기
    // 전이면 아직 카운트다운을 시작하지 않는다 — 안 그러면 사용자 눈엔
    // 보이지도 않는 동안 시간이 흘러버려서, 화면이 드러났을 땐 이미 전환이
    // 몇 번 지나간 것처럼 보인다(이 컴포넌트가 실제로 겪었던 버그).
    if (!readyToReveal) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion) {
      // 모션 최소화 사용자에게는 끊임없이 바뀌는 것 자체가 부담이라, 무한
      // 반복 대신 딱 한 번만 한글로 전환하고 거기서 멈춘다.
      const call = gsap.delayedCall(BIO_SWITCH_DELAY_MS / 1000, () => {
        bioKoRef.current?.setAttribute("aria-hidden", "false");
        bioEnRef.current?.setAttribute("aria-hidden", "true");
        gsap.set(bioEnRef.current, { opacity: 0 });
        gsap.set(bioKoRef.current, { opacity: 1 });
      });
      return () => call.kill();
    }

    // rAF id는 콜백 안에서 반복 생성되지만, 클린업은 effect 스코프 최상단에서
    // 접근해야 하므로 여기 선언해두고 클로저로 공유한다. 재귀적으로 스스로를
    // 다시 예약하는 gsap.delayedCall들은 killTweensOf 같은 수동 관리 대신
    // gsap.context()로 감싸서, 언마운트 시(혹은 개발 중 HMR로 이 컴포넌트가
    // 여러 번 다시 마운트될 때) ctx.revert() 한 번으로 이 스코프 안에서 만든
    // GSAP 타임라인/딜레이 콜을 전부 확실히 정리한다.
    let rafId = 0;
    let cancelled = false;
    let showingKorean = false;

    // 이 스코프 안에서 만드는 모든 GSAP 트윈/타임라인/딜레이 콜을 gsap
    // 컨텍스트로 묶어둔다 — 언마운트(혹은 개발 중 HMR 재마운트) 시
    // ctx.revert() 한 번이면, 그 시점에 진행 중이던 것까지 포함해 전부
    // 확실히 정리된다.
    const ctx = gsap.context(() => {
      // 신호가 끊기듯 짧게 흔들리다 블러 처리되며 사라지는 지지직 페이드아웃 —
      // 물러나는 쪽이 영문이든 한글이든 같은 연출을 재사용한다. 딱딱 끊기는
      // linear 대신 sine 곡선으로 오르내리고, 블러/세로 위치도 아주 살짝 함께
      // 흔들어 옛날 브라운관의 수직 동기가 흐트러지는 듯한 느낌을 낸다.
      const flickerOut = (el: HTMLElement | null) => {
      gsap
        .timeline()
        .to(el, { opacity: 0.4, y: -1, filter: "blur(1px)", duration: 0.08, ease: "sine.inOut" })
        .to(el, { opacity: 0.85, y: 0.5, filter: "blur(0px)", duration: 0.1, ease: "sine.inOut" })
        .to(el, { opacity: 0.3, y: -0.5, filter: "blur(1.5px)", duration: 0.07, ease: "sine.inOut" })
        .to(el, { opacity: 0.75, y: 0, filter: "blur(0.5px)", duration: 0.09, ease: "sine.inOut" })
        .to(el, { opacity: 0, filter: "blur(6px)", duration: 0.45, ease: "power2.inOut" });
    };

    // 한글은 코드 글리프로 지지직거리다가, 왼쪽부터 순서대로 한 글자씩 실제
    // 한글로 풀려난다 — 깜빡이는 대신 "해독되는" 흐름 자체가 눈에 보이게
    // 한다. 이전 사이클에서 이미 실제 글자로 자리 잡아 있어도, 이번 tick이
    // 첫 프레임에 다시 스크램블해서 덮어쓰므로 매번 새로 호출해도 안전하다.
    const decodeInKorean = () => {
      // 이전 사이클의 디코드 루프가(탭이 잠시 백그라운드로 가거나 기기가
      // 느려서) 아직 안 끝난 채로 다음 한글 전환이 시작되면, 두 rAF 루프가
      // 같은 글자 span들을 동시에 건드리며 서로 다른 스케줄로 덮어써서
      // 일부 글자가 코드 글리프인 채로 멈춰 보이는 문제가 생길 수 있다.
      // 새 디코드를 시작하기 전에 무조건 이전 루프를 먼저 끊어 하나만
      // 남긴다.
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
      const koLetters = bioKoLettersRef.current.filter(
        (el): el is HTMLSpanElement => !!el && el.dataset.ch !== " ",
      );
      if (koLetters.length === 0) {
        gsap.set(bioKoRef.current, { opacity: 1 });
        return;
      }

      const lockTimings = koLetters.map((_, i) => DECODE_STAGGER_MS * i);
      const totalDuration = Math.max(...lockTimings) + DECODE_SAFETY_MARGIN_MS;
      // 컨테이너가 완전히 불투명해지는 속도(예전엔 고정 0.15초)를 실제 글자
      // 해독이 끝나는 시점(totalDuration)에 맞춘다 — 안 그러면 문단이 이미 다
      // 보이는 상태로 남은 글자들만 한참 더 스크램블되는 구간이 길게
      // 남아서(특히 기기가 느리거나 다른 작업으로 프레임이 밀릴 때 더 길게
      // 늘어나 보였다), 마치 계속 깨져 보이는 것처럼 오인되었다.
      gsap.fromTo(
        bioKoRef.current,
        { opacity: 0 },
        { opacity: 1, duration: totalDuration / 1000, ease: "power1.out" },
      );

      const done = new Array<boolean>(koLetters.length).fill(false);
      let startTime = 0;
      let lastTick = 0;

      const tick = (now: number) => {
        if (!startTime) startTime = now;
        const elapsed = now - startTime;

        if (now - lastTick >= DECODE_TICK_MS) {
          lastTick = now;
          koLetters.forEach((el, i) => {
            if (done[i]) return;
            if (elapsed >= lockTimings[i]) {
              done[i] = true;
              el.textContent = el.dataset.ch ?? "";
              return;
            }
            el.textContent = randomCodeChar();
          });
        }

        if (elapsed < totalDuration) {
          rafId = requestAnimationFrame(tick);
        }
      };

      rafId = requestAnimationFrame(tick);
    };

    // 영문은 한글 같은 글자별 구조가 없어 디코딩 리빌을 쓸 수 없으므로,
    // 블러가 걷히며 페이드인되는 단순한 연출로 되돌아온다.
    const fadeInEnglish = () => {
      gsap.fromTo(
        bioEnRef.current,
        { opacity: 0, filter: "blur(6px)" },
        { opacity: 1, filter: "blur(0px)", duration: 0.5, ease: "power2.out" },
      );
    };

    // 한글 버전은 항상 영문 버전 자리 위에 절대 배치로 겹쳐둔다(JSX 참고) —
    // 두 언어의 줄 수/폭이 달라도 전환 전후로 레이아웃이 흔들리지 않는다.
    // 이 함수가 스스로를 다시 예약해서 언마운트될 때까지 영↔한 전환이
    // 끝없이 반복된다.
    const cycle = () => {
      if (cancelled) return;
      gsap.delayedCall(BIO_SWITCH_DELAY_MS / 1000, () => {
        if (showingKorean) {
          bioEnRef.current?.setAttribute("aria-hidden", "false");
          bioKoRef.current?.setAttribute("aria-hidden", "true");
          flickerOut(bioKoRef.current);
          fadeInEnglish();
        } else {
          bioKoRef.current?.setAttribute("aria-hidden", "false");
          bioEnRef.current?.setAttribute("aria-hidden", "true");
          flickerOut(bioEnRef.current);
          decodeInKorean();
        }
        showingKorean = !showingKorean;
        cycle();
      });
    };

      cycle();
    });

    return () => {
      cancelled = true;
      if (rafId) cancelAnimationFrame(rafId);
      ctx.revert();
    };
  }, [readyToReveal]);

  return (
    <div
      ref={sectionRef}
      className="visual relative flex w-full min-h-screen flex-col justify-between overflow-hidden bg-black mb-[100px]"
    >
      {/* Preloader(파티클 캔버스)가 화면을 덮고 있는 동안에도 이 컴포넌트 자체는
          이미 마운트돼 있어서, readyToReveal 여부와 무관하게 HeroBackdrop의
          파티클 캔버스와 Hero3DLogo의 WebGL(Bloom 포함) 렌더링이 그 뒤에서
          함께 돌고 있었다 — 사용자 눈엔 안 보여도 GPU/CPU는 Preloader 자신의
          캔버스까지 셋을 동시에 처리해야 해서 인트로 자체가 심각하게 느려지는
          원인이었다. readyToReveal이 true가 되는 시점(Preloader가 실제로
          화면을 드러내기 시작하는 순간)까지 이 둘을 아예 마운트하지 않는다 —
          GLB 모델은 모듈 로드 시점에 이미 preload가 시작돼 있으므로(Hero3DLogo.tsx
          상단의 useGLTF.preload) 이 시점엔 대개 이미 캐시돼 있어 지연이 거의 없다. */}
      {readyToReveal && (
        <>
          {/* 배경(블랙 & 버번 톤 그라데이션 + 빛줄기 + 그리드)은 반드시 3D 로고보다
              먼저 그려야, 투명한 캔버스 뒤로 배경이 비쳐 보인다. */}
          <HeroBackdrop />

          {/* 중앙 3D 로고 — 상/하단 텍스트와 겹쳐도 자연스럽도록 절대 배치, 클릭/포인터
              이벤트는 아래 텍스트에 방해되지 않게 통과시킨다. */}
          <div ref={logoWrapRef} role="img" aria-label={WORDMARK} className="absolute inset-0">
            <Hero3DLogo />
          </div>
        </>
      )}

      <div className="relative z-10 flex items-start justify-between px-10 pt-[150px] max-lg:px-6 max-lg:pt-[128px] max-sm:px-5 max-sm:pt-[104px]">
        <p
          ref={labelRef}
          className="font-en text-[28px] leading-[38px] text-white max-sm:text-base max-sm:leading-6"
        >
          <TwoLines text={label} />
        </p>
        <p
          ref={taglineRef}
          className="font-en text-right text-[18px] leading-6 text-white/70 max-sm:text-sm max-sm:leading-5"
        >
          <TwoLines text={tagline} />
        </p>
      </div>

      <div className="relative z-10 flex items-end justify-between gap-10 px-10 pb-16 max-lg:flex-col max-lg:items-start max-lg:gap-5 max-lg:px-6 max-lg:pb-12 max-sm:px-5 max-sm:pb-10">
        <h2
          ref={statementRef}
          className="font-en font-black uppercase leading-[1.05] tracking-tight text-white text-[110px] max-lg:text-[64px] max-sm:text-[40px]"
        >
          <TwoLines text={statement} />
        </h2>
        <div
          ref={bioRef}
          className="relative max-w-[460px] text-right max-lg:max-w-full max-lg:text-left"
        >
          {/* whitespace-pre-line이 bio/bioKo 안의 \n을 실제 줄바꿈으로
              보여주므로, TwoLines처럼 줄마다 span/br을 만들 필요가 없다. */}
          <p
            ref={bioEnRef}
            className="font-en whitespace-pre-line text-[18px] leading-[26px] text-white/70 max-sm:text-sm max-sm:leading-5"
          >
            {bio}
          </p>
          {/* 한글 버전은 영문 버전 자리 위에 절대 배치로 겹쳐둔다 — 두 언어의
              줄 수/폭이 달라도 전환 전후로 문단 높이가 흔들리지 않는다. */}
          <p
            ref={bioKoRef}
            aria-hidden="true"
            className="font-ko absolute inset-0 text-[18px] leading-[26px] text-white/70 opacity-0 max-sm:text-sm max-sm:leading-5"
          >
            <DecodeLines text={bioKo} lettersRef={bioKoLettersRef} />
          </p>
        </div>
      </div>
    </div>
  );
}
