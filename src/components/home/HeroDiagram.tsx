import {
  Atom,
  Bot,
  ClipboardList,
  Code2,
  FileText,
  GalleryHorizontal,
  Globe,
  Megaphone,
  PanelTop,
  PenTool,
  Sparkles,
  TrendingUp,
  Wand2,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { gsap, prefersReducedMotion } from "../../lib/gsap";
import StaggerReveal from "../common/StaggerReveal";

export type PillIconKey = "input" | "code" | "language" | "agents" | "datasets" | "assessments" | "api" | "media";
export type FeatureIconKey = "cost" | "certainty" | "performance";

/** 관리자 페이지에서 아이콘을 문자열 key로 저장·검증할 때 쓰는 순서 있는 목록. Home.tsx가
 *  site_content에서 읽어온 문자열이 유효한 key인지 확인하는 용도라, PILL_ICONS/FEATURE_ICONS
 *  객체와 항상 같은 key 집합을 유지해야 한다. */
export const PILL_ICON_KEYS: PillIconKey[] = [
  "input",
  "code",
  "language",
  "agents",
  "datasets",
  "assessments",
  "api",
  "media",
];
export const FEATURE_ICON_KEYS: FeatureIconKey[] = ["cost", "certainty", "performance"];

export interface DiagramPillItem {
  icon: PillIconKey;
  label: string;
}

export interface FeatureCardItem {
  icon: FeatureIconKey;
  /** 카드 폭에 따른 자연 줄바꿈에 맡기지 않고 항상 2줄로 고정하기 위해 배열로 받는다. */
  heading: [string, string];
  body: string;
}

/** 문구/아이콘 배정을 한곳에 모아둬서, 나중에 라벨만 바꾸고 싶을 때 컴포넌트 JSX를
 *  건드리지 않고 이 상수들만 고치면 되게 한다. */
export const HERO_DIAGRAM_HEADING: [string, string] = ["My Service", ""];
/** 빈 문자열이면 DiagramHeading이 서브텍스트 문단 자체를 렌더링하지 않는다. */
export const HERO_DIAGRAM_SUBTEXT = "";
export const HERO_DIAGRAM_LEFT_ITEMS: DiagramPillItem[] = [
  { icon: "input", label: "Planning" },
  { icon: "code", label: "Publishing" },
  { icon: "language", label: "Content" },
  { icon: "agents", label: "Design" },
];
export const HERO_DIAGRAM_RIGHT_ITEMS: DiagramPillItem[] = [
  { icon: "datasets", label: "Websites" },
  { icon: "media", label: "Detail Pages & Banners" },
  { icon: "assessments", label: "Marketing Content" },
  { icon: "api", label: "Real Conversions" },
];
export const HERO_DIAGRAM_CENTER_LABEL = "Min Seok";
export const HERO_DIAGRAM_LLM_LABEL = "Core Skills";

export const HERO_FEATURE_CARDS: FeatureCardItem[] = [
  {
    icon: "cost",
    heading: ["리소스 없이도", "완성되는 비주얼"],
    body: "별도 촬영본이 없어도 생성형 AI로 상세페이지와 배너에 들어갈 비주얼을 직접 제작해 완성합니다.",
  },
  {
    icon: "certainty",
    heading: ["기획부터 구현까지,", "한 사람이"],
    body: "디자인, 퍼블리싱, 프론트엔드를 혼자 맡아 진행해 의도한 화면이 그대로 결과물로 이어집니다.",
  },
  {
    icon: "performance",
    heading: ["검색되고, 읽히고,", "전환되는 화면"],
    body: "SEO와 마케팅까지 고려해 설계하기 때문에, 예쁜 화면을 넘어 실제 성과로 이어지는 결과를 만듭니다.",
  },
];

const FEATURE_ICONS: Record<FeatureIconKey, LucideIcon> = {
  cost: Wand2,
  certainty: Workflow,
  performance: TrendingUp,
};

const PILL_ICONS: Record<PillIconKey, LucideIcon> = {
  input: ClipboardList,
  code: Code2,
  language: FileText,
  agents: PenTool,
  datasets: Globe,
  assessments: Megaphone,
  api: TrendingUp,
  media: GalleryHorizontal,
};

const LLM_ICONS: LucideIcon[] = [Sparkles, Bot, Atom];
/** LLM 그룹 안 3개 타일이 전부 같은 톤이면 밋밋해 보여서, 오렌지 틴트 농도를 조금씩
 *  다르게 줘 카드마다 미세한 입체감을 준다. */
const LLM_TILE_TINTS = ["rgba(245,98,20,0.24)", "rgba(255,255,255,0.05)", "rgba(245,98,20,0.15)"];

/** 데스크탑 다이어그램을 그리는 고정 좌표계. Footer의 하프톤 웨이브와 같은 방식으로,
 *  실제 픽셀 대신 이 가상의 캔버스 크기(VB_W x VB_H) 기준 좌표를 잡아두고 모든 조각(pill,
 *  박스)을 같은 비율로 배치한다. 바깥 컨테이너의 max-w를 이 VB_W와 정확히 같은 값
 *  (1600px)으로 맞춰뒀기 때문에, 그 폭 이상에서는 1 유닛 = 실제 1px로 정확히 맞고,
 *  그보다 좁아지면 전부 같은 비율로 같이 줄어든다. */
const VB_W = 1600;
const VB_H = 400;
/** 연결선을 없앤 뒤에는 pill을 "위 2개 아래 2개로 뭉치게" 할 이유가 없어져서,
 *  4줄을 단순히 등간격으로 배치한다. */
const ROW_Y = [50, 150, 250, 350];
const PILL_WIDTH = 300;
const BOX_CENTER_Y = 200;
const BOX_HALF = 48;
const LEFT_BOX_CX = 551;
const RIGHT_BOX_CX = VB_W - LEFT_BOX_CX;
const CENTER_X = VB_W / 2;
const LABEL_Y = BOX_CENTER_Y + BOX_HALF + 28;
/** pill 4개의 라인이 박스 모서리 한 점으로 다 몰리면 선이 뭉개져 보이므로, 위 두 줄은
 *  박스 위쪽 지점으로, 아래 두 줄은 박스 아래쪽 지점으로 먼저 합류시켜 "두 갈래로
 *  브랜치를 타고 들어가는" 모양을 만든다. */
const MERGE_Y = { top: 175, bottom: 225 };
const CURVE_PULL = 60;

function mergeYFor(y: number) {
  return y < BOX_CENTER_Y ? MERGE_Y.top : MERGE_Y.bottom;
}

/** pill(x=PILL_WIDTH 지점)에서 시작해 박스 합류점(mx,my)까지 이어지는 곡선. 두 번째
 *  컨트롤 포인트를 끝점과 같은 y로 바짝 붙여, 선이 박스에 닿는 순간 수평에 가깝게
 *  들어가도록 해서 매끈하게 흡수되는 느낌을 낸다. */
function fanInPath(y: number, mx: number, my: number) {
  return `M${PILL_WIDTH},${y} C${(PILL_WIDTH + mx) / 2},${y} ${mx - CURVE_PULL},${my} ${mx},${my}`;
}

function fanOutPath(y: number, mx: number, my: number) {
  const anchor = VB_W - PILL_WIDTH;
  return `M${mx},${my} C${mx + CURVE_PULL},${my} ${(anchor + mx) / 2},${y} ${anchor},${y}`;
}
const LLM_DESKTOP = { tileSize: 68, iconSize: 24, gap: 18, padX: 18 };
/** LLMGroup의 실제 렌더 폭(타일 3개 + 그 사이 gap 2개 + 좌우 padding)을 그대로 계산해
 *  둔다 — 감으로 정한 별도 상수를 쓰면 실제 컴포넌트 폭과 어긋나서, 중앙 박스들 사이
 *  직선이 LLMs 박스 가장자리에 못 미치고 허공에 뜨는 문제가 생긴다. */
const LLM_GROUP_WIDTH = LLM_DESKTOP.tileSize * 3 + LLM_DESKTOP.gap * 2 + LLM_DESKTOP.padX * 2;
const GROUP_BOX = { left: CENTER_X - LLM_GROUP_WIDTH / 2, right: CENTER_X + LLM_GROUP_WIDTH / 2 };

/** Lucien 박스 사이, Lucien-LLMs 사이의 직선 연결선. 박스 안쪽까지 선을 밀어넣어 봤더니
 *  박스 배경이 완전 불투명이 아니라 살짝 비치는 재질이라 그 선이 "유리 뒤로 비치는"
 *  것처럼 보여서, 다시 박스 바깥 여백 구간에서만 긋는 방식으로 되돌린다. */
function centerLinePath(fromX: number, toX: number) {
  return `M${fromX},${BOX_CENTER_Y} L${toX},${BOX_CENTER_Y}`;
}
/** 사각형 카드는 전부 이 radius로 통일한다. */
const BOX_RADIUS = "rounded-[4px]";

/** pill/카드 표면 — 유리 반사/블러 효과 대신, 참고 이미지(후기 카드)처럼 배경보다
 *  한 톤 밝은 무채색 판 위에 아주 옅은 헤어라인 보더만 두르는 플랫한 카드 스타일. */
/** box-shadow는 인라인 style이 아니라 클래스로 둬야 한다 — 인라인 style은 항상 CSS
 *  클래스(:hover 포함)보다 우선 적용되므로, 여기 넣으면 아래 Pill의 hover:shadow-*가
 *  절대 먹히지 않는다. */
const GLASS_CLASS = "border border-white/[0.08]";
const GLASS_STYLE: CSSProperties = {
  backgroundColor: "rgba(255,255,255,0.04)",
};

/** 하단 3개 피처 카드 전용 배경 — flat한 회색 유리 대신, 색상 없이 순수 블랙/화이트
 *  톤만으로 깊이를 준다. 상단은 미세하게 밝은 무채색 sheen, 하단으로 갈수록
 *  순수 블랙으로 가라앉는 그라디언트 + 은은한 하이라이트/그림자로 무게감을 만든다. */
const FEATURE_CARD_STYLE: CSSProperties = {
  background:
    "linear-gradient(165deg, rgba(255,255,255,0.09) 0%, rgba(10,10,10,0.98) 42%, rgba(0,0,0,1) 100%)",
};

function pct(value: number, total: number) {
  return `${(value / total) * 100}%`;
}

function FlowDot({ pathId, delay, dur = 4 }: { pathId: string; delay: number; dur?: number }) {
  return (
    <circle r={3.2} fill="#fff">
      <animateMotion dur={`${dur}s`} begin={`${delay}s`} repeatCount="indefinite">
        <mpath href={`#${pathId}`} />
      </animateMotion>
      <animate
        attributeName="opacity"
        values="0;1;1;0"
        keyTimes="0;0.12;0.82;1"
        dur={`${dur}s`}
        begin={`${delay}s`}
        repeatCount="indefinite"
      />
    </circle>
  );
}

function Pill({ icon, label }: DiagramPillItem) {
  const Icon = PILL_ICONS[icon];
  return (
    <div
      className={[
        "group relative flex items-center gap-2.5 overflow-hidden rounded-[8px] px-5 py-4",
        GLASS_CLASS,
        "transition-[border-color,box-shadow] duration-300 ease-out hover:border-primary-txt/45",
        "hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_0_24px_-4px_rgba(245,98,20,0.5)]",
      ].join(" ")}
      style={GLASS_STYLE}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center transition-transform duration-300 ease-out group-hover:scale-110">
        <Icon
          size={21}
          strokeWidth={1.75}
          className="text-white transition-[filter] duration-300 ease-out group-hover:drop-shadow-[0_0_6px_rgba(255,255,255,0.8)]"
        />
      </span>
      {/* 원래는 truncate(한 줄 + ...)를 썼는데, 모바일의 좁은 2열 pill 그리드에서
          "Detail Pages & Banners"처럼 긴 라벨이 중간에 잘려 보이는 문제가 있었다 —
          truncate를 빼고 자연스럽게 2줄로 감싸지게 둔다(부모가 고정 높이가 아니라
          내용에 맞춰 늘어나므로 레이아웃이 깨지지 않는다). leading-none(line-height:1)
          이었다면 폰트 실제 높이보다 좁은 라인 박스 때문에 "g"/"y" 같은 디센더가 잘려
          보였을 텐데, leading-[1.4]로 여유를 둬서 그 문제도 함께 피한다. */}
      <span className="font-en text-base leading-[1.4] tracking-[0.01em] text-white/90">{label}</span>
    </div>
  );
}

/** Lucien/LLMs 박스에 공통으로 쓰는 "고급스러운" 껍데기. 고정된 보더 대신, 박스보다
 *  훨씬 큰 conic-gradient 사각형을 중심에서 천천히 회전시키고 그 위를 안쪽 배경으로
 *  거의 다 덮어 얇은 테두리 두께만 남기는 방식으로, 얇은 빛줄기 하나가 테두리를 따라
 *  도는 것처럼 보이게 한다(프리미엄 SaaS 랜딩페이지에서 흔한 "border beam" 기법).
 *  바깥 래퍼는 그와 별개로 은은한 숨쉬는 듯한 box-shadow 펄스를 맡는다. */
function LuxeShell({
  children,
  delay = 0,
  spinDuration = 6,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  spinDuration?: number;
  className?: string;
}) {
  return (
    <div
      className={`relative h-full w-full [animation:hero-diagram-glow_4s_ease-in-out_infinite] ${className}`}
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="absolute inset-0 overflow-hidden" style={{ borderRadius: "inherit" }}>
        <div
          className="absolute left-1/2 top-1/2 h-[320%] w-[320%] -translate-x-1/2 -translate-y-1/2 [animation:hero-diagram-spin_var(--spin-duration)_linear_infinite]"
          style={
            {
              "--spin-duration": `${spinDuration}s`,
              animationDelay: `${delay}s`,
              background:
                "conic-gradient(from 0deg, transparent 0%, rgba(255,200,150,0.7) 6%, rgba(245,98,20,0.4) 12%, transparent 24%, transparent 100%)",
            } as CSSProperties
          }
        />
        <div
          className="absolute inset-[1.5px]"
          style={{
            borderRadius: "inherit",
            background: "linear-gradient(155deg, rgba(245,98,20,0.13) 0%, rgba(8,7,6,1) 55%, rgba(245,98,20,0.07) 100%)",
          }}
        />
      </div>
      <div className="relative z-10 flex h-full w-full items-center justify-center">{children}</div>
    </div>
  );
}

function CenterBox({ icon: Icon, delay = 0 }: { icon: LucideIcon; delay?: number }) {
  return (
    <LuxeShell delay={delay} className={BOX_RADIUS}>
      <Icon size={26} strokeWidth={1.4} className="text-white drop-shadow-[0_0_8px_rgba(245,98,20,0.6)]" />
    </LuxeShell>
  );
}

function CenterLabel({ children }: { children: string }) {
  return <span className="font-en text-base tracking-[0.01em] text-white/55">{children}</span>;
}

function LLMGroup({
  delay = 0,
  tileSize,
  iconSize,
  gap,
  padX,
}: {
  delay?: number;
  tileSize: number;
  iconSize: number;
  gap: number;
  padX: number;
}) {
  const width = tileSize * 3 + gap * 2 + padX * 2;
  return (
    <div className="relative z-10" style={{ width, height: tileSize + padX }}>
      <LuxeShell delay={delay} spinDuration={7} className={BOX_RADIUS}>
        <div className="flex items-center" style={{ gap, paddingLeft: padX, paddingRight: padX }}>
          {LLM_ICONS.map((Icon, i) => (
            <div
              key={i}
              className={`relative flex shrink-0 items-center justify-center overflow-hidden border border-white/[0.14] shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] ${BOX_RADIUS}`}
              style={{ width: tileSize, height: tileSize, background: LLM_TILE_TINTS[i] }}
            >
              <Icon size={iconSize} strokeWidth={1.5} className="text-white" />
            </div>
          ))}
        </div>
      </LuxeShell>
    </div>
  );
}

function DesktopDiagram({
  leftItems,
  rightItems,
  centerLabel,
  llmLabel,
}: {
  leftItems: DiagramPillItem[];
  rightItems: DiagramPillItem[];
  centerLabel: string;
  llmLabel: string;
}) {
  const leftPaths = ROW_Y.map((y, i) => ({
    id: `hd-l-${i}`,
    d: fanInPath(y, LEFT_BOX_CX - BOX_HALF, mergeYFor(y)),
  }));
  const rightPaths = ROW_Y.map((y, i) => ({
    id: `hd-r-${i}`,
    d: fanOutPath(y, RIGHT_BOX_CX + BOX_HALF, mergeYFor(y)),
  }));
  const centerPaths = [
    { id: "hd-center-l", d: centerLinePath(LEFT_BOX_CX + BOX_HALF, GROUP_BOX.left) },
    { id: "hd-center-r", d: centerLinePath(GROUP_BOX.right, RIGHT_BOX_CX - BOX_HALF) },
  ];

  const rootRef = useRef<HTMLDivElement | null>(null);

  // 스크롤로 화면에 들어오는 순간, pill은 좌/우 바깥에서 미끄러져 들어오고 박스는
  // 팝업하듯 튀어 오르고 연결선은 실시간으로 그려지는 "조립되는" 느낌의 등장 연출.
  // 이미 있는 흐르는 점/펄스 애니메이션(SMIL, CSS keyframe)과는 서로 다른 속성(GSAP는
  // transform/opacity/stroke-dashoffset만 건드림)이라 겹쳐도 충돌하지 않는다.
  useEffect(() => {
    const root = rootRef.current;
    if (!root || prefersReducedMotion()) return;

    const pillsLeft = Array.from(root.querySelectorAll<HTMLElement>('[data-hero-anim="pill-left"]'));
    const pillsRight = Array.from(root.querySelectorAll<HTMLElement>('[data-hero-anim="pill-right"]'));
    const boxes = Array.from(root.querySelectorAll<HTMLElement>('[data-hero-anim="box"]'));
    const labels = Array.from(root.querySelectorAll<HTMLElement>('[data-hero-anim="label"]'));
    const lines = Array.from(root.querySelectorAll<SVGPathElement>("svg path"));
    if (pillsLeft.length === 0 && boxes.length === 0) return;

    gsap.set(pillsLeft, { opacity: 0, x: -70 });
    gsap.set(pillsRight, { opacity: 0, x: 70 });
    gsap.set(boxes, { opacity: 0, scale: 0.55, transformOrigin: "50% 50%" });
    gsap.set(labels, { opacity: 0, y: 6 });
    const lineLengths = lines.map((line) => {
      const length = line.getTotalLength();
      gsap.set(line, { strokeDasharray: length, strokeDashoffset: length });
      return length;
    });

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        const tl = gsap.timeline();
        tl.to(pillsLeft, { opacity: 1, x: 0, duration: 0.7, stagger: 0.08, ease: "power3.out" }, 0)
          .to(pillsRight, { opacity: 1, x: 0, duration: 0.7, stagger: 0.08, ease: "power3.out" }, 0)
          .to(lines, {
            strokeDashoffset: 0,
            duration: (i) => Math.max(0.35, Math.min(0.9, lineLengths[i] / 260)),
            stagger: 0.015,
            ease: "power2.inOut",
          }, 0.12)
          .to(boxes, { opacity: 1, scale: 1, duration: 0.65, stagger: 0.15, ease: "back.out(1.8)" }, 0.32)
          .to(labels, { opacity: 1, y: 0, duration: 0.4, stagger: 0.1, ease: "power2.out" }, 0.55)
          .set([pillsLeft, pillsRight, boxes, labels], { clearProps: "transform" });
        observer.disconnect();
      },
      { rootMargin: "0px 0px -100px 0px", threshold: 0 }
    );
    observer.observe(root);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={rootRef}
      className="relative mx-auto hidden w-full max-w-[1600px] lg:block"
      style={{ aspectRatio: `${VB_W} / ${VB_H}` }}
    >
      {/* 채도 있는 오렌지 스포트라이트 대신, 아주 옅은 웜톤이 도는 어두운 vignette라
          고급스럽고 차분한 느낌을 낸다. */}
      <div
        className="pointer-events-none absolute rounded-full blur-[90px]"
        style={{
          left: pct(CENTER_X, VB_W),
          top: pct(BOX_CENTER_Y, VB_H),
          width: pct(800, VB_W),
          height: pct(800, VB_H),
          transform: "translate(-50%, -50%)",
          background:
            "radial-gradient(circle, rgba(22,22,24,0.75) 0%, rgba(10,10,11,0.4) 45%, rgba(0,0,0,0) 75%)",
        }}
      />

      {/* Lucien-LLMs-Lucien 사이의 직선 연결선. pill 쪽 팬 곡선은 삭제했지만, 이 가운데
          구간은 신호가 실제로 통과하는 파이프라인이라 흐르는 점 애니메이션을 살려둔다. */}
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="hd-core-line" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ffcb9a" stopOpacity="0.85" />
            <stop offset="50%" stopColor="#fff3e6" stopOpacity="1" />
            <stop offset="100%" stopColor="#ffcb9a" stopOpacity="0.85" />
          </linearGradient>
          <linearGradient id="hd-line-in" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#fff" stopOpacity="0" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0.55" />
          </linearGradient>
          <linearGradient id="hd-line-out" x1="1" y1="0" x2="0" y2="0">
            <stop offset="0%" stopColor="#fff" stopOpacity="0" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0.55" />
          </linearGradient>
        </defs>

        {leftPaths.map(({ id, d }) => (
          <path key={id} id={id} d={d} fill="none" stroke="url(#hd-line-in)" strokeWidth={1} strokeLinecap="round" />
        ))}
        {rightPaths.map(({ id, d }) => (
          <path key={id} id={id} d={d} fill="none" stroke="url(#hd-line-out)" strokeWidth={1} strokeLinecap="round" />
        ))}

        {/* Lucien-LLMs-Lucien 사이의 직선 연결선. 박스 안쪽까지 밀어넣으면 박스 배경이
            완전 불투명이 아니라 그 선이 비쳐 보였어서, 박스 바깥 여백 구간에서만 긋는다.
            완전히 수평인 선이라 바운딩 박스 높이가 0이 되어 objectBoundingBox 그라디언트가
            아예 그려지지 않는 SVG 특성 때문에, 여기만 단색을 쓴다. */}
        {centerPaths.map(({ id, d }) => (
          <path key={id} id={id} d={d} fill="none" stroke="#fff3e6" strokeOpacity={0.9} strokeWidth={1} />
        ))}

        {/* pill 쪽 끝 지점과 박스 합류점에 작은 점을 찍어, 선이 pill에서 시작해 박스로
            흡수된다는 걸 시각적으로 못박는다. */}
        {ROW_Y.map((y) => (
          <circle key={`pdot-l-${y}`} cx={PILL_WIDTH} cy={y} r={2.4} fill="rgba(255,255,255,0.55)" />
        ))}
        {ROW_Y.map((y) => (
          <circle key={`pdot-r-${y}`} cx={VB_W - PILL_WIDTH} cy={y} r={2.4} fill="rgba(255,255,255,0.55)" />
        ))}

        {leftPaths.map(({ id }, i) => (
          <FlowDot key={`fd-${id}`} pathId={id} delay={i * 0.8} dur={2.2} />
        ))}
        {rightPaths.map(({ id }, i) => (
          <FlowDot key={`fd-${id}`} pathId={id} delay={0.4 + i * 0.8} dur={2.2} />
        ))}

        {centerPaths.map(({ id }, i) => (
          <FlowDot key={`fd-${id}`} pathId={id} delay={i * 0.6} dur={2.2} />
        ))}
      </svg>

      {leftItems.map((item, i) => (
        <div
          key={item.label}
          data-hero-anim="pill-left"
          className="absolute z-10 -translate-y-1/2"
          style={{ left: 0, top: pct(ROW_Y[i], VB_H), width: pct(PILL_WIDTH, VB_W) }}
        >
          <Pill {...item} />
        </div>
      ))}
      {rightItems.map((item, i) => (
        <div
          key={item.label}
          data-hero-anim="pill-right"
          className="absolute z-10 -translate-y-1/2"
          style={{
            right: 0,
            top: pct(ROW_Y[i], VB_H),
            width: pct(PILL_WIDTH, VB_W),
          }}
        >
          <Pill {...item} />
        </div>
      ))}

      <div
        data-hero-anim="box"
        className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
        style={{
          left: pct(LEFT_BOX_CX, VB_W),
          top: pct(BOX_CENTER_Y, VB_H),
          width: pct(BOX_HALF * 2, VB_W),
          height: pct(BOX_HALF * 2, VB_H),
        }}
      >
        <CenterBox icon={PanelTop} />
      </div>
      <div
        data-hero-anim="label"
        className="absolute z-10 -translate-x-1/2 translate-y-2"
        style={{ left: pct(LEFT_BOX_CX, VB_W), top: pct(LABEL_Y, VB_H) }}
      >
        <CenterLabel>{centerLabel}</CenterLabel>
      </div>

      <div
        data-hero-anim="box"
        className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
        style={{ left: pct(CENTER_X, VB_W), top: pct(BOX_CENTER_Y, VB_H) }}
      >
        <LLMGroup {...LLM_DESKTOP} />
      </div>
      <div
        data-hero-anim="label"
        className="absolute z-10 -translate-x-1/2 translate-y-2"
        style={{ left: pct(CENTER_X, VB_W), top: pct(LABEL_Y, VB_H) }}
      >
        <CenterLabel>{llmLabel}</CenterLabel>
      </div>

      <div
        data-hero-anim="box"
        className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
        style={{
          left: pct(RIGHT_BOX_CX, VB_W),
          top: pct(BOX_CENTER_Y, VB_H),
          width: pct(BOX_HALF * 2, VB_W),
          height: pct(BOX_HALF * 2, VB_H),
        }}
      >
        <CenterBox icon={PanelTop} delay={1.2} />
      </div>
      <div
        data-hero-anim="label"
        className="absolute z-10 -translate-x-1/2 translate-y-2"
        style={{ left: pct(RIGHT_BOX_CX, VB_W), top: pct(LABEL_Y, VB_H) }}
      >
        <CenterLabel>{centerLabel}</CenterLabel>
      </div>
    </div>
  );
}

