import { useEffect, useRef, useState } from "react";
import { AnimatePresence, animate, motion, useInView, useMotionValue, useTransform } from "framer-motion";
import StaggerReveal from "../common/StaggerReveal";

interface ButtonStyleGuideProps {
  radius: string;
  fontLabel: string;
  /** 예시 버튼의 가로 폭(px) — 피그마 프레임에 박힌 값을 그대로 쓴다(예: 242, 378). */
  buttonWidth: number;
  /** 예시 버튼의 높이(px) — 헤딩("높이{n}px 버튼 가이드"), 눈금선 길이, 카운트업 숫자,
   *  최소 마진 가이드의 버튼 높이·간격까지 이 값 하나로 통일한다. */
  buttonHeight: number;
}

const POP_SPRING = { type: "spring" as const, stiffness: 260, damping: 18 };
const DRAW_EASE = [0.65, 0, 0.35, 1] as const;

/** 카드 하나가 화면에 들어왔는지를 판단하는 훅. 이 값을 카드 안의 버튼/눈금선/숫자에 함께
 *  넘기고 delay만 다르게 주면, "카드 등장 -> 버튼 팝인 -> 눈금선이 그려짐 -> 숫자 카운트업"
 *  순서로 이어지는 하나의 연출(코레오그래피)이 된다. once:false라서 스크롤로 화면 밖을
 *  벗어났다가 다시 들어올 때마다 이 연출이 매번 새로 재생된다. */
function useCardReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: false, amount: 0.5 });
  return { ref, inView };
}

const LINE_DRAW_DURATION = 0.6;
/** 측정선이 다 그려지자마자 양 끝에서 통통 튀듯 튀어나오는 "측정 완료" 점 — 디자인 툴에서
 *  실측할 때 끝점이 톡 찍히는 느낌을 재현한다. */
const TICK_DOT_SPRING = { type: "spring" as const, stiffness: 420, damping: 11 };

/** 피그마의 "가로 값 자유 변경" 캡션 아래에 있는 너비 측정 눈금선(Vector 45) — 좌우 끝의
 *  짧은 세로 눈금과 그 사이를 잇는 가로선으로 표현한다. 실제 폭은 부모(버튼과 같은 grid
 *  칸)가 정해주므로 항상 버튼과 정확히 같은 폭이 된다. active가 true가 되는 시점부터
 *  delay만큼 기다렸다가 왼쪽 끝에서부터 자라나고, 다 그려지면 양 끝에 완료 점이 톡 튄다. */
function WidthGuideLine({ className = "", active, delay = 0 }: { className?: string; active: boolean; delay?: number }) {
  const tickDelay = delay + LINE_DRAW_DURATION;
  return (
    <div className={`relative h-1.5 ${className}`}>
      <motion.div
        className="absolute inset-0 origin-left"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: active ? 1 : 0 }}
        transition={{ duration: LINE_DRAW_DURATION, delay, ease: DRAW_EASE }}
      >
        <span className="absolute inset-y-0 left-0 w-px bg-[#ee00ff]" />
        <span className="absolute inset-y-0 right-0 w-px bg-[#ee00ff]" />
        <span className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-[#ee00ff]" />
      </motion.div>
      <motion.span
        className="absolute left-0 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ee00ff]"
        initial={{ scale: 0 }}
        animate={{ scale: active ? 1 : 0 }}
        transition={{ ...TICK_DOT_SPRING, delay: tickDelay }}
      />
      <motion.span
        className="absolute right-0 top-1/2 h-1.5 w-1.5 translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ee00ff]"
        initial={{ scale: 0 }}
        animate={{ scale: active ? 1 : 0 }}
        transition={{ ...TICK_DOT_SPRING, delay: tickDelay }}
      />
    </div>
  );
}

/** 높이 라벨 옆에 놓이는 높이 측정 눈금선(Group 2264를 세로로 재현) — 버튼의 실제 높이와
 *  같은 길이로, 위/아래 끝의 짧은 가로 눈금과 그 사이를 잇는 세로선으로 표현한다. WidthGuideLine과
 *  같은 시점(delay)에 맞춰 위에서 아래로 함께 그려지고, 다 그려지면 위아래 끝에 완료 점이 톡 튄다. */
