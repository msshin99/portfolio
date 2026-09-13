import { useEffect, useRef } from "react";

/** 화면에 동시에 떠 있는 임버(불티) 개수 — 너무 많으면 산만해지고 프레임도
 *  깎아먹으므로, 위스키 잔 위로 드문드문 피어오르는 정도로 제한한다. */
const EMBER_COUNT = 46;
/** 위로 떠오르는 속도 범위(px/s). */
const SPEED_MIN = 14;
const SPEED_MAX = 34;
/** 반지름 범위(px) — 스폰 시 속도에 비례해서 함께 정한다(빠를수록/가까이
 *  있는 것처럼 보이도록 크게), 그래서 은근한 원근감이 생긴다. */
const SIZE_MIN = 1.4;
const SIZE_MAX = 4.2;
const SWAY_AMP_MAX = 18;
/** 고해상도 화면에서도 또렷하되, 임버 개수 x 매 프레임 drawImage 비용이
 *  과하게 불어나지 않도록 DPR 상한을 둔다(3D 로고 Canvas의 dpr 상한과 같은
 *  취지). */
const MAX_DPR = 1.5;

interface Ember {
  /** 0..1, 캔버스 폭에 대한 비율 — 리사이즈돼도 좌우 분포가 흐트러지지 않는다. */
  x: number;
  /** px, 캔버스 좌표(0 = 위쪽 끝, height = 아래쪽 끝). */
  y: number;
  size: number;
  speed: number;
  swayAmp: number;
  swayFreq: number;
  swayPhase: number;
  flickerFreq: number;
  flickerPhase: number;
  baseAlpha: number;
}

function randRange(min: number, max: number) {
  return min + Math.random() * (max - min);
}

/** 새 임버 하나를 스폰한다. 처음 채울 때(seedAnywhere)는 화면 전체에 고르게
 *  흩어놓고, 이후 재활용될 때는 항상 화면 아래에서 다시 떠오르게 한다. */
function spawnEmber(height: number, seedAnywhere: boolean): Ember {
  const speed = randRange(SPEED_MIN, SPEED_MAX);
  const depth = (speed - SPEED_MIN) / (SPEED_MAX - SPEED_MIN); // 0=멀리, 1=가까이
  return {
    x: Math.random(),
    y: seedAnywhere ? Math.random() * height : height + randRange(0, 40),
    size: SIZE_MIN + depth * (SIZE_MAX - SIZE_MIN),
    speed,
    swayAmp: randRange(4, SWAY_AMP_MAX),
    swayFreq: randRange(0.3, 0.8),
    swayPhase: Math.random() * Math.PI * 2,
    flickerFreq: randRange(1.2, 2.6),
    flickerPhase: Math.random() * Math.PI * 2,
    baseAlpha: randRange(0.35, 0.85),
  };
}

/** 부드러운 원형 글로우 스프라이트를 오프스크린에 딱 한 번만 그려두고, 매
 *  프레임에는 이 비트맵을 drawImage로 찍기만 한다 — 파티클마다 매 프레임
 *  createRadialGradient를 새로 만들면(개수 × 60fps) 저사양 기기에서 부담이
 *  크다. */
function createEmberSprite(): HTMLCanvasElement {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, "rgba(255, 240, 217, 1)");
  gradient.addColorStop(0.25, "rgba(255, 205, 150, 0.9)");
  gradient.addColorStop(0.6, "rgba(230, 140, 70, 0.35)");
  gradient.addColorStop(1, "rgba(230, 140, 70, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  return canvas;
}

/** 히어로 배경 위로, 위스키 잔에서 피어오르는 불티처럼 작은 앰버 입자들이
 *  천천히 위로 떠오르며 좌우로 흔들리고 반짝인다. 텍스트/3D 로고 뒤에 깔리는
 *  순수 장식이라 pointer-events는 필요 없고, 모션 최소화 설정을 존중해 그
 *  경우 아예 그리지 않는다. */
export default function HeroEmbers() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const sprite = createEmberSprite();
    const embers: Ember[] = [];
    let width = 0;
    let height = 0;
    let rafId = 0;
    let lastTime = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      // setTransform은 누적 없이 항상 절대값으로 다시 세팅되므로, 리사이즈마다
      // scale을 덧쌓을 걱정 없이 이 한 줄이면 충분하다.
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    for (let i = 0; i < EMBER_COUNT; i++) embers.push(spawnEmber(height, true));

    // 히어로가 스크롤로 화면 밖에 나가도 이 컴포넌트 자체는 계속 마운트된
    // 채로 남아있다 — 가시성 체크 없이 requestAnimationFrame을 무조건
    // 재귀호출하면 사용자가 페이지 아래쪽에 가 있는 동안에도 46개 파티클을
    // 매 프레임 그리는 비용을 영원히 계속 지불하게 된다(체감 렉의 큰
    // 원인). IntersectionObserver로 화면에 보일 때만 루프를 돌린다.
    let visible = true;
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !rafId) {
        lastTime = 0;
        rafId = requestAnimationFrame(draw);
      }
    });
    observer.observe(canvas);

    const draw = (now: number) => {
      if (!visible) {
        rafId = 0;
        return;
      }
      // 탭이 백그라운드에 있다 돌아오는 등 프레임 간격이 비정상적으로 커지는
      // 경우, 임버가 한 프레임 만에 화면 밖까지 순간이동해버리는 걸 막는다.
      const delta = lastTime ? Math.min((now - lastTime) / 1000, 1 / 30) : 1 / 60;
      lastTime = now;
      const t = now / 1000;

      ctx.clearRect(0, 0, width, height);

      for (const ember of embers) {
        ember.y -= ember.speed * delta;
        if (ember.y < -20) {
          Object.assign(ember, spawnEmber(height, false));
          continue;
        }

        // 화면 위/아래 경계에서 뚝 끊기지 않도록, 이동 진행도(0=방금 스폰,
        // 1=화면 위 끝 도달)에 따라 부드럽게 페이드 인/아웃시키고, 그 위에
        // 잔잔한 반짝임(flicker)을 곱해 자연스러운 명멸을 만든다.
        const progress = 1 - ember.y / height;
        const fadeIn = Math.min(progress / 0.12, 1);
        const fadeOut = Math.min((1 - progress) / 0.18, 1);
        const flicker = 0.6 + 0.4 * Math.sin(t * ember.flickerFreq + ember.flickerPhase);
        const alpha = Math.max(0, ember.baseAlpha * fadeIn * fadeOut * flicker);
        if (alpha <= 0.01) continue;

        const drawX = ember.x * width + Math.sin(t * ember.swayFreq + ember.swayPhase) * ember.swayAmp;
        ctx.globalAlpha = alpha;
        const r = ember.size;
        ctx.drawImage(sprite, drawX - r, ember.y - r, r * 2, r * 2);
      }
      ctx.globalAlpha = 1;

      rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);
    window.addEventListener("resize", resize);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
      style={{ mixBlendMode: "screen" }}
      aria-hidden="true"
    />
  );
}