/** lg 미만에서는 좌/중앙/우 3단 구성 대신 세로로 쌓이는 단순한 목록으로 바꾼다 — 좁은
 *  화면에서는 그 구성을 그대로 축소해봐야 자잘한 요소가 겹치기만 하고 가독성이
 *  떨어지므로, pill 그리드 + 중앙 스택으로 단순화한다. */
function MobileDiagram({
  leftItems,
  rightItems,
  centerLabel,
  llmLabel,
}: {
  leftItems: DiagramPillItem[];
  rightItems: DiagramPillItem[];
  centerLabel: string;
  llmLabel: string;
}) {
  return (
    <div className="flex flex-col items-center gap-8 lg:hidden">
      <StaggerReveal as="div" className="grid w-full max-w-[380px] grid-cols-2 gap-3" y={24} stagger={0.08} fromScale={0.92}>
        {leftItems.map((item) => (
          <Pill key={item.label} {...item} />
        ))}
      </StaggerReveal>

      <div className="relative flex flex-col items-center gap-0">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[260px] w-[260px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(22,22,24,0.8)_0%,rgba(10,10,11,0.4)_50%,rgba(0,0,0,0)_75%)] blur-2xl" />

        <div className="relative z-10 h-[76px] w-[76px]">
          <CenterBox icon={PanelTop} />
        </div>
        <CenterLabel>{centerLabel}</CenterLabel>

        <MobileConnector id="hd-m-1" />

        <LLMGroup delay={0.6} tileSize={48} iconSize={18} gap={10} padX={12} />
        <CenterLabel>{llmLabel}</CenterLabel>

        <MobileConnector id="hd-m-2" delay={0.5} />

        <div className="relative z-10 h-[76px] w-[76px]">
          <CenterBox icon={PanelTop} delay={1.2} />
        </div>
        <CenterLabel>{centerLabel}</CenterLabel>
      </div>

      <StaggerReveal as="div" className="grid w-full max-w-[380px] grid-cols-2 gap-3" y={24} stagger={0.08} fromScale={0.92}>
        {rightItems.map((item) => (
          <Pill key={item.label} {...item} />
        ))}
      </StaggerReveal>
    </div>
  );
}

