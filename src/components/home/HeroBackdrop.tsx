import { useEffect, useRef, type CSSProperties, type RefObject } from "react";
import HeroEmbers from "./HeroEmbers";

const GRID_SIZE = 56;

/** 커서를 따라가는 감쇠 속도(초당 λ) — 값이 클수록 딱 붙어 따라온다. 배경 광원은
 *  3D 로고의 빠르고 날카로운 리플과 성격이 겹치지 않도록 일부러 한 박자 느리게
 *  뒤따라오게 둔다. */
const SPOT_FOLLOW_LAMBDA = 7;
/** 커서가 히어로 안팎을 드나들 때 점등/소등되는 속도. */
const SPOT_FADE_LAMBDA = 5;
/** 셀 트레일(지나온 칸 잔상)에 동시에 재생 중일 수 있는 조각 개수 — 커서를
 *  아주 빠르게 휘저어도 이 이상 쌓이지 않고 오래된 조각부터 재사용된다. */
const TRAIL_POOL_SIZE = 8;

/** 몇 개의 라인에서만 하이라이트가 슬라이드하는 스트릭 — 전체 격자를 한번에
 *  가로지르는 대각선 스윕 대신, 정해진 가로/세로 라인 몇 개만 각자 다른
 *  타이밍으로 자기 방향(가로는 좌우, 세로는 상하)으로 흘러가게 한다. */
interface GridStreak {
  id: string;
  orientation: "h" | "v";
  /** 교차축 위치(px) — 가로 라인이면 y, 세로 라인이면 x. 그리드 패턴이 (0,0)
   *  에서 시작해 GRID_SIZE 간격으로 반복되므로, 이 값이 GRID_SIZE의 정수배가
   *  아니면 스트릭이 실제 격자 선과 어긋난 임의의 위치를 지나가 버린다. */
  position: number;
  dur: number;
  begin: number;
}

const GRID_STREAKS: GridStreak[] = [
  { id: "h1", orientation: "h", position: GRID_SIZE * 6, dur: 4.2, begin: 0 },
  { id: "h2", orientation: "h", position: GRID_SIZE * 14, dur: 5, begin: 2.2 },
  { id: "v1", orientation: "v", position: GRID_SIZE * 5, dur: 4.6, begin: 1.1 },
  { id: "v2", orientation: "v", position: GRID_SIZE * 15, dur: 5.4, begin: 3 },
];

/** 커서 위치를 컨테이너의 CSS 변수(--hero-spot-x/y)로, 점등 세기를
 *  --hero-spot-on으로 흘려보낸다. 값 자체를 부드럽게 감쇠시켜 두면 스포트라이트
 *  레이어는 그 변수를 transform/opacity로만 쓰면 되므로, 마우스를 흔들어도
 *  리페인트 없이 합성만으로 따라온다. 같은 좌표에서 커서가 들어있는 그리드
 *  셀의 좌상단(--hero-cell-x/y)도 함께 계산해서, 원형 광원과는 별개로 사각형
 *  셀 하이라이트가 그 칸에 스냅되어 앉을 수 있게 한다. 칸이 바뀔 때마다 방금
 *  떠난 칸 자리에 트레일 조각을 하나 남겨, 지나온 궤적이 잔상처럼 옅어지며
 *  사라지게 한다.
 *
 *  히어로 전체를 3D 로고 캔버스가 덮고 있어 배경 DOM은 포인터 이벤트를 아예
 *  받지 못한다 — 그래서 컨테이너가 아니라 window에서 좌표를 받아온다. */
