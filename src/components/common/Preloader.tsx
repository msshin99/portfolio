import { useEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion } from "../../lib/gsap";

interface PreloaderProps {
  /** 캔버스 애니메이션 중간에 살짝 페이드인/아웃되는 서브 문구. 나중에 바꿀 수 있도록
   *  prop으로 분리해뒀다 — 안 넘기면 아래 기본 문구를 쓴다. */
  subtitle?: string;
}

const SESSION_KEY = "introPlayed";
const DEFAULT_SUBTITLE = "out of infinite possibilities, i chose this one.";
const TEXT = "MSSHIN";

/** 캔버스 배경/파티클 색 — 이 사이트에 라이트/다크 두 팔레트를 오가는 토글은 없고
 *  (Header/Footer의 "sub" 테마는 페이지별 고정 배색일 뿐 사용자가 전환하는 다크모드가
 *  아니다), 인트로는 항상 이 흑백 컨셉 하나로 고정해서 보여준다. Footer의 하프톤
 *  웨이브에 쓴 것과 같은 따뜻한 오프화이트(#e9e6dd)를 파티클 색으로 재사용해 인트로와
 *  이후 콘텐츠의 톤을 은근히 이어지게 했다. */
const BG_COLOR = "#050505";
const PARTICLE_COLOR = "#e9e6dd";

interface IntroTiming {
  /** 파티클 하나가 글자 모양으로 모이는 데 걸리는 시간(초) */
  gatherDuration: number;
  /** 파티클마다 gather 시작 전에 랜덤하게 주는 최대 지연(초) — 이게 stagger 역할을 한다 */
  gatherStaggerMax: number;
  /** 글자 모양을 완성한 채로 잠깐 정지하는 시간(초) */
  holdDuration: number;
  /** 그리드로 재배열되는 데 걸리는 시간(초) */
  rearrangeDuration: number;
  rearrangeStaggerMax: number;
  /** 그리드가 다 모인 뒤, 구멍 뚫기 연출이 시작되기 전 짧은 정지(초) */
  gridHoldDuration: number;
  /** 파티클 하나가 커지며 구멍을 뚫어 화면 전체를 덮는 데 걸리는 시간(초) */
  holeDuration: number;
  /** 구멍이 다 덮인 뒤 캔버스 오버레이 전체가 페이드아웃되는 시간(초) */
  fadeOutDuration: number;
  subtitleDelay: number;
  subtitleFadeDuration: number;
  subtitleHold: number;
}

/** 첫 방문(first)과 같은 세션 안에서의 재방문/새로고침(returning)의 타이밍을 하나의
 *  설정 객체로 분리해서 관리한다 — returning은 대략 절반 속도로 재생된다.
 *  처음엔 전체적으로 지속시간이 짧아서(특히 holdDuration) "MSSHIN" 글자가 채 눈에
 *  들어오기도 전에 그리드로 흩어져버리고, 각 단계 전환도 급하게 느껴졌다 — gather/
 *  rearrange/hole 지속시간을 늘리고, 특히 글자 모양을 유지하는 holdDuration을 크게
 *  늘려 실제로 "MSSHIN"을 읽을 시간을 준다. */
const TIMINGS: Record<"first" | "returning", IntroTiming> = {
  first: {
    gatherDuration: 1.95,
    gatherStaggerMax: 1.15,
    holdDuration: 2.3,
    rearrangeDuration: 1.75,
    rearrangeStaggerMax: 1.05,
    gridHoldDuration: 0.75,
    holeDuration: 2.1,
    fadeOutDuration: 1.2,
    subtitleDelay: 2.4,
    subtitleFadeDuration: 0.7,
    subtitleHold: 1.6,
  },
  returning: {
    gatherDuration: 0.98,
    gatherStaggerMax: 0.58,
    holdDuration: 1.15,
    rearrangeDuration: 0.88,
    rearrangeStaggerMax: 0.53,
    gridHoldDuration: 0.38,
    holeDuration: 1.05,
    fadeOutDuration: 0.6,
    subtitleDelay: 1.2,
    subtitleFadeDuration: 0.35,
    subtitleHold: 0.8,
  },
};