function MobileConnector({ id, delay = 0 }: { id: string; delay?: number }) {
  return (
    <svg width="2" height="28" viewBox="0 0 2 28" className="relative z-10 my-3 overflow-visible">
      <path id={id} d="M1,0 L1,28" stroke="rgba(255,255,255,0.25)" strokeWidth={1} />
      <FlowDot pathId={id} delay={delay} dur={2.6} />
    </svg>
  );
}

function FeatureCard({ icon, heading, body }: FeatureCardItem) {
  const Icon = FEATURE_ICONS[icon];
  return (
    <div
      className={[
        "group relative overflow-hidden rounded-2xl border border-white/[0.04] p-8 max-lg:p-7 max-sm:p-6",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_24px_48px_-24px_rgba(0,0,0,0.9)]",
        "transition-[border-color,box-shadow,transform] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
        "hover:-translate-y-1.5 hover:scale-[1.012] hover:border-white/[0.22]",
        "hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_48px_96px_-32px_rgba(0,0,0,1)]",
      ].join(" ")}
      style={FEATURE_CARD_STYLE}
    >
      {/* 고급 소재(유리/메탈) 표면에 빛이 스치듯, 호버 시 카드를 대각선으로 가로지르는
          아주 옅은 화이트 스윕 하이라이트 — 컬러 없이 "빛이 표면을 스친다"는 감각만으로
          질감의 고급스러움을 더한다. */}
      <span className="pointer-events-none absolute inset-0 -translate-x-[120%] skew-x-[-18deg] bg-gradient-to-r from-transparent via-white/[0.07] to-transparent transition-transform duration-[1100ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-[120%]" />

      {/* 참고 이미지처럼 카드 하단 전체가 부드럽게 밝아지는 큰 그라디언트 글로우 — 평소엔
          숨어 있다가 호버 시 카드 아래쪽 대부분을 진하게 채우며 번진다. 컬러 없이 순수
          화이트 톤만으로, 중심은 진하게 바깥으로 갈수록 부드럽게 빠지는 은은한 sheen으로
          읽히게 한다. */}
      <span className="pointer-events-none absolute inset-x-[-30%] bottom-[-40%] h-full origin-bottom scale-y-75 opacity-0 blur-[60px] transition-[opacity,transform] duration-500 ease-out group-hover:scale-y-110 group-hover:opacity-100 [background:radial-gradient(ellipse_65%_75%_at_50%_100%,rgba(255,255,255,0.4)_0%,rgba(255,255,255,0.18)_30%,rgba(255,255,255,0.08)_55%,transparent_78%)]" />

      <div className="relative">
        <Icon
          size={38}
          strokeWidth={1.5}
          className="text-white transition-[transform,filter] duration-500 ease-out group-hover:scale-110 group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.7)]"
        />
        {/* heading은 여전히 [줄1, 줄2] 배열로 받지만(다른 곳에서 2줄로 쓸 수도
            있으니 데이터 구조는 그대로 둔다), 여기서는 <br/> 없이 한 줄로
            이어붙여서 렌더링한다. */}
        <h3 className="mt-8 font-ko text-xl leading-7 font-medium text-white max-sm:text-lg max-sm:leading-6">
          {heading.join(" ")}
        </h3>
        {/* 제목(흰색)보다 한 단계 낮은 계층으로 읽히도록 흰색 70% 불투명도로
            내린다 — 회색 계열(text-secondary-txt) 대신 흰색 베이스를 써야
            제목과 같은 색상 축 위에서 명도차만으로 위계가 또렷해진다. */}
        <p className="mt-3 font-ko text-sm leading-6 text-white/70 transition-colors duration-500 group-hover:text-white/80">
          {body}
        </p>
      </div>
    </div>
  );
}