function HeightGuideLine({ className = "", active, delay = 0 }: { className?: string; active: boolean; delay?: number }) {
  const tickDelay = delay + LINE_DRAW_DURATION;
  return (
    <div className={`relative w-1.5 ${className}`}>
      <motion.div
        className="absolute inset-0 origin-top"
        initial={{ scaleY: 0 }}
        animate={{ scaleY: active ? 1 : 0 }}
        transition={{ duration: LINE_DRAW_DURATION, delay, ease: DRAW_EASE }}
      >
        <span className="absolute inset-x-0 top-0 h-px bg-[#ee00ff]" />
        <span className="absolute inset-x-0 bottom-0 h-px bg-[#ee00ff]" />
        <span className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 bg-[#ee00ff]" />
      </motion.div>
      <motion.span
        className="absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ee00ff]"
        initial={{ scale: 0 }}
        animate={{ scale: active ? 1 : 0 }}
        transition={{ ...TICK_DOT_SPRING, delay: tickDelay }}
      />
      <motion.span
        className="absolute left-1/2 bottom-0 h-1.5 w-1.5 -translate-x-1/2 translate-y-1/2 rounded-full bg-[#ee00ff]"
        initial={{ scale: 0 }}
        animate={{ scale: active ? 1 : 0 }}
        transition={{ ...TICK_DOT_SPRING, delay: tickDelay }}
      />
    </div>
  );
}

/** 예시 카드의 파란 버튼 — 실제 elfbar 버튼 컴포넌트의 색/라운드/폰트 토큰을 그대로 리터럴
 *  값으로 고정한다(포트폴리오 사이트 자체의 테마 변수가 아니라, 그 프로젝트 버튼 컴포넌트
 *  자체의 스펙이므로). 카드가 화면에 들어오면 살짝 튀어오르듯 스프링으로 팝인한다. */
function SampleButton({
  width,
  height,
  className = "",
  active = true,
  delay = 0,
}: {
  width: number;
  height: number;
  className?: string;
  active?: boolean;
  delay?: number;
}) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: active ? 1 : 0, scale: active ? 1 : 0.5 }}
      transition={{ ...POP_SPRING, delay }}
      style={{ width, height }}
      className={`inline-flex max-w-full cursor-pointer items-center justify-center whitespace-nowrap rounded-[4px] bg-[#0077ff] px-6 font-ko text-sm font-medium tracking-[-0.35px] text-white transition-colors duration-200 hover:bg-[#0062d6] ${className}`}
    >
      버튼
    </motion.span>
  );
}

const EXPANDING_DEMO_TEXTS = ["버튼", "버튼 확인하기"] as const;
const EXPANDING_DEMO_INTERVAL = 1800;

const EXPANDING_LAYOUT_TRANSITION = { duration: 0.5, ease: DRAW_EASE };

/** "4글자 이상이면 마진이 늘어난다"는 규칙을 글로만 설명하지 않고, 버튼 라벨을 짧은 텍스트와
 *  긴 텍스트 사이로 자동 반복 전환하면서 실제로 폭이 늘었다 줄었다 하는 걸 눈으로 보여준다.
 *
 *  자연스럽게 보이려면 세 가지가 함께 필요했다:
 *  1) 폭 변화 자체는 스프링(통통 튀는 느낌) 대신 라인 그리기와 같은 부드러운 duration
 *     easing을 쓴다 — `transition`에 `layout` 전용 값을 따로 지정한다.
 *  2) 텍스트는 layout="position"으로 감싸 부모의 scale 보정을 상쇄한다(안 그러면 글자가
 *     같이 가로로 늘었다 줄었다 찌그러져 보인다).
 *  3) 텍스트 자체는 순간적으로 안 바뀌고 AnimatePresence(mode="popLayout")로 페이드
 *     아웃/인 크로스페이드된다 — 그래야 글자가 "툭" 바뀌는 끊긴 느낌 없이, 폭이 늘어나는
 *     움직임과 새 글자가 나타나는 타이밍이 자연스럽게 겹친다. */
function ExpandingDemoButton({ height, active, delay = 0 }: { height: number; active: boolean; delay?: number }) {
  const [textIndex, setTextIndex] = useState(0);

  useEffect(() => {
    if (!active) {
      setTextIndex(0);
      return;
    }
    const timer = setInterval(() => {
      setTextIndex((i) => (i + 1) % EXPANDING_DEMO_TEXTS.length);
    }, EXPANDING_DEMO_INTERVAL);
    return () => clearInterval(timer);
  }, [active]);

  return (
    <motion.span
      layout
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: active ? 1 : 0, scale: active ? 1 : 0.5 }}
      transition={{ default: { ...POP_SPRING, delay }, layout: EXPANDING_LAYOUT_TRANSITION }}
      style={{ height }}
      className="relative inline-flex max-w-full cursor-pointer items-center justify-center overflow-hidden whitespace-nowrap rounded-[4px] bg-[#0077ff] px-6 font-ko text-sm font-medium tracking-[-0.35px] text-white transition-colors duration-200 hover:bg-[#0062d6]"
    >
      {/* popLayout이 빠지는 텍스트를 position:absolute로 빼는데, 이 버튼 박스 자신이
          position:relative(=positioned ancestor)가 아니면 그 absolute 기준점을 잃고
          엉뚱하게 먼 곳(문서 오른쪽 끝)으로 튕겨나가 페이지 전체에 가로 스크롤이 생겼다.
          relative + overflow-hidden으로 크로스페이드가 항상 이 박스 안에서만 일어나게 한다. */}
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={textIndex}
          layout="position"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: DRAW_EASE }}
        >
          {EXPANDING_DEMO_TEXTS[textIndex]}
        </motion.span>
      </AnimatePresence>
    </motion.span>
  );
}