function alreadyPlayed() {
  try {
    return sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

function markPlayed() {
  try {
    sessionStorage.setItem(SESSION_KEY, "1");
  } catch {
    // sessionStorage unavailable (e.g. privacy mode) — just skip persisting
  }
}

/** hardwareConcurrency/deviceMemory 둘 다 표준이 아니거나(구형 Safari) 브라우저마다
 *  지원이 갈리는 값이라, 존재하지 않으면 "저사양 아님"으로 관대하게 취급한다 — 잘못
 *  건너뛰는 것보다 잘못 재생하는 쪽이 안전하다. */
function isLowEndDevice() {
  if (typeof navigator === "undefined") return false;
  const cores = navigator.hardwareConcurrency ?? 8;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
  return cores <= 2 || memory <= 2;
}

function getParticleCount(width: number) {
  if (width <= 600) return 80;
  if (width <= 1024) return 140;
  return 320;
}

interface Point {
  x: number;
  y: number;
}

/** "MSSHIN" 텍스트를 오프스크린 캔버스에 그린 뒤, 각 글자 획의 윤곽선을 따라 좌표를
 *  뽑는다.
 *
 *  두 가지 시행착오를 거쳤다: (1) 촘촘한 step으로 후보를 잔뜩 모은 뒤 무작위로
 *  targetCount개를 뽑으면 두꺼운 면엔 우연히 몰리고 가는 획엔 우연히 비어 얼룩덜룩
 *  했다. (2) 그래서 획 내부를 꽉 채우는 균일 격자로 바꿨더니, 이번엔 "800" 굵기
 *  글자가 그냥 뭉뚱그려진 사각 블록처럼 보여 오히려 덜 읽혔다. 최종적으로는 획의
 *  내부가 아니라 윤곽선(안쪽/바깥쪽 경계)만 따라 점을 찍는 방식으로 정착했다 — 같은
 *  개수라도 실루엣이 훨씬 또렷하게 드러난다. 격자 step은 이분 탐색으로 targetCount에
 *  가장 가까운 값을 찾는다. */
interface TextPointsResult {
  points: Point[];
  /** 글자 실루엣의 가장 아래쪽 y좌표(캔버스/CSS px 기준) — 서브 문구를 이 아래
   *  정확히 30px 지점에 배치하는 데 쓴다. */
  textBottom: number;
}

function buildTextPoints(text: string, width: number, height: number, targetCount: number): TextPointsResult {
  const off = document.createElement("canvas");
  off.width = width;
  off.height = height;
  const octx = off.getContext("2d");
  if (!octx) return { points: [], textBottom: height / 2 };

  octx.clearRect(0, 0, width, height);
  octx.fillStyle = "#fff";
  octx.textAlign = "center";
  octx.textBaseline = "middle";

  let fontSize = height * 0.55;
  octx.font = `800 ${fontSize}px Inter, sans-serif`;
  const maxWidth = width * 0.86;
  let measured = octx.measureText(text);
  if (measured.width > maxWidth) {
    fontSize *= maxWidth / measured.width;
    octx.font = `800 ${fontSize}px Inter, sans-serif`;
    measured = octx.measureText(text);
  }
  const textBottom = height / 2 + (measured.actualBoundingBoxDescent || fontSize * 0.22);
  octx.fillText(text, width / 2, height / 2);

  const { data } = octx.getImageData(0, 0, width, height);
  const ALPHA_THRESHOLD = 120;
  const isSolid = (x: number, y: number) => {
    if (x < 0 || x >= width || y < 0 || y >= height) return false;
    return data[(y * width + x) * 4 + 3] > ALPHA_THRESHOLD;
  };

  // 획 내부를 꽉 채우면(=alpha>threshold인 픽셀을 전부 격자로 쓰면) 두꺼운 "800" 굵기
  // 글자는 그냥 뭉뚱그려진 사각 블록처럼 보여서 오히려 덜 읽힌다 — 대신 각 글자의
  // 윤곽선(안쪽/바깥쪽 경계)만 따라 점을 찍으면, 같은 개수로도 획의 형태가 훨씬
  // 또렷하게 드러난다(고전적인 파티클 텍스트 효과가 쓰는 방식).
  const collectAtStep = (step: number): Point[] => {
    const pts: Point[] = [];
    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        if (!isSolid(x, y)) continue;
        const isEdge =
          !isSolid(x + step, y) || !isSolid(x - step, y) || !isSolid(x, y + step) || !isSolid(x, y - step);
        if (isEdge) pts.push({ x, y });
      }
    }
    return pts;
  };

  // step이 작을수록(격자가 촘촘할수록) 점 개수가 많아진다 — 이분 탐색으로 targetCount에
  // 가장 가까운 step을 찾는다.
  let lo = 1;
  let hi = Math.max(2, Math.round(Math.min(width, height) / 3));
  let best = collectAtStep(Math.max(1, Math.round(Math.min(width, height) / 60)));
  for (let i = 0; i < 18; i++) {
    const step = Math.max(1, Math.round((lo + hi) / 2));
    const pts = collectAtStep(step);
    if (pts.length === 0) {
      hi = step;
      continue;
    }
    best = pts;
    if (pts.length > targetCount) lo = step + 1;
    else hi = step;
    if (Math.abs(pts.length - targetCount) <= Math.max(2, targetCount * 0.03)) break;
    if (lo >= hi) break;
  }

  return { points: sampleN(best, targetCount), textBottom };
}