function FeatureCards({ items }: { items: FeatureCardItem[] }) {
  return (
    <StaggerReveal
      as="div"
      className="mt-20 grid grid-cols-3 gap-6 max-lg:mt-16 max-lg:grid-cols-1 max-lg:gap-4 max-sm:mt-12"
      y={50}
      stagger={0.15}
      fromScale={0.94}
    >
      {items.map((item) => (
        <FeatureCard key={item.heading.join(" ")} {...item} />
      ))}
    </StaggerReveal>
  );
}

interface HeroDiagramProps {
  heading?: [string, string];
  subtext?: string;
  leftItems?: DiagramPillItem[];
  rightItems?: DiagramPillItem[];
  centerLabel?: string;
  llmLabel?: string;
  featureCards?: FeatureCardItem[];
}

/** 히어로 다이어그램 상단의 가운데 정렬 헤딩+서브텍스트. 폰트 크기 체계는
 *  다른 섹션의 제목(SectionTitle의 h2 68px/76px, 설명 16px/24px)과 똑같이
 *  맞춘다 — 이 섹션만 46px로 따로 놀지 않게. 다만 SectionTitle 자체는 왼쪽
 *  정렬 오버라인+타이틀+옆에 나란히 놓이는 설명 레이아웃이라, 여기의
 *  "가운데 정렬 두 줄 헤딩 + 그 아래 서브텍스트" 구조에는 그대로 재사용할
 *  수 없어 별도 컴포넌트로 둔다. */
