import { useEffect, useRef, useState } from "react";
import visualImg from "../../assets/visual-img.jpg";

const SESSION_KEY = "intro-shown";
/** exit 시작과 동시에 콘텐츠(링/텍스트/바)가 먼저 빠르게 사라지는 데 걸리는 시간. */
const CONTENT_FADE_MS = 350;
/** 콘텐츠가 사라지기 시작한 뒤, 위/아래 검정 패널이 열리기까지의 약간의 겹침 딜레이. */
const PANEL_DELAY_MS = 150;
/** 위/아래 패널이 각각 위·아래로 완전히 열리는 데 걸리는 시간. */
const PANEL_MS = 750;
/** 언마운트까지 기다리는 전체 exit 시간 = 패널이 움직이기 시작하는 시점 + 패널 이동 시간. */
const EXIT_MS = PANEL_DELAY_MS + PANEL_MS;
/** 진행률이 100%에 도달한 뒤 링/바가 다 찬 상태를 눈으로 확인할 짧은 여유 시간. */
const COMPLETE_HOLD_MS = 450;
/** 표시되는 progress를 실제 target으로 매 프레임 얼마나 빠르게 수렴시킬지(0~1). */
const PROGRESS_LERP = 0.1;
/**
 * 실제 에셋(작은 히어로 이미지 + 웹폰트)은 캐시 히트 시 200ms 안에 끝나버려서, 그대로
 * 두면 progress가 순식간에 100%를 찍고 나머지 시간엔 그냥 가만히 서 있기만 해 "너무
 * 빨리 지나간다"는 인상을 준다. 그래서 실제 로딩 완료 여부와 별개로, 화면에 보이는
 * progress는 이 시간(PACE_MS) 동안 서서히 0->96%까지 차오르도록 시간 기준으로 페이싱하고,
 * 96->100% 마무리는 "실제로 에셋이 준비됐고" "최소 노출 시간(MIN_VISIBLE_MS)도 지났을 때"
 * 에만 허용한다 — 실제 로딩이 이보다 오래 걸리면 96%에서 자연스럽게 기다린다.
 */
const PACE_MS = 2200;
const MIN_VISIBLE_MS = 2400;
const PACE_CAP = 96;

/** Home 히어로에 실제로 쓰이는, 프리로더가 끝나는 순간 바로 보여야 하는 이미지. */
const PRELOAD_IMAGES = [visualImg];