function sampleN<T>(arr: T[], n: number): T[] {
  if (arr.length === 0) return [];
  if (arr.length <= n) {
    // 후보 픽셀이 목표 개수보다 적으면(아주 작은 화면 등) 부족분은 무작위로 다시 뽑아
    // 채운다 — 같은 자리에 파티클이 살짝 겹치는 정도는 눈에 띄지 않는다.
    const out = [...arr];
    while (out.length < n) out.push(arr[Math.floor(Math.random() * arr.length)]);
    return out;
  }
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

/** 파티클 개수만큼 정사각형에 가까운 그리드 좌표를 화면 중앙에 배치한다. */
function buildGridPoints(count: number, width: number, height: number): Point[] {
  const cols = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);
  const size = Math.min(width, height) * 0.55;
  const cell = size / Math.max(cols, rows);
  const gridW = cell * cols;
  const gridH = cell * rows;
  const offsetX = (width - gridW) / 2 + cell / 2;
  const offsetY = (height - gridH) / 2 + cell / 2;
  const points: Point[] = [];
  for (let i = 0; i < count; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    points.push({ x: offsetX + col * cell, y: offsetY + row * cell });
  }
  return points;
}

/** 파티클의 시작 위치 — 화면 네 변 중 하나를 골라 그 바깥쪽 화면 밖 어딘가에 둔다. */
function randomOffscreenPoint(width: number, height: number): Point {
  const edge = Math.floor(Math.random() * 4);
  const pad = 60;
  switch (edge) {
    case 0:
      return { x: Math.random() * width, y: -pad - Math.random() * height * 0.6 };
    case 1:
      return { x: width + pad + Math.random() * width * 0.6, y: Math.random() * height };
    case 2:
      return { x: Math.random() * width, y: height + pad + Math.random() * height * 0.6 };
    default:
      return { x: -pad - Math.random() * width * 0.6, y: Math.random() * height };
  }
}

interface Particle extends Point {
  textX: number;
  textY: number;
  gridX: number;
  gridY: number;
  radius: number;
}

