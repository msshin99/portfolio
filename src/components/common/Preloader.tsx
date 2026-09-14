import { useEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion } from "../../lib/gsap";

interface PreloaderProps {
  /** 캔버스 애니메이션 중간에 살짝 페이드인/아웃되는 서브 문구. 나중에 바꿀 수 있도록
   *  prop으로 분리해뒀다 — 안 넘기면 아래 기본 문구를 쓴다. */
  subtitle?: string;
  /** 실제 콘텐츠가 구멍을 통해 처음 드러나기 시작하는 순간(정상 재생 중이든,
   *  모션 최소화/저사양 기기라 아예 건너뛰었든) 정확히 한 번 호출된다 —
   *  캔버스가 완전히 사라지는 훨씬 나중 시점이 아니라, 화면이 "보이기
   *  시작하는" 그 순간이다. 이 아래 깔린 Hero 등이 자신의 등장 애니메이션이나
   *  지연 타이머를 이 시점 기준으로 시작하고 싶을 때 쓴다 — 그렇게 하지
   *  않으면 프리로더에 가려진 채로 흘러버린 시간이 사용자 눈엔 아예 없었던
   *  것처럼 사라지거나, 이미 다 드러난 화면 위에서 애니메이션이 뒤늦게 다시
   *  재생되는 것처럼 어색하게 겹쳐 보인다. */
  onFinish?: () => void;
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
/** 파티클이 움직이는 동안(gather/rearrange) 화면을 완전히 지우는 대신 이 색으로
 *  옅게 겹쳐 칠해서 짧은 잔상(trail)을 만든다 — 알파가 낮을수록 꼬리가 길게 남는다. */
const BG_TRAIL_COLOR = "rgba(5,5,5,0.26)";

/** 마우스 인터랙션(밀어내기+스프링 복귀) 파라미터. 반지름 안에 들어온
 *  파티클만 밀려나고, 스프링 상수가 클수록 더 빨리·더 탱탱하게 제자리로
 *  돌아온다. */
const REPEL_RADIUS = 140;
const REPEL_STRENGTH = 2600;
const SPRING_K = 90;

/** 두 번째 형태(성긴 고리)의 반지름 비율과, 반지름을 얼마나 흐트러뜨릴지(성김
 *  정도)를 정하는 상수. */
const SCATTER_RING_RADIUS_RATIO = 0.3;
const SCATTER_RING_JITTER = 0.22;
/** 이 확률로 훨씬 멀리 떨어진 "이탈" 점을 하나씩 섞어서, 고리 바깥으로
 *  드문드문 흩어진 참고 이미지 특유의 성긴 느낌을 낸다. */
const SCATTER_RING_OUTLIER_CHANCE = 0.06;

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
 *  설정 객체로 분리해서 관리한다 — returning은 first보다 빠르게 재생된다.
 *  각 단계(gather/hold/rearrange)를 눈으로 따라갈 수 있을 만큼 여유 있게 —
 *  이전엔 전환이 너무 빨리 지나가 버린다는 피드백을 받아 전체적으로 늘렸다. */
const TIMINGS: Record<"first" | "returning", IntroTiming> = {
  first: {
    gatherDuration: 2.6,
    gatherStaggerMax: 1.35,
    holdDuration: 2.8,
    rearrangeDuration: 3.8,
    rearrangeStaggerMax: 1.7,
    // 성긴 고리가 자리잡은 뒤 드리프트로 살아 움직이는 걸 더 오래 볼 수
    // 있도록 다른 단계보다 크게 늘렸다. 구멍이 뚫려 실제 메인 사이트로
    // 넘어가는 holeDuration/fadeOutDuration도 더 늦춰서, 화면이 바뀌는
    // 순간 자체가 급하게 느껴지지 않게 했다.
    gridHoldDuration: 2.4,
    holeDuration: 2.6,
    fadeOutDuration: 1.3,
    subtitleDelay: 3.9,
    subtitleFadeDuration: 0.55,
    subtitleHold: 2.0,
  },
  returning: {
    gatherDuration: 1.3,
    gatherStaggerMax: 0.75,
    holdDuration: 1.5,
    rearrangeDuration: 1.9,
    rearrangeStaggerMax: 0.9,
    gridHoldDuration: 1.1,
    holeDuration: 1.5,
    fadeOutDuration: 0.8,
    subtitleDelay: 1.6,
    subtitleFadeDuration: 0.36,
    subtitleHold: 0.85,
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
  if (width <= 600) return 340;
  if (width <= 1024) return 560;
  return 1150;
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

/** 파티클 개수만큼 화면 중앙에 성긴 고리(scattered ring) 좌표를 배치한다.
 *  참고 이미지처럼 딱 떨어지는 도형이 아니라, 반지름을 중심으로 안개처럼
 *  흐트러진 점들이 대략 원형 띠를 이루고 드문드문 이탈한 점들이 바깥으로
 *  흩어져 있는 유기적인 느낌을 낸다. 각도는 완전히 무작위라 별자리
 *  연결선을 그릴 순서 자체가 없다(setupAndPlay에서 이 형태일 땐
 *  gridLines를 비워둔다). */
function buildScatterRingPoints(count: number, width: number, height: number): Point[] {
  const cx = width / 2;
  const cy = height / 2;
  const baseR = Math.min(width, height) * SCATTER_RING_RADIUS_RATIO;
  const points: Point[] = [];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    // 균등분포 네 개를 더해 대략 정규분포에 가까운 흔들림을 만든다 —
    // 고리 반지름 주변에 점들이 몰리되, 완전히 균일하게 퍼지지는 않는다.
    const wobble = (Math.random() + Math.random() + Math.random() + Math.random() - 2) / 2;
    let offset = wobble * baseR * SCATTER_RING_JITTER;
    if (Math.random() < SCATTER_RING_OUTLIER_CHANCE) {
      offset += (Math.random() < 0.5 ? -1 : 1) * baseR * (0.35 + Math.random() * 0.55);
    }
    const r = Math.max(baseR * 0.06, baseR + offset);
    points.push({ x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r });
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
  /** 성긴 고리로 모일 때 이 점이 가져야 할 반지름 — rearrange 단계에서
   *  radius를 이 값으로 함께 트윈해서, 크고 작은 점이 뒤섞인 훨씬
   *  생동감 있는 고리를 만든다. */
  ringRadius: number;
  // 마우스가 가까이 오면 밀려났다가 스프링처럼 되돌아오는 인터랙티브 변위.
  // GSAP가 제어하는 "목표 위치"(x, y)와는 별개로 그리기 직전에만 더해지는
  // 오프셋이라, 어떤 애니메이션 단계(gather/hold/grid)에서도 목표 위치 자체를
  // 어긋내지 않고 그 위에 살짝 얹히는 효과를 낼 수 있다.
  dispX: number;
  dispY: number;
  velX: number;
  velY: number;
  // 성긴 고리가 자리잡은 뒤(gridHold 구간) 은은하게 제자리를 맴도는
  // 앰비언트 드리프트용 파라미터 — 파티클마다 위상/속도/진폭이 달라야
  // 다같이 "쿵쿵" 맞춰 움직이는 게 아니라 각자 다른 리듬으로 떠다니는
  // 것처럼 보인다.
  driftPhase: number;
  driftFreq: number;
  driftAmp: number;
  // 위치 드리프트와는 별개로, 크기가 살짝 커졌다 작아지며 반짝이는
  // 트윙클 효과용 파라미터 — 움직임뿐 아니라 밝기(크기)까지 함께
  // 일렁여야 "떠다니는 먼지"가 아니라 "반짝이는 별"에 가까운 생동감이
  // 난다.
  twinklePhase: number;
  twinkleFreq: number;
}

/** 구멍이 뚫리는 순간 터져나가는 불꽃 파편 하나. 물리 시뮬레이션이라 할 것도 없이
 *  등속 직선 + 감쇠뿐이지만, 방사형으로 여러 개가 동시에 흩어지면 "빵 터지는"
 *  느낌을 확실히 더해준다. */
interface Spark extends Point {
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  radius: number;
  color: string;
}

/** Hero3DLogo/HeroEmbers의 캔버스와 같은 이유로 dpr 상한을 둔다 — Retina 등
 *  고해상도 디스플레이(dpr 2~3)에서 상한 없이 그리면 캔버스 실제 픽셀 수가
 *  4~9배로 뛰어서, 매 프레임 수백 개 파티클을 그리는 비용이 그만큼 커진다. */
const MAX_DPR = 1.5;

function setupCanvas(canvas: HTMLCanvasElement, width: number, height: number) {
  const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  const ctx = canvas.getContext("2d");
  ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

export default function Preloader({ subtitle = DEFAULT_SUBTITLE, onFinish }: PreloaderProps) {
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

  // 모션 최소화/저사양 기기라 애초에 인트로를 건너뛴 경우, 정상 재생이었다면
  // finish()가 했을 onFinish 호출을 여기서 대신 한 번 해준다 — 마운트 시점의
  // visible 값만 확인하면 되므로 의존성 배열은 비워둔다.
  useEffect(() => {
    if (!visible) onFinish?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!visible) return;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const subtitleEl = subtitleRef.current;
    if (!canvas || !container) return;

    let cancelled = false;
    // paused로 만들어둔다 — 기본값(autoplay)이면 setupAndPlay()가 실제로 트윈을
    // 채우기 전, 즉 Inter 800 폰트를 기다리는 최대 800ms 동안 타임라인 재생헤드가
    // 이미 앞서 나가버려서, 실제 파티클 애니메이션이 시작될 땐 이미 그만큼의
    // "구간"이 스킵/압축된 것처럼 재생돼 전체가 의도한 것보다 늘어져 보였다.
    // setupAndPlay 맨 앞에서 명시적으로 play()를 호출해, 재생헤드가 실제 콘텐츠가
    // 채워지는 시점부터 정확히 0에서 출발하게 한다.
    const master = gsap.timeline({ paused: true });
    let subtitleTl: gsap.core.Timeline | undefined;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const ctx = setupCanvas(canvas, width, height);
    if (!ctx) return;

    const mode: "first" | "returning" = alreadyPlayed() ? "returning" : "first";
    const timing = TIMINGS[mode];

    // 마우스가 다가오면 근처 파티클이 밀려났다가 스프링처럼 제자리로 돌아오는
    // 인터랙티브 반응. 캔버스 자체는 pointer-events-none(아래 배경 클릭을
    // 막지 않기 위해)이지만, window에 건 리스너는 그와 무관하게 커서 좌표를
    // 계속 받아올 수 있다. active가 true가 되기 전(마우스를 아직 움직이지
    // 않은 상태)에는 원점(0,0)에 반응해버리지 않도록 가드한다.
    const mouse = { x: 0, y: 0, active: false };
    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    };
    window.addEventListener("mousemove", handleMouseMove);

    const finish = () => {
      markPlayed();
      setVisible(false);
    };

    const render = (time: number, deltaTime: number) => {
      // trailState.active인 동안(파티클이 실제로 움직이는 gather/rearrange 구간)엔
      // 화면을 완전히 지우지 않고 반투명한 배경을 겹쳐 칠한다 — 이전 프레임 잔상이
      // 옅게 남아 파티클마다 짧은 꼬리(comet trail)를 끌며 움직이는 것처럼 보인다.
      // 글자/그리드로 자리잡아 정지하는 구간(hold, gridHold, hole, fadeOut)에는
      // 다시 완전 불투명으로 지워서 잔상 없이 또렷하게 유지한다 — 전환되는 첫
      // 프레임에 한 번 완전히 덮이므로 이전 꼬리는 자연스럽게 사라진다.
      if (trailState.active) {
        ctx.fillStyle = BG_TRAIL_COLOR;
        ctx.fillRect(0, 0, width, height);
      } else {
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = BG_COLOR;
        ctx.fillRect(0, 0, width, height);
      }

      // 인터랙티브 변위 갱신 — 마우스가 가까이 오면 파티클이 밀려나고,
      // 멀어지면 스프링처럼 제자리(dispX/dispY = 0)로 되돌아온다. 캔버스는
      // pointer-events-none이라 클릭은 그대로 아래 페이지로 통과하지만,
      // 커서 위치는 window 리스너로 계속 받아오므로 시각적 반응은 자연스럽게
      // 살아있다. heroParticle은 구멍 뚫기 기준점이라 반응에서 제외해 그
      // 메커니즘만은 항상 예측 가능하게 둔다.
      if (mouse.active) {
        const dt = Math.min(deltaTime, 48) / 1000;
        const dampFactor = Math.pow(0.86, dt * 60);
        for (const p of particles) {
          if (p === heroParticle) continue;
          const px = p.x + p.dispX;
          const py = p.y + p.dispY;
          const mdx = px - mouse.x;
          const mdy = py - mouse.y;
          const distSq = mdx * mdx + mdy * mdy;
          if (distSq < REPEL_RADIUS * REPEL_RADIUS) {
            const dist = Math.sqrt(distSq) || 1;
            const force = (1 - dist / REPEL_RADIUS) * REPEL_STRENGTH;
            p.velX += (mdx / dist) * force * dt;
            p.velY += (mdy / dist) * force * dt;
          }
          // 스프링 — 밀려난 만큼 원위치로 되돌아오려는 힘.
          p.velX += -SPRING_K * p.dispX * dt;
          p.velY += -SPRING_K * p.dispY * dt;
          p.velX *= dampFactor;
          p.velY *= dampFactor;
          p.dispX += p.velX * dt;
          p.dispY += p.velY * dt;
        }
      }

      // 그리드가 다 모인 뒤 짧게 나타났다 사라지는 별자리 연결선. 격자 인접
      // 관계는 setupAndPlay에서 미리 계산해둔 gridLines를 그대로 쓰고, 살아있는
      // 파티클의 "현재" 좌표(변위 포함)를 따라 그려서 애니메이션 중에도, 마우스
      // 반응 중에도 자연스럽게 이어진다.
      if (lineState.alpha > 0.002) {
        ctx.save();
        ctx.strokeStyle = `rgba(233,230,221,${lineState.alpha})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (const [a, b] of gridLines) {
          ctx.moveTo(a.x + a.dispX, a.y + a.dispY);
          ctx.lineTo(b.x + b.dispX, b.y + b.dispY);
        }
        ctx.stroke();
        ctx.restore();
      }

      // 발광(shadowBlur) 없이 또렷한 점으로만 그린다.
      ctx.fillStyle = PARTICLE_COLOR;
      for (const p of particles) {
        if (p === heroParticle && holeState.active) continue;
        // 앰비언트 드리프트 — 파티클마다 다른 위상/속도로 작은 원을 그리며
        // 제자리를 맴돈다. dispX/dispY(마우스 반응용 스프링 변위)와는 별개
        // 레이어라 서로 간섭하지 않고 그대로 더해진다.
        let driftX = 0;
        let driftY = 0;
        let twinkle = 1;
        if (driftState.active) {
          const a = time * p.driftFreq + p.driftPhase;
          driftX = Math.cos(a) * p.driftAmp;
          driftY = Math.sin(a) * p.driftAmp;
          // 위치와 별개로 크기도 ±25% 정도 일렁여서, 떠다니기만 하는 게
          // 아니라 반짝이는 느낌까지 더한다 — 위치 드리프트와 주파수가
          // 달라 서로 어긋난 리듬으로 겹친다.
          twinkle = 1 + Math.sin(time * p.twinkleFreq + p.twinklePhase) * 0.32;
        }
        ctx.beginPath();
        ctx.arc(p.x + p.dispX + driftX, p.y + p.dispY + driftY, p.radius * twinkle, 0, Math.PI * 2);
        ctx.fill();
      }

      // 구멍이 뚫리는 순간 사방으로 흩어지는 불꽃 파편들. deltaTime(ms)로 매 프레임
      // 위치를 갱신하고, 수명이 다한 것부터 배열에서 제거한다.
      if (sparks.length > 0) {
        const dt = Math.min(deltaTime, 48) / 1000;
        for (let i = sparks.length - 1; i >= 0; i--) {
          const s = sparks[i];
          s.life -= dt;
          if (s.life <= 0) {
            sparks.splice(i, 1);
            continue;
          }
          s.x += s.vx * dt;
          s.y += s.vy * dt;
          // 감쇠(drag) — 처음엔 빠르게 튕겨나가다 점점 느려지며 잦아든다.
          s.vx *= 0.94;
          s.vy *= 0.94;
          const alpha = Math.max(0, s.life / s.maxLife);
          ctx.beginPath();
          ctx.fillStyle = s.color;
          ctx.globalAlpha = alpha;
          ctx.arc(s.x, s.y, s.radius * alpha, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
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
    // gather/rearrange 구간에서만 켜는 잔상 모드 스위치.
    const trailState = { active: false };
    // 성긴 고리가 자리잡은 뒤(gridHold 구간)에만 켜는 앰비언트 드리프트
    // 스위치 — 완성된 형태가 죽은 듯 딱 멈춰있지 않고 은은하게 살아
    // 움직이게 한다. 텍스트가 떠 있는 hold 구간에는 끄고 그대로 둬서
    // "MSSHIN" 가독성은 건드리지 않는다.
    const driftState = { active: false };
    // 그리드 완성 직후 짧게 나타났다 사라지는 별자리 연결선의 불투명도.
    const lineState = { alpha: 0 };
    // 격자 인접 쌍(같은 행의 오른쪽 이웃 + 같은 열의 아래쪽 이웃)만 이어서, 모든
    // 쌍을 다 잇는 것보다 훨씬 적은 선으로도 "격자 회로" 느낌을 낸다.
    let gridLines: [Particle, Particle][] = [];
    let sparks: Spark[] = [];

    // 구멍이 뚫리는 순간 (cx,cy)에서 사방으로 흩어지는 불꽃 파편을 만든다 —
    // 기존의 방사형 flash(빛 번짐)에 더해, 실제로 "터지는" 입자가 튀어나가는
    // 레이어를 하나 더 얹어 임팩트를 키운다.
    const spawnSparks = (cx: number, cy: number) => {
      const count = 34;
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
        const speed = 260 + Math.random() * 340;
        const maxLife = 0.5 + Math.random() * 0.45;
        sparks.push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: maxLife,
          maxLife,
          radius: 1.6 + Math.random() * 2,
          color: PARTICLE_COLOR,
        });
      }
    };

    const setupAndPlay = () => {
      if (cancelled) return;
      const count = getParticleCount(width);
      const { points: textPoints, textBottom } = buildTextPoints(TEXT, width, height, count);
      const gridPoints = buildScatterRingPoints(count, width, height);

      // 서브 문구를 퍼센트 기반 고정 위치가 아니라, 실제로 그려진 "MSSHIN" 글자
      // 실루엣 바로 아래 30px 지점에 둔다.
      if (subtitleEl) {
        subtitleEl.style.top = `${textBottom + 30}px`;
        subtitleEl.style.transform = "translateX(-50%)";
      }

      // 고리 기준 반지름 — 각 파티클이 중심에서 얼마나 멀리 떨어졌는지를
      // 이 값과 비교해서, 고리 바깥으로 흩어진("이탈") 점일수록 드리프트
      // 진폭을 더 크게 준다. 딱 붙어있는 고리 자체보다 그 주변에 성기게
      // 떠 있는 점들이 더 크게 흔들려야 "주변 점들이 살아 움직인다"는
      // 인상이 뚜렷해진다.
      const scatterBaseR = Math.min(width, height) * SCATTER_RING_RADIUS_RATIO;

      // 모바일 화면은 같은 픽셀 크기의 점이 상대적으로 훨씬 크고 진하게 보여서
      // 인상이 더 세게 느껴진다 — 화면폭이 좁을 때만 점 크기를 한 단계 줄여
      // 더 은은하게 보이게 한다(getParticleCount와 같은 기준선을 쓴다).
      const dotSizeScale = width <= 600 ? 0.72 : 1;

      particles = textPoints.map((tp, i) => {
        const start = randomOffscreenPoint(width, height);
        const gp = gridPoints[i];
        const distRatio = Math.hypot(gp.x - width / 2, gp.y - height / 2) / scatterBaseR;
        const driftScale = Math.min(3.4, Math.max(0.7, distRatio));
        return {
          x: start.x,
          y: start.y,
          textX: tp.x,
          textY: tp.y,
          gridX: gp.x,
          gridY: gp.y,
          // 글자를 이루는 점 하나하나가 눈에 잘 띄어야 "MSSHIN"이 읽힌다 — 기존
          // 1.4~2.4px는 촘촘한 화면에서 너무 옅어 보였고, 1.9~3.2px로도 획이
          // 굵은 곳(가로/세로 스트로크)에서 점 사이 간격이 도드라져 윤곽이
          // 끊겨 보였다. 한 단계 더 키워(2.6~4.2px) 인접한 점끼리 살짝 더
          // 맞닿아 보이게 해서, 획 윤곽이 끊김 없이 또렷하게 읽히도록 했다.
          radius: (2.6 + Math.random() * 1.6) * dotSizeScale,
          // 점 개수를 더 늘리면서, 최댓값(4.9px)은 그대로 두고 최솟값만 더
          // 낮췄다(0.7 -> 0.35) — 가장 큰 점이 지금보다 더 커지지는 않으면서,
          // 작은 점과 큰 점 사이의 크기 차이(대비)는 더 뚜렷해진다.
          ringRadius: (0.35 + Math.random() ** 2 * 4.55) * dotSizeScale,
          dispX: 0,
          dispY: 0,
          velX: 0,
          velY: 0,
          driftPhase: Math.random() * Math.PI * 2,
          driftFreq: 0.8 + Math.random() * 1.8,
          // 거리 기반 driftScale(0.7~3.4배)을 곱해 고리 바깥의 이탈 점들이
          // 눈에 띄게 더 크게, 더 빠르게 흔들리도록 진폭을 한 단계 더 키웠다.
          driftAmp: (9 + Math.random() * 22) * driftScale,
          twinklePhase: Math.random() * Math.PI * 2,
          twinkleFreq: 1.0 + Math.random() * 2.0,
        };
      });

      // 구멍을 뚫을 파티클 = 별 중심(화면 정중앙)에 가장 가까운 파티클.
      heroParticle = particles.reduce((closest, p) => {
        const d = Math.hypot(p.gridX - width / 2, p.gridY - height / 2);
        const dc = Math.hypot(closest.gridX - width / 2, closest.gridY - height / 2);
        return d < dc ? p : closest;
      }, particles[0]);

      // 성긴 고리는 각도가 완전히 무작위라 "인접한 점"이라는 개념 자체가
      // 없다 — 별자리 연결선 없이 순수하게 점들만으로 안개 같은 띠가
      // 드러나게 한다.
      gridLines = [];

      gsap.ticker.add(render);

      // 파티클이 출발점에서 도착점까지 일직선으로 미끄러지는 대신, 방향과
      // 굴곡이 제각각인 큼직한 곡선(2차 베지어)을 그리며 날아가게 한다. 곡선을
      // 따라 진행하는 동안엔 진행 방향에 수직으로 잦아드는 흔들림(wobble)까지
      // 더해서, 여러 파티클이 서로 다른 궤적으로 펄럭이듯 활기차게 보이게
      // 한다 — 직선 이동만으로는 아무리 개수가 많아도 "우르르 미끄러진다"는
      // 인상이었다. 착지 직전엔 목표 지점을 살짝 지나쳤다 튕기듯 돌아오는
      // back-ease를 써서 도착 자체에도 임팩트를 준다(t가 1을 살짝 넘었다가
      // 정확히 1로 수렴 — 베지어 공식은 t>1에서도 곡선의 접선 방향으로 자연스럽게
      // 연장되므로 어색하게 튀지 않는다). intensity가 클수록 곡선의 굴곡과
      // 흔들림 폭이 커져 더 격하게 움직인다.
      const flyAlongCurve = (
        p: Particle,
        fromX: number,
        fromY: number,
        toX: number,
        toY: number,
        duration: number,
        delay: number,
        intensity = 1,
        ease = "back.out(1.5)"
      ) => {
        const dx = toX - fromX;
        const dy = toY - fromY;
        const dist = Math.hypot(dx, dy) || 1;
        // 이동 방향에 수직인 단위벡터 — 이 축을 따라 곡선의 휘어짐과 흔들림을 준다.
        const perpX = -dy / dist;
        const perpY = dx / dist;
        const bulgeSign = Math.random() < 0.5 ? 1 : -1;
        // 거리 대비 30~110%만큼 옆으로 크게 부푼 곡선 — 파티클마다 방향/크기가
        // 달라 어떤 건 거의 반 바퀴 휘돌고 어떤 건 상대적으로 완만하게 날아온다.
        const bulge = bulgeSign * (0.3 + Math.random() * 0.8) * dist * intensity;
        const wobbleAmp = (0.06 + Math.random() * 0.16) * dist * intensity;
        const wobbleFreq = 2 + Math.random() * 3.5;
        const ctrlX = (fromX + toX) / 2 + perpX * bulge;
        const ctrlY = (fromY + toY) / 2 + perpY * bulge;
        const proxy = { t: 0 };
        master.to(
          proxy,
          {
            t: 1,
            duration,
            ease,
            onUpdate: () => {
              const t = proxy.t;
              const mt = 1 - t;
              // 2차 베지어: from -> ctrl -> to (t가 1을 넘나드는 구간도 같은
              // 공식이 곡선 연장선 위의 점을 그대로 내어준다)
              const bx = mt * mt * fromX + 2 * mt * t * ctrlX + t * t * toX;
              const by = mt * mt * fromY + 2 * mt * t * ctrlY + t * t * toY;
              // 흔들림은 도착 시점(t=1)엔 진폭이 0이 되어 목표 지점에 정확히
              // 착지한다 — 흔들리며 날아오다 마지막엔 딱 자리를 잡는다.
              const wobble = Math.sin(t * Math.PI * wobbleFreq) * wobbleAmp * (1 - t) * (1 - t);
              p.x = bx + perpX * wobble;
              p.y = by + perpY * wobble;
            },
          },
          delay
        );
      };

      // Phase 1: 화면 밖 -> 글자 모양으로 모임 (파티클마다 랜덤 stagger)
      // 파티클이 화면 밖에서 날아드는 이 구간은 잔상(trail)을 켜서, 쏟아져
      // 들어오는 궤적 자체가 짧은 빛줄기처럼 보이게 한다. 사용자에게 처음
      // 보이는 화면이라 너무 강한 인상을 주지 않도록, intensity를 낮추고
      // (곡선 굴곡/흔들림 폭을 줄임) 착지 바운스도 완만한 ease로 눌러둔다.
      master.call(() => { trailState.active = true; }, [], 0);
      particles.forEach((p) => {
        flyAlongCurve(
          p,
          p.x,
          p.y,
          p.textX,
          p.textY,
          timing.gatherDuration,
          Math.random() * timing.gatherStaggerMax,
          0.6,
          "back.out(1.15)"
        );
      });
      const phase1End = timing.gatherStaggerMax + timing.gatherDuration;
      const holdEnd = phase1End + timing.holdDuration;
      // 글자가 완성되어 정지하는 구간은 잔상을 끄고 다시 또렷하게 — "MSSHIN"을
      // 읽는 동안 잔상으로 흐려 보이면 오히려 가독성을 해친다.
      master.call(() => { trailState.active = false; }, [], phase1End);

      // Phase 2: 잠깐 정지 후 -> 정사각형 그리드로 재배열 (다시 잔상 on)
      // from을 p.x(호출 시점엔 아직 화면 밖 시작 좌표)가 아니라 p.textX/textY로
      // 명시한다 — 실제로 이 트윈이 재생될 시점엔 Phase 1이 끝나 그 자리에
      // 있겠지만, 이 곡선 계산 자체는 재생 전(setup 시점)에 미리 해두기 때문.
      // "MSSHIN" 글자가 흩어졌다 고리로 다시 뭉치는 전환 — 예전엔 intensity
      // 1.8 + 오버슈트 바운스(back.out)라 너무 격하고 급하게 느껴졌다.
      // intensity를 낮춰 곡선/흔들림 폭을 완만하게 줄이고, 도착 시 튕기지
      // 않고 매끄럽게 감속만 하는 ease(power3.out)로 바꿔 훨씬 자연스럽게
      // 자리를 잡도록 한다(duration/stagger도 TIMINGS에서 늘려 전체적으로
      // 더 천천히 진행된다).
      master.call(() => { trailState.active = true; }, [], holdEnd);
      particles.forEach((p) => {
        const delay = holdEnd + Math.random() * timing.rearrangeStaggerMax;
        flyAlongCurve(p, p.textX, p.textY, p.gridX, p.gridY, timing.rearrangeDuration, delay, 1.05, "power3.out");
        // 자리를 잡는 동시에 크기도 함께 바뀐다 — 크고 작은 점이 뒤섞인
        // 고리가 되어 균일한 점 무더기보다 훨씬 생동감 있게 보인다. 위치
        // 트윈의 back-ease(오버슈트)와 달리 크기는 그대로 자라거나
        // 줄어들기만 해야 자연스러워 별도로 power2.out을 쓴다.
        master.to(p, { radius: p.ringRadius, duration: timing.rearrangeDuration, ease: "power2.out" }, delay);
      });
      const phase2End = holdEnd + timing.rearrangeStaggerMax + timing.rearrangeDuration;
      const gridHoldEnd = phase2End + timing.gridHoldDuration;
      master.call(() => { trailState.active = false; }, [], phase2End);
      // "MSSHIN" 정지 상태에서는 드리프트를 꺼서 얌전하게 두고("MSSHIN"을 읽는
      // 동안은 화려하게 움직이지 않아야 한다), MSSHIN -> 고리로 재배열되는 이
      // 전환이 시작되는 순간(holdEnd)부터 드리프트를 켠다 — 날아가는 궤적 위에
      // 은은한 맴돎이 겹쳐져 전환 자체가 훨씬 생동감 있게 보인다. 고리로 다
      // 모인 뒤에도(구멍이 뚫리기 전까지) 계속 살아있는 느낌을 이어간다.
      master.call(() => { driftState.active = true; }, [], holdEnd);

      // 그리드가 다 모인 직후 ~ 구멍이 뚫리기 직전까지, 파티클들이 서로 이어진
      // 회로처럼 잠깐 반짝였다 사라진다 — 그리드로의 재배열이 "그냥 흩어져
      // 있는 점들"이 아니라 "무언가로 조립되는 과정"처럼 읽히게 하는 장치.
      const lineFadeDur = Math.min(0.18, timing.gridHoldDuration / 3);
      master.fromTo(
        lineState,
        { alpha: 0 },
        { alpha: 0.4, duration: lineFadeDur, ease: "power2.out" },
        phase2End
      );
      master.to(lineState, { alpha: 0, duration: lineFadeDur, ease: "power2.in" }, gridHoldEnd - lineFadeDur);

      // Phase 3: 그리드가 다 모이면, 중심 파티클 하나가 커지면서 원형으로 화면을 지운다
      const holeRadiusTarget = Math.hypot(width, height);
      master.call(() => {
        holeState.active = true;
        driftState.active = false;
        // 구멍이 뚫리기 시작하는 바로 그 지점에서 불꽃 파편이 사방으로 튄다 —
        // 기존 방사형 flash와 겹쳐, 단순히 "사라짐"이 아니라 "터지며 드러남"이
        // 되도록 임팩트를 더한다.
        spawnSparks(heroParticle.x, heroParticle.y);
      }, [], gridHoldEnd);
      // 구멍을 통해 실제 콘텐츠가 처음 드러나기 시작하는 바로 이 순간이
      // "사용자에게 인트로가 끝났다"고 신호를 보내야 할 시점이다 — 캔버스가
      // 완전히 사라지는 훨씬 나중(finish)까지 기다리면, 그 아래 깔린 Hero의
      // 등장 애니메이션이 이미 다 드러난 화면 위에서 뒤늦게 다시 재생되는
      // 것처럼 어색하게 겹쳐 보인다.
      master.call(() => onFinish?.(), [], gridHoldEnd);
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

      // 모든 트윈/콜을 다 채운 뒤에야 재생을 시작한다 — paused로 만들어둔 이유
      // 그대로, 재생헤드가 0초부터 정확히 출발해야 위에서 계산한 timing 값들이
      // 실제 체감 시간과 어긋나지 않는다.
      master.play();
    };

    if (document.fonts) {
      // Inter 800이 아직 캐시에 없어 네트워크로 받아와야 하는 경우, 그 응답을
      // 무제한 기다리면(특히 느린 회선에서) 인트로 시작 자체가 한참 지연되어
      // "포트폴리오가 늦게 뜬다"는 체감을 더 키운다 — 800ms 안에 못 받으면
      // 그냥 폴백 폭으로 진행한다(실제 폰트가 늦게 도착해도 화면엔 이미
      // 그려진 파티클 좌표만 쓰이므로 크게 어긋나 보이지 않는다).
      const fontReady = document.fonts.load(`800 100px Inter`).catch(() => undefined);
      const timeout = new Promise<void>((resolve) => setTimeout(resolve, 800));
      Promise.race([fontReady, timeout]).then(setupAndPlay);
    } else {
      setupAndPlay();
    }

    return () => {
      cancelled = true;
      window.removeEventListener("mousemove", handleMouseMove);
      gsap.ticker.remove(render);
      master.kill();
      subtitleTl?.kill();
    };
    // onFinish는 일부러 deps에서 뺐다 — Home이 넘기는 인라인 함수라 리렌더마다
    // 참조가 바뀌는데, 여길 deps에 넣으면 애니메이션 도중 부모가 리렌더될 때마다
    // 파티클 인트로 전체가 처음부터 다시 재생돼버린다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