function alreadyShown() {
  try {
    return sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

function markShown() {
  try {
    sessionStorage.setItem(SESSION_KEY, "1");
  } catch {
    // sessionStorage unavailable (e.g. privacy mode) — just skip persisting
  }
}

function loadImage(src: string) {
  return new Promise<void>((resolve) => {
    const img = new Image();
    img.onload = () => resolve();
    // 이미지 하나가 실패해도 나머지 로딩 진행/인트로 종료를 막지 않는다.
    img.onerror = () => resolve();
    img.src = src;
  });
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

/** 이름 텍스트를 단어 단위로 쪼개서, 글자마다 등장 딜레이를 다르게 줘 웨이브처럼 보이게 한다. */
const NAME_WORDS = "SHIN MIN SEOK".split(" ");
const LETTER_STAGGER_MS = 45;
/** 등장 애니메이션 지속시간 — 아래 글자별 idle wave의 시작 딜레이 계산에도 사용된다. */
const LETTER_IN_MS = 600;

export default function Preloader() {
  const [visible, setVisible] = useState(() => {
    if (alreadyShown()) return false;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      markShown();
      return false;
    }
    return true;
  });
  const [exiting, setExiting] = useState(false);
  const [progress, setProgress] = useState(0);
  const assetsReadyRef = useRef(false);
  const mountedAtRef = useRef(0);

  if (mountedAtRef.current === 0) {
    mountedAtRef.current = Date.now();
  }

  useEffect(() => {
    if (!visible) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [visible]);

  // 실제 에셋(히어로 이미지 + 웹폰트) 로딩 완료 여부만 추적한다. 화면에 보이는 progress는
  // 아래 rAF 페이싱 루프가 만들고, 이 ref는 그 루프가 96%를 넘어 100%로 마무리해도 되는지
  // 판단하는 게이트로만 쓰인다.
  useEffect(() => {
    if (!visible) return;

    const tasks: Promise<void>[] = [
      ...PRELOAD_IMAGES.map(loadImage),
      document.fonts ? document.fonts.ready.then(() => undefined) : Promise.resolve(),
    ];

    Promise.all(tasks).then(() => {
      assetsReadyRef.current = true;
    });
  }, [visible]);

  // 화면에 보이는 progress를 매 프레임 갱신하는 페이싱 루프.
  // 1) 항상 시간 기준으로 0 -> PACE_CAP(96%)까지 ease-out으로 서서히 채운다(실제 로딩
  //    속도와 무관 — 순식간에 끝나는 로딩도 "천천히, 묵직하게" 보이도록).
  // 2) 에셋이 실제로 준비됐고 + 최소 노출 시간도 지났을 때만 96%를 넘어 100%로 마무리한다.
  useEffect(() => {
    if (!visible) return;
    let raf: number;
    const tick = () => {
      setProgress((p) => {
        const elapsed = Date.now() - mountedAtRef.current;
        const canComplete = assetsReadyRef.current && elapsed >= MIN_VISIBLE_MS;

        if (canComplete) {
          const remaining = 100 - p;
          return remaining < 0.4 ? 100 : p + remaining * PROGRESS_LERP;
        }

        const paced = easeOutCubic(Math.min(elapsed / PACE_MS, 1)) * PACE_CAP;
        const cap = Math.max(paced, p); // 절대 뒤로 가지 않는다
        return p + (cap - p) * PROGRESS_LERP;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [visible]);

  useEffect(() => {
    if (!visible || exiting || progress < 100) return;
    const holdTimer = window.setTimeout(() => {
      markShown();
      setExiting(true);
    }, COMPLETE_HOLD_MS);
    return () => window.clearTimeout(holdTimer);
  }, [progress, visible, exiting]);

  useEffect(() => {
    if (!exiting) return;
    const exitTimer = window.setTimeout(() => setVisible(false), EXIT_MS);
    return () => window.clearTimeout(exitTimer);
  }, [exiting]);

  if (!visible) return null;

  const RADIUS = 26;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const dashOffset = CIRCUMFERENCE * (1 - progress / 100);

  let letterIndex = 0;

  return (
    <div className="fixed inset-0 z-[999] pointer-events-none" aria-hidden="true">
      {/* 위쪽 패널: exit 시 위로 열리며 사라진다. 콘텐츠보다 먼저 그려서(DOM 순서상 아래 레이어)
          콘텐츠가 항상 그 위에 보이게 한다 — 안 그러면 패널이 콘텐츠를 통째로 가려버린다. */}
      <div
        className={[
          "absolute top-0 left-0 w-full h-1/2 bg-[#000]",
          "transition-transform ease-[cubic-bezier(0.76,0,0.24,1)]",
          exiting ? "-translate-y-full" : "translate-y-0",
        ].join(" ")}
        style={{
          transitionDuration: `${PANEL_MS}ms`,
          transitionDelay: exiting ? `${PANEL_DELAY_MS}ms` : "0ms",
        }}
      />

      {/* 아래쪽 패널: exit 시 아래로 열리며 사라진다 */}
      <div
        className={[
          "absolute bottom-0 left-0 w-full h-1/2 bg-[#000]",
          "transition-transform ease-[cubic-bezier(0.76,0,0.24,1)]",
          exiting ? "translate-y-full" : "translate-y-0",
        ].join(" ")}
        style={{
          transitionDuration: `${PANEL_MS}ms`,
          transitionDelay: exiting ? `${PANEL_DELAY_MS}ms` : "0ms",
        }}
      />

      {/* 콘텐츠(링/라벨/이름/바): exit 시작 시 패널이 열리기 전에 먼저 빠르게 사라진다 */}
      <div
        className={[
          "absolute inset-0 transition-[opacity,transform] ease-out",
          exiting ? "opacity-0 scale-95" : "opacity-100 scale-100",
        ].join(" ")}
        style={{ transitionDuration: `${CONTENT_FADE_MS}ms` }}
      >
        {/* 좌상단: 진행률만큼 채워지며 동시에 계속 도는 원형 링 — 채워짐 + 회전이 겹쳐 더 역동적으로 보인다 */}
        <svg
          width="64"
          height="64"
          viewBox="0 0 64 64"
          className="absolute left-8 top-8 max-sm:left-5 max-sm:top-5 animate-[spin_3s_linear_infinite]"
        >
          <circle cx="32" cy="32" r={RADIUS} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
          <circle
            cx="32"
            cy="32"
            r={RADIUS}
            fill="none"
            stroke="#fff"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            transform="rotate(-90 32 32)"
          />
        </svg>

        {/* 좌하단: LOADING 라벨 */}
        <p className="absolute left-8 bottom-8 max-sm:left-5 max-sm:bottom-5 font-mono text-xs tracking-[0.2em] text-white/70">
          LOADING...
        </p>

        {/* 우하단: 진행률 숫자 카운터 — 좌하단 LOADING 라벨과 대칭을 이루며 빈 공간을 채운다 */}
        <p className="absolute right-8 bottom-8 max-sm:right-5 max-sm:bottom-5 font-mono text-sm font-bold tracking-[0.15em] text-white tabular-nums">
          {String(Math.round(progress)).padStart(3, "0")}%
        </p>

        {/* 화면 세로 중앙: 카피 텍스트가 마스크 안에서 자연스럽게 올라오며 등장한 뒤, 그 아래로
            굵고 긴 progress bar가 좌우 끝까지 뻗는다 */}
        <div className="absolute left-8 right-8 top-1/2 -translate-y-1/2 max-sm:left-5 max-sm:right-5">
          <div className="overflow-hidden mb-3">
            <p
              className="font-en text-xs tracking-[0.35em] text-white/50 opacity-0 [animation:intro-line-in_0.8s_ease_forwards]"
              style={{ animationDelay: "150ms" }}
            >
              (PORTFOLIO)
            </p>
          </div>
          {/* 이름: 글자 단위로 딜레이를 주며 등장(웨이브처럼 순서대로 떠오름) → 자리를 잡은 뒤에는
              각 글자가 계속 낮은 진폭으로 위아래 웨이브를 탄다 */}
          <h1 className="font-en text-[64px] leading-[1.4] tracking-tight font-bold text-white md:text-[104px] max-sm:text-[38px] mb-8 max-sm:mb-6 flex flex-wrap gap-x-[0.22em]">
            {NAME_WORDS.map((word, wi) => (
              <span key={wi} className="inline-flex">
                {word.split("").map((ch, ci) => {
                  const delay = 450 + letterIndex * LETTER_STAGGER_MS;
                  letterIndex += 1;
                  return (
                    <span
                      key={ci}
                      className="inline-block opacity-0 [animation:intro-line-in_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]"
                      style={{ animationDelay: `${delay}ms` }}
                    >
                      <span
                        className="inline-block [animation:intro-wave_2.4s_ease-in-out_infinite]"
                        style={{ animationDelay: `${delay + LETTER_IN_MS}ms` }}
                      >
                        {ch}
                      </span>
                    </span>
                  );
                })}
              </span>
            ))}
          </h1>
          <div className="h-3 max-sm:h-2 bg-white/10 overflow-hidden">
            <div className="h-full bg-white" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}