function useCursorSpotlight(rootRef: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    // 터치 기기에는 따라다닐 커서가 없고, 모션 최소화를 켠 사용자에게는 화면을
    // 계속 쫓아오는 광원 자체가 부담이다. 이 경우 아무것도 걸지 않으면
    // --hero-spot-on이 기본값 0으로 남아 레이어는 투명한 채 유지된다.
    const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!canHover || reduceMotion) return;

    const target = { x: 0, y: 0, on: 0 };
    const current = { x: 0, y: 0, on: 0 };
    let seeded = false;
    let rafId = 0;
    let lastTime = 0;

    // 트레일은 React 상태 없이, 미리 렌더링해둔 풀(pool)을 라운드로빈으로
    // 재사용한다 — 칸이 바뀔 때마다 다음 조각을 그 위치로 옮기고 CSS
    // 애니메이션을 처음부터 다시 재생시킨다(재생 중인 애니메이션을 재시작하려면
    // 스타일을 지웠다가 강제로 리플로우를 한 번 일으켜야 브라우저가 "새로
    // 시작"한 것으로 인식한다).
    const trailSlots = Array.from(root.querySelectorAll<HTMLDivElement>(".hero-cell-trail-slot"));
    let trailIndex = 0;
    let hasCell = false;
    let lastCellX = 0;
    let lastCellY = 0;

    // pointermove마다 getBoundingClientRect를 부르면 이벤트마다 레이아웃을
    // 강제하게 되므로, 히어로의 화면상 위치는 캐시해두고 스크롤/리사이즈에만
    // 다시 잰다.
    let rect = root.getBoundingClientRect();
    const measure = () => {
      rect = root.getBoundingClientRect();
    };

    const tick = (now: number) => {
      // 첫 프레임이거나 탭이 백그라운드에 다녀온 경우 delta가 비정상적으로
      // 커져서 한 프레임 만에 목표값으로 순간이동하는 걸 막는다.
      const delta = lastTime ? Math.min((now - lastTime) / 1000, 1 / 30) : 1 / 60;
      lastTime = now;

      const follow = 1 - Math.exp(-SPOT_FOLLOW_LAMBDA * delta);
      const fade = 1 - Math.exp(-SPOT_FADE_LAMBDA * delta);
      current.x += (target.x - current.x) * follow;
      current.y += (target.y - current.y) * follow;
      current.on += (target.on - current.on) * fade;

      root.style.setProperty("--hero-spot-x", `${current.x.toFixed(1)}px`);
      root.style.setProperty("--hero-spot-y", `${current.y.toFixed(1)}px`);
      root.style.setProperty("--hero-spot-on", current.on.toFixed(3));

      const settled =
        Math.abs(target.x - current.x) < 0.3 &&
        Math.abs(target.y - current.y) < 0.3 &&
        Math.abs(target.on - current.on) < 0.002;
      if (settled) {
        // 커서를 따라잡았으면 루프를 세운다 — 마우스가 멈춰 있는 동안 rAF가
        // 계속 돌며 배터리를 먹지 않도록.
        rafId = 0;
        lastTime = 0;
        return;
      }
      rafId = requestAnimationFrame(tick);
    };

    const wake = () => {
      if (rafId) return;
      lastTime = 0;
      rafId = requestAnimationFrame(tick);
    };

    const handlePointerMove = (e: PointerEvent) => {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      target.x = x;
      target.y = y;
      target.on = x >= 0 && x <= rect.width && y >= 0 && y <= rect.height ? 1 : 0;

      // 첫 감지 때는 보간 없이 커서 자리에서 바로 점등을 시작한다 — 안 그러면
      // 광원이 좌상단(0,0)에서 커서까지 길게 날아오는 게 보인다.
      if (!seeded) {
        seeded = true;
        current.x = x;
        current.y = y;
      }

      // 커서가 현재 들어있는 그리드 셀(56×56)의 좌상단 좌표 — 원형 광원과
      // 달리 감쇠 없이 즉시 스냅시켜서, "칸을 선택한다"는 느낌이 나게 한다.
      // 실제 이동 애니메이션은 CSS transition이 처리한다.
      const cellX = Math.floor(x / GRID_SIZE) * GRID_SIZE;
      const cellY = Math.floor(y / GRID_SIZE) * GRID_SIZE;
      root.style.setProperty("--hero-cell-x", `${cellX}px`);
      root.style.setProperty("--hero-cell-y", `${cellY}px`);

      if (!hasCell) {
        hasCell = true;
      } else if ((cellX !== lastCellX || cellY !== lastCellY) && trailSlots.length > 0) {
        // 방금 떠난 칸(lastCellX/Y) 자리에 트레일 조각을 하나 남긴다.
        const slot = trailSlots[trailIndex % trailSlots.length];
        trailIndex++;
        slot.style.transform = `translate3d(${lastCellX}px, ${lastCellY}px, 0)`;
        const fade = slot.firstElementChild as HTMLElement | null;
        if (fade) {
          fade.style.animation = "none";
          void fade.offsetWidth; // 강제 리플로우 — 다음 줄의 재할당이 "새 애니메이션"으로 인식되게 한다.
          fade.style.animation = "";
        }
      }
      lastCellX = cellX;
      lastCellY = cellY;

      wake();
    };

    const handleLeave = () => {
      target.on = 0;
      wake();
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    document.addEventListener("mouseleave", handleLeave);
    window.addEventListener("blur", handleLeave);
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("mouseleave", handleLeave);
      window.removeEventListener("blur", handleLeave);
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [rootRef]);
}