/** 화면에 들어오는 시점부터 delay만큼 기다렸다가 0에서 실제 값까지 세는 숫자 카운트업 —
 *  정적인 텍스트보다 "이 숫자가 바로 이 버튼의 스펙"이라는 인상을 더 강하게 준다. */
function CountUpNumber({
  value,
  className = "",
  active,
  delay = 0,
}: {
  value: number;
  className?: string;
  active: boolean;
  delay?: number;
}) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v).toString());

  useEffect(() => {
    if (!active) {
      // 화면 밖으로 나가면 다음 재진입 때 처음부터 다시 셀 수 있도록 즉시 0으로 되돌린다.
      count.set(0);
      return;
    }
    const controls = animate(count, value, { duration: 0.7, delay, ease: DRAW_EASE });
    return controls.stop;
  }, [active, value, delay, count]);

  return <motion.span className={className}>{rounded}</motion.span>;
}

/** 자유변형 가이드 카드. 등장 순서: 카드가 뜬다 -> 버튼이 스프링으로 팝인 -> 가로/세로
 *  눈금선이 함께 그려진다 -> 높이 숫자가 카운트업된다. */
function FreeformCard({ buttonWidth, buttonHeight }: { buttonWidth: number; buttonHeight: number }) {
  const { ref, inView } = useCardReveal();
  return (
    <div ref={ref} className="flex-1 flex flex-col h-[249px] rounded-md bg-[#f8f8fa] p-8">
      <p className="font-ko text-sm leading-5 tracking-[-0.35px] text-sub-secondary-txt">자유변형 가이드</p>
      <div className="flex flex-1 items-center justify-center">
        {/* 버튼을 기준(중심)으로 두고, 가로/높이 눈금선은 모두 absolute로 버튼에 매달아
            배치한다 — 눈금선은 레이아웃 흐름에서 빠지므로 버튼의 실제 크기·중앙 위치에는
            전혀 영향을 주지 않고, 눈금선 쪽 크기(폭 100%/높이 100%)만 버튼 값을 그대로
            참조해 항상 정확히 일치한다. */}
        <div className="relative inline-block max-w-full">
          <SampleButton width={buttonWidth} height={buttonHeight} className="max-w-full" active={inView} delay={0.2} />

          <div className="absolute inset-x-0 bottom-full mb-3 flex flex-col items-center gap-2">
            <span className="font-ko text-xs leading-[18px] tracking-[-0.3px] text-[#ee00ff]">
              가로 값 자유 변경
            </span>
            <WidthGuideLine className="w-full" active={inView} delay={0.5} />
          </div>

          <div className="absolute right-full top-0 mr-2 flex h-full items-center gap-1.5">
            <CountUpNumber
              value={buttonHeight}
              className="font-ko text-xs leading-[18px] tracking-[-0.3px] text-[#ee00ff]"
              active={inView}
              delay={0.55}
            />
            <HeightGuideLine className="h-full" active={inView} delay={0.5} />
          </div>
        </div>
      </div>
    </div>
  );
}

/** 버튼 최소 마진 가이드 카드. 카드가 뜬 다음, 기본 -> hover -> 선택 순서로 버튼 3개가
 *  차례로 스프링 팝인한다. */