function setupCanvas(canvas: HTMLCanvasElement, width: number, height: number) {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  const ctx = canvas.getContext("2d");
  ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

export default function Preloader({ subtitle = DEFAULT_SUBTITLE }: PreloaderProps) {
  const [visible, setVisible] = useState(() => {
    if (prefersReducedMotion() || isLowEndDevice()) {
      markPlayed();
      return false;
    }
    return true;
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (!visible) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const subtitleEl = subtitleRef.current;
    if (!canvas || !container) return;

    let cancelled = false;
    const master = gsap.timeline();
    let subtitleTl: gsap.core.Timeline | undefined;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const ctx = setupCanvas(canvas, width, height);
    if (!ctx) return;

    const mode: "first" | "returning" = alreadyPlayed() ? "returning" : "first";
    const timing = TIMINGS[mode];

    const finish = () => {
      markPlayed();
      setVisible(false);
    };

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = BG_COLOR;
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = PARTICLE_COLOR;
      for (const p of particles) {
        if (p === heroParticle && holeState.active) continue;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      if (holeState.active) {
        // 원형 clip으로 딱 잘라 지우면 경계가 칼로 벤 듯 또렷해서, 실제 히어로
        // 이미지가 이미 다 그려진 채로 갑자기 "뙇" 나타나는 것처럼 보였다(= 너무
        // 급하게 전환되는 느낌의 핵심 원인). 대신 중심은 완전히 지우고 가장자리로
        // 갈수록 옅어지는 방사형 그라디언트를 destination-out으로 겹쳐 그려서,
        // 딱딱한 원이 아니라 안개가 걷히듯 부드럽게 번져 사라지게 한다.
        const r = heroParticle.radius;
        const gradient = ctx.createRadialGradient(
          heroParticle.x,
          heroParticle.y,
          Math.max(0, r * 0.35),
          heroParticle.x,
          heroParticle.y,
          r
        );
        gradient.addColorStop(0, "rgba(0,0,0,1)");
        gradient.addColorStop(1, "rgba(0,0,0,0)");
        ctx.save();
        ctx.globalCompositeOperation = "destination-out";
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(heroParticle.x, heroParticle.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 구멍이 뚫리는 그 순간 히어로 이미지 쪽으로 확 밝아졌다 잦아드는 빛
        // 번짐을 겹쳐 그려서, 그냥 사라지는 게 아니라 "빵 터지며 드러나는"
        // 임팩트를 준다. destination-out 지우기 다음(=이미 드러난 실제 콘텐츠
        // 위)에 그려서, 새로 드러난 화면 위로 빛이 스치듯 보이게 한다.
        if (flashState.opacity > 0.002) {
          // 구멍 반지름(r)은 화면 전체를 덮을 때까지 계속 커지지만, 이 빛 번짐은
          // 거기 얽매이지 않고 항상 같은 크기로 반짝인다 — "번지는 구멍"이 아니라
          // "그 자리에서 한 번 터지는 빛"으로 보여야 임팩트가 산다.
          const burstR = Math.min(width, height) * 0.22;
          const burst = ctx.createRadialGradient(
            heroParticle.x,
            heroParticle.y,
            0,
            heroParticle.x,
            heroParticle.y,
            burstR
          );
          burst.addColorStop(0, `rgba(255,255,255,${flashState.opacity})`);
          burst.addColorStop(1, "rgba(255,255,255,0)");
          ctx.fillStyle = burst;
          ctx.beginPath();
          ctx.arc(heroParticle.x, heroParticle.y, burstR, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    // 실제 로드된 굵은 웨이트로 텍스트 파티클 모양을 뽑아야 폰트 대체(fallback)로 인해
    // 글자 형태가 어긋나지 않는다 — Inter 800이 준비될 때까지 기다린 뒤 세팅한다.
    let particles: Particle[] = [];
    let heroParticle: Particle;
    const holeState = { active: false };
    const flashState = { opacity: 0 };

    const setupAndPlay = () => {
      if (cancelled) return;
      const count = getParticleCount(width);
      const { points: textPoints, textBottom } = buildTextPoints(TEXT, width, height, count);
      const gridPoints = buildGridPoints(count, width, height);

      // 서브 문구를 퍼센트 기반 고정 위치가 아니라, 실제로 그려진 "MSSHIN" 글자
      // 실루엣 바로 아래 30px 지점에 둔다.
      if (subtitleEl) {
        subtitleEl.style.top = `${textBottom + 30}px`;
        subtitleEl.style.transform = "translateX(-50%)";
      }

      particles = textPoints.map((tp, i) => {
        const start = randomOffscreenPoint(width, height);
        const gp = gridPoints[i];
        return {
          x: start.x,
          y: start.y,
          textX: tp.x,
          textY: tp.y,
          gridX: gp.x,
          gridY: gp.y,
          // 글자를 이루는 점 하나하나가 눈에 잘 띄어야 "MSSHIN"이 읽힌다 — 기존
          // 1.4~2.4px는 촘촘한 화면에서 너무 옅어 보였다.
          radius: 1.9 + Math.random() * 1.3,
        };
      });

      // 구멍을 뚫을 파티클 = 그리드 중심에 가장 가까운 파티클
      heroParticle = particles.reduce((closest, p) => {
        const d = Math.hypot(p.gridX - width / 2, p.gridY - height / 2);
        const dc = Math.hypot(closest.gridX - width / 2, closest.gridY - height / 2);
        return d < dc ? p : closest;
      }, particles[0]);

      gsap.ticker.add(render);

      // Phase 1: 화면 밖 -> 글자 모양으로 모임 (파티클마다 랜덤 stagger)
      particles.forEach((p) => {
        master.to(
          p,
          { x: p.textX, y: p.textY, duration: timing.gatherDuration, ease: "particleEase" },
          Math.random() * timing.gatherStaggerMax
        );
      });
      const phase1End = timing.gatherStaggerMax + timing.gatherDuration;
      const holdEnd = phase1End + timing.holdDuration;

      // Phase 2: 잠깐 정지 후 -> 정사각형 그리드로 재배열
      particles.forEach((p) => {
        master.to(
          p,
          { x: p.gridX, y: p.gridY, duration: timing.rearrangeDuration, ease: "particleEase" },
          holdEnd + Math.random() * timing.rearrangeStaggerMax
        );
      });
      const phase2End = holdEnd + timing.rearrangeStaggerMax + timing.rearrangeDuration;
      const gridHoldEnd = phase2End + timing.gridHoldDuration;

      // Phase 3: 그리드가 다 모이면, 중심 파티클 하나가 커지면서 원형으로 화면을 지운다
      const holeRadiusTarget = Math.hypot(width, height);
      master.call(() => {
        holeState.active = true;
      }, [], gridHoldEnd);
      master.to(
        heroParticle,
        { radius: holeRadiusTarget, duration: timing.holeDuration, ease: "particleEase" },
        gridHoldEnd
      );
      // 구멍이 뚫리기 시작하는 바로 그 순간 확 밝아졌다(0.16s) 천천히 잦아드는(0.85s)
      // 빛 번짐 — "서서히 사라짐"만 있던 전환에 한 박자의 임팩트를 더한다.
      master.fromTo(
        flashState,
        { opacity: 0 },
        { opacity: 1, duration: 0.16, ease: "power2.out" },
        gridHoldEnd
      );
      master.to(flashState, { opacity: 0, duration: 0.85, ease: "power2.out" }, gridHoldEnd + 0.16);
      const holeEnd = gridHoldEnd + timing.holeDuration;

      // Phase 4: 캔버스 오버레이 전체 페이드아웃 -> 스크롤 해제 + 언마운트
      // 구멍이 다 자란 뒤(holeEnd)에야 페이드를 시작하면 "구멍 다 뚫림 -> 그제서야
      // 페이드"로 두 단계가 끊어져 보인다. 구멍이 자라는 도중(40% 지점)부터 전체
      // 페이드를 겹쳐 시작해서, 부분적으로 옅어진 캔버스 위로 안개가 걷히듯 하나의
      // 흐름으로 이어지게 한다.
      const fadeStart = gridHoldEnd + timing.holeDuration * 0.4;
      master.to(container, { opacity: 0, duration: timing.fadeOutDuration, ease: "power1.inOut" }, fadeStart);
      master.call(finish, [], Math.max(holeEnd, fadeStart + timing.fadeOutDuration));

      // 서브 문구 페이드인 -> 유지 -> 페이드아웃 (별도 타임라인)
      if (subtitleEl) {
        subtitleTl = gsap.timeline();
        subtitleTl
          .to(subtitleEl, { opacity: 1, duration: timing.subtitleFadeDuration, ease: "power2.out" }, timing.subtitleDelay)
          .to(
            subtitleEl,
            { opacity: 0, duration: timing.subtitleFadeDuration, ease: "power2.in" },
            timing.subtitleDelay + timing.subtitleFadeDuration + timing.subtitleHold
          );
      }
    };

    if (document.fonts) {
      document.fonts
        .load(`800 100px Inter`)
        .catch(() => undefined)
        .then(setupAndPlay);
    } else {
      setupAndPlay();
    }

    return () => {
      cancelled = true;
      gsap.ticker.remove(render);
      master.kill();
      subtitleTl?.kill();
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div ref={containerRef} className="fixed inset-0 z-[999] pointer-events-none" aria-hidden="true">
      <canvas ref={canvasRef} className="block h-full w-full" />
      {/* top은 JS에서 실제로 그려진 "MSSHIN" 글자 실루엣의 최하단 + 30px로 정확히
          맞춘다(setupAndPlay 참고) — top-1/2는 그 계산이 끝나기 전까지의 안전한
          기본값일 뿐이고, opacity-0이라 어차피 보이지 않는다. */}
      <p
        ref={subtitleRef}
        className="absolute left-1/2 top-1/2 whitespace-nowrap font-en text-sm tracking-[0.08em] text-white/70 opacity-0 max-sm:text-xs"
      >
        {subtitle}
      </p>
    </div>
  );
}