function GridOverlay() {
  const patternId = "hero-grid-pattern";
  const linePath = `M ${GRID_SIZE} 0 L 0 0 0 ${GRID_SIZE}`;

  return (
    <svg className="absolute inset-0 h-full w-full hero-grid-reveal" aria-hidden="true">
      <defs>
        {/* 얇은 그리드 라인 — 타일 경계에 걸치는 좌표(음수 등)를 쓰면 SVG
            pattern이 타일 단위로 잘라내 버려 모서리가 끊기므로, 선은 타일의
            위/왼쪽 변을 따라 긋고 타일이 이어지면 격자가 완성되게 한다. */}
        <pattern id={patternId} width={GRID_SIZE} height={GRID_SIZE} patternUnits="userSpaceOnUse">
          <path d={linePath} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
        </pattern>
        {/* 가로 라인은 bbox 높이가, 세로 라인은 bbox 너비가 0이라
            objectBoundingBox 그라디언트가 특이(degenerate)해져 아예 안
            그려진다 — line 자신의 좌표계와 같은 userSpaceOnUse를 쓰고, 실제
            히어로 폭/높이를 몰라도 항상 화면을 덮도록 아주 넉넉한 고정 픽셀
            범위로 그라디언트를 잡은 뒤 그 범위 안에서 이동시킨다. */}
        {GRID_STREAKS.map((s) => {
          const isH = s.orientation === "h";
          const gradientProps = {
            gradientUnits: "userSpaceOnUse" as const,
            x1: isH ? -600 : 0,
            y1: isH ? 0 : -600,
            x2: isH ? 600 : 0,
            y2: isH ? 0 : 600,
          };
          const animate = (
            <animateTransform
              attributeName="gradientTransform"
              type="translate"
              from={isH ? "-700 0" : "0 -700"}
              to={isH ? "2700 0" : "0 2700"}
              dur={`${s.dur}s`}
              begin={`${s.begin}s`}
              repeatCount="indefinite"
            />
          );
          return (
            /* 굵은 반투명 헤일로를 겹치는 대신, 얇은 코어 선 하나만 두고 색
               자체를 카퍼(#c97a3a) → 골드(#e8c98a) → 샴페인(#ffedd2) →
               아이보리 화이트(#fffdf6)로 이어지는 메탈릭 그러데이션으로
               다듬는다. 넓게 퍼지는 반투명 면이 없으니 흐릿하게 번지는
               인상 없이, 가늘고 또렷한 선이 색만 바뀌며 흘러간다. */
            <linearGradient key={s.id} id={`hero-grid-streak-${s.id}`} {...gradientProps}>
              <stop offset="0%" stopColor="#c97a3a" stopOpacity="0" />
              <stop offset="41%" stopColor="#c97a3a" stopOpacity="0" />
              <stop offset="46%" stopColor="#c97a3a" stopOpacity="0.5" />
              <stop offset="48.5%" stopColor="#e8c98a" stopOpacity="0.85" />
              <stop offset="50%" stopColor="#fffdf6" stopOpacity="1" />
              <stop offset="51.5%" stopColor="#e8c98a" stopOpacity="0.85" />
              <stop offset="56%" stopColor="#c97a3a" stopOpacity="0.4" />
              <stop offset="63%" stopColor="#c97a3a" stopOpacity="0" />
              <stop offset="100%" stopColor="#c97a3a" stopOpacity="0" />
              {animate}
            </linearGradient>
          );
        })}
      </defs>

      <rect width="100%" height="100%" fill={`url(#${patternId})`} />

      {GRID_STREAKS.map((s) => (
        <line
          key={s.id}
          x1={s.orientation === "h" ? "0%" : s.position}
          y1={s.orientation === "h" ? s.position : "0%"}
          x2={s.orientation === "h" ? "100%" : s.position}
          y2={s.orientation === "h" ? s.position : "100%"}
          stroke={`url(#hero-grid-streak-${s.id})`}
          strokeWidth={1}
          style={{ mixBlendMode: "screen" }}
        />
      ))}
    </svg>
  );
}