function DiagramHeading({ heading, subtext }: { heading: [string, string]; subtext: string }) {
  return (
    <div
      className={[
        "mx-auto max-w-[720px] text-center",
        // 서브텍스트가 없으면 문단 자체가 안 그려져 빈 여백이 남으므로,
        // 헤딩과 아래 다이어그램 사이 간격을 서브텍스트가 있을 때보다 줄인다.
        subtext ? "mb-[70px] max-lg:mb-12 max-sm:mb-9" : "mb-12 max-lg:mb-9 max-sm:mb-7",
      ].join(" ")}
    >
      <h2 className="font-en text-[68px] leading-[76px] font-bold text-white max-lg:text-[56px] max-lg:leading-[66px] max-sm:text-[40px] max-sm:leading-[48px]">
        {heading[0]}
        {heading[1] ? (
          <>
            <br />
            {heading[1]}
          </>
        ) : null}
      </h2>
      {subtext ? (
        <p className="mt-6 font-en text-base leading-6 font-light text-secondary-txt max-sm:text-sm max-sm:leading-[22px]">
          {subtext}
        </p>
      ) : null}
    </div>
  );
}

export default function HeroDiagram({
  heading = HERO_DIAGRAM_HEADING,
  subtext = HERO_DIAGRAM_SUBTEXT,
  leftItems = HERO_DIAGRAM_LEFT_ITEMS,
  rightItems = HERO_DIAGRAM_RIGHT_ITEMS,
  centerLabel = HERO_DIAGRAM_CENTER_LABEL,
  llmLabel = HERO_DIAGRAM_LLM_LABEL,
  featureCards = HERO_FEATURE_CARDS,
}: HeroDiagramProps) {
  return (
    <div>
      <DiagramHeading heading={heading} subtext={subtext} />

      <DesktopDiagram leftItems={leftItems} rightItems={rightItems} centerLabel={centerLabel} llmLabel={llmLabel} />
      <MobileDiagram leftItems={leftItems} rightItems={rightItems} centerLabel={centerLabel} llmLabel={llmLabel} />

      <FeatureCards items={featureCards} />
    </div>
  );
}