function MinMarginCard({ buttonHeight }: { buttonHeight: number }) {
  const { ref, inView } = useCardReveal();
  const tabBase =
    "inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-[4px] px-6 font-ko text-sm font-medium tracking-[-0.35px] transition-colors duration-200";
  const tabStyle = { height: buttonHeight };

  return (
    <div ref={ref} className="flex-1 flex flex-col h-[249px] rounded-md bg-[#f8f8fa] p-8">
      <p className="font-ko text-sm leading-5 tracking-[-0.35px] text-sub-secondary-txt">버튼 최소 마진 가이드</p>
      <div
        className="flex flex-1 flex-wrap items-center justify-center max-sm:gap-4"
        style={{ gap: buttonHeight }}
      >
        {/* 기본 상태 — hover 시 오른쪽 예시(hover 상태)와 같은 색으로 전환된다. */}
        <motion.span
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: inView ? 1 : 0, scale: inView ? 1 : 0.5 }}
          transition={{ ...POP_SPRING, delay: 0.2 }}
          style={tabStyle}
          className={`${tabBase} border border-[#e5e5ec] bg-white text-black hover:border-[#0077ff] hover:bg-[#e2f3ff] hover:text-[#0077ff]`}
        >
          버튼
        </motion.span>
        {/* hover 상태 예시 — 자체 hover 시 톤을 한 단계 더 진하게 준다. */}
        <motion.span
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: inView ? 1 : 0, scale: inView ? 1 : 0.5 }}
          transition={{ ...POP_SPRING, delay: 0.32 }}
          style={tabStyle}
          className={`${tabBase} border border-[#0077ff] bg-[#e2f3ff] text-[#0077ff] hover:bg-[#cfe9ff]`}
        >
          버튼
        </motion.span>
        {/* 선택된 상태 — hover 시 버튼과 동일하게 어두워진다. */}
        <motion.span
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: inView ? 1 : 0, scale: inView ? 1 : 0.5 }}
          transition={{ ...POP_SPRING, delay: 0.44 }}
          style={tabStyle}
          className={`${tabBase} bg-[#0077ff] text-white hover:bg-[#0062d6]`}
        >
          버튼
        </motion.span>
      </div>
    </div>
  );
}

/** 4자 이상 마진 확장 규칙 카드. 카드가 뜬 다음 버튼이 스프링으로 팝인하고, 이후 텍스트가
 *  짧은/긴 라벨을 자동으로 오가며 마진이 늘어나는 규칙을 실제로 보여준다. */
function ExpandingMarginCard({ buttonHeight }: { buttonHeight: number }) {
  const { ref, inView } = useCardReveal();
  return (
    <div ref={ref} className="flex-1 flex flex-col h-[249px] rounded-md bg-[#f8f8fa] p-8">
      <p className="font-ko text-sm leading-5 tracking-[-0.35px] text-sub-secondary-txt [word-break:keep-all]">
        4글자 이상인 경우 폰트 기준 좌우 마진 24px로 잡고 늘어난다.
      </p>
      <div className="flex flex-1 items-center justify-center">
        <ExpandingDemoButton height={buttonHeight} active={inView} delay={0.2} />
      </div>
    </div>
  );
}

export default function ButtonStyleGuide({ radius, fontLabel, buttonWidth, buttonHeight }: ButtonStyleGuideProps) {
  return (
    <div className="button-info max-w-[1530px] mx-auto mb-20 max-lg:mb-14 max-sm:mb-8">
      <p className="font-ko text-2xl font-semibold leading-normal tracking-[-0.6px] text-[#111] mb-[18px] max-sm:text-xl">
        높이{buttonHeight}px 버튼 가이드
      </p>
      <ul className="flex flex-col gap-2.5 mb-10 max-sm:mb-6">
        <li className="flex items-center gap-2.5">
          <span className="h-1 w-1 shrink-0 rounded-full bg-sub-secondary-txt" />
          <span className="font-ko text-lg leading-[26px] tracking-[-0.45px] text-sub-secondary-txt max-sm:text-base">
            버튼 라운드 적용시 : {radius}
          </span>
        </li>
        <li className="flex items-center gap-2.5">
          <span className="h-1 w-1 shrink-0 rounded-full bg-sub-secondary-txt" />
          <span className="font-ko text-lg leading-[26px] tracking-[-0.45px] text-sub-secondary-txt max-sm:text-base">
            폰트 : {fontLabel}
          </span>
        </li>
      </ul>

      {/* 3개 카드가 스크롤로 화면에 들어오는 시점에 순서대로, 살짝 뒤로 젖혀진 상태(rotateX)에서
          fade + y + scale과 함께 세워지듯 떠오르며 등장하고, 각 카드 안에서는 버튼 -> 눈금선/탭
          -> 숫자 순서로 이어지는 팝인 연출이 이어진다. 배경색은 그대로 두고 위치/투명도/스케일/
          회전만 애니메이션한다. */}
      <StaggerReveal
        as="div"
        className="flex gap-10 max-lg:flex-col"
        y={28}
        fromScale={0.95}
        rotateX={12}
        stagger={0.12}
      >
        <FreeformCard buttonWidth={buttonWidth} buttonHeight={buttonHeight} />
        <MinMarginCard buttonHeight={buttonHeight} />
        <ExpandingMarginCard buttonHeight={buttonHeight} />
      </StaggerReveal>
    </div>
  );
}