/** 히어로 배경 — 딥 블랙 베이스 위에 버번(위스키 앰버) 톤이 아래쪽에서 은은하게
 *  번지고, 그 위로 흐릿한 앰버 빛줄기 몇 겹이 흐른다. 그리드는 페이지가 뜰 때
 *  중심에서 퍼져나오듯 한 번 등장하고, 위로 떠오르는 임버(불티) 입자가 그 위를
 *  느리게 흘러간다. 마지막으로 얇은 그리드 오버레이 위에 커서를 따라다니는
 *  원형 스포트라이트와, 커서가 들어있는 칸을 사각형 그대로 밝히는 셀
 *  하이라이트가 함께 깔린다. 3D 로고/텍스트 뒤에 깔리는 순수 장식 레이어라
 *  pointer-events는 모두 걷어내고, 커서 좌표는 window에서 직접 받아온다. */
export default function HeroBackdrop() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  useCursorSpotlight(rootRef);

  return (
    <div
      ref={rootRef}
      className="absolute inset-0 overflow-hidden"
      style={{ "--hero-grid-size": `${GRID_SIZE}px` } as CSSProperties}
      aria-hidden="true"
    >
      <div className="absolute inset-0 hero-backdrop-base" />

      <div className="absolute inset-0">
        <div
          className="hero-light-ray absolute -left-[10%] top-[16%] h-16 w-[140%] -rotate-[18deg]"
          style={{ animationDelay: "0s" }}
        />
        <div
          className="hero-light-ray absolute -left-[15%] top-[50%] h-20 w-[150%] -rotate-[12deg]"
          style={{ animationDelay: "3s" }}
        />
        <div
          className="hero-light-ray absolute -left-[10%] top-[76%] h-14 w-[140%] -rotate-[22deg]"
          style={{ animationDelay: "1.5s" }}
        />
      </div>

      <GridOverlay />

      {/* 위스키 잔에서 피어오르는 불티처럼 떠오르는 앰버 임버 — 그리드 위를
          지나가도록 그리드보다 앞, 커서 스포트라이트보다는 뒤에 둔다. */}
      <HeroEmbers />

      {/* 커서를 따라다니는 앰버 스포트라이트 — 어두운 방에서 랜턴으로 격자를
          비추듯, 광원 반경 안에서만 그리드가 앰버로 점등된다. 매 프레임 바뀌는
          값은 transform과 opacity뿐이라(마스크와 그리드 좌표는 제자리에 고정)
          풀스크린 리페인트 없이 합성만으로 움직인다. */}
      <div className="hero-spot-layer">
        {/* 지나온 칸들의 잔상 — 커서가 칸을 옮길 때마다 방금 떠난 칸 자리에
            조각 하나가 남아 옅어지며 사라진다. 미리 렌더링해둔 8개 풀을
            useCursorSpotlight가 라운드로빈으로 재사용한다(React 상태 없이
            직접 DOM을 건드리는 편이 이 빈도의 업데이트엔 더 가볍다). */}
        {Array.from({ length: TRAIL_POOL_SIZE }).map((_, i) => (
          <div key={i} className="hero-cell-trail-slot">
            <div className="hero-cell-trail-fade" />
          </div>
        ))}

        {/* 커서가 들어있는 칸 자체를 코너 브라켓으로 표시하는 셀 하이라이트 —
            원형으로 번지는 스포트라이트와 달리 그리드의 정사각형 단위에
            스냅되어, "여러 정사각형이 붙어 있다"는 배경 구조 자체에 반응하는
            느낌을 준다. */}
        <div className="hero-cell-highlight" />
        <div className="hero-spot-glow" />
        <div className="hero-spot-grid-clip">
          <div className="hero-spot-grid-inner" />
          {/* 라인과 같은 560px 반경/감쇠 곡선을 공유하는 옅은 바깥쪽 노드. */}
          <div className="hero-spot-nodes-inner--far" />
        </div>
        {/* 커서에 바짝 붙었을 때만 노출되는 좁은(240px) 반경 — 같은 교차점
            패턴을 더 크고 밝은 점으로 그려서, 가까운 교차점일수록 커지고
            밝아지는 2단 발광처럼 보이게 한다. */}
        <div className="hero-spot-nodes-clip--near">
          <div className="hero-spot-nodes-inner--near" />
        </div>
      </div>
    </div>
  );
}
