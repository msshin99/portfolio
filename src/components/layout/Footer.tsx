import { useEffect, useState } from "react";
import Reveal from "../common/Reveal";

interface FooterProps {
  theme?: "dark" | "sub";
  /** AOS가 걸려있던 페이지(Home, PortfolioList)만 지정. 없으면 애니메이션 없이 렌더링. */
  revealDuration?: number;
}

const CITY = "Seoul";
const TIME_ZONE = "Asia/Seoul";
const GMT_LABEL = "GMT +09";

/** 1초마다 갱신되는 서울 시각 — "06:52:13 PM" / "Thursday, Sep 10, 2026" 두 줄로 나눠 쓴다. */
function useSeoulClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const time = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(now);

  const date = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(now);

  return { time, date };
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/** 하프톤 도트로 채워진 대각선 웨이브 그래픽 — 실제 하프톤 인쇄처럼 톤에 따라 점 크기가
 *  달라지는 건 아니고, 부드럽게 블러된 웨이브 실루엣을 마스크로 써서 점 패턴이 그 경계에서
 *  자연스럽게 옅어지도록 흉내낸 것이다. 두 겹으로 쌓는다: 아래는 크게 블러된 은은한 광원,
 *  위는 도트 패턴을 살짝만 블러된 같은 실루엣으로 마스킹해 질감을 낸다. */
/** 웨이브 실루엣이 여러 형태를 오가며 모핑되는 애니메이션에 쓰는 경로들 — 전부 시작점
 *  (1950,-40)/끝점(1950,110)과 M + 6번의 C(곡선) + Z 구조를 동일하게 유지해서, 브라우저가
 *  각 좌표를 1:1로 보간해 부드럽게 흘러가듯 모핑되게 한다(구조가 다르면 중간에 뚝뚝
 *  끊기며 바뀐다). 오른쪽 끝은 캔버스 가장자리에 항상 붙어 있어야 하니 고정해두고,
 *  왼쪽으로 뻗어나가는 리본의 굴곡·두께·끝점 위치만 네 가지로 다르게 줬다. */
const WAVE_SHAPES = [
  // 1) 완만한 대각선 리본 (기본형)
  "M1950,-40 C1650,-30 1350,30 1150,70 C880,125 620,240 360,410 C320,436 290,452 268,462 " +
    "C300,438 350,405 430,368 C660,262 940,190 1200,220 C1450,250 1700,240 1950,110 Z",
  // 2) 더 가파르게 꺾이며 얇아지는 리본, 끝점이 더 아래로
  "M1950,-40 C1700,-20 1300,90 1050,160 C800,230 550,330 330,440 C300,455 280,463 260,468 " +
    "C295,445 360,410 450,375 C720,270 1020,175 1300,150 C1550,128 1780,150 1950,60 Z",
  // 3) 완만하고 두툼한 리본, 배가 크게 부풂
  "M1950,-40 C1600,10 1250,-10 1000,80 C700,190 480,290 340,390 C310,412 285,432 265,450 " +
    "C310,420 400,370 520,320 C780,215 1080,130 1380,140 C1600,148 1800,120 1950,20 Z",
  // 4) S자에 가깝게 굽이치며 왼쪽으로 더 뻗는 리본
  "M1950,-40 C1700,20 1400,20 1150,110 C920,190 680,280 420,400 C360,428 320,445 280,458 " +
    "C330,425 410,380 510,335 C740,232 1010,140 1320,160 C1580,178 1800,210 1950,90 Z",
];

function HalftoneWave({ dotColor = "#e9e6dd" }: { dotColor?: string }) {
  const maskId = "footer-wave-mask";
  const softBlurId = "footer-wave-soft";
  const crispBlurId = "footer-wave-crisp";
  const dotsId = "footer-wave-dots";
  const sweepId = "footer-wave-sweep";
  const pathId = "footer-wave-path";
  // 마지막에 첫 모양으로 다시 돌아오게 해서, 한 바퀴 돌아도 끊김 없이 반복되게 한다.
  const morphValues = [...WAVE_SHAPES, WAVE_SHAPES[0]].join(";");

  return (
    <svg
      viewBox="0 0 1900 460"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 h-full w-full"
      aria-hidden="true"
    >
      <defs>
        <filter id={softBlurId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="26" />
        </filter>
        <filter id={crispBlurId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="10" />
        </filter>
        {/* 타일(9px) 안에서만 오가면 "제자리 꼼지락"으로 보이고, 그렇다고 도트를 아예
            고정해두면 그 위를 스치는 빛줄기 하나만 움직여서 "역동적"이라기엔 밋밋하다 —
            패턴 격자 자체를 타일 크기의 큰 배수(900 = 9의 100배)만큼 가로로 계속
            흘려보내서, 부모 폭 전체를 가로지르는 도트의 흐름이 뚜렷하게 보이도록 한다.
            900은 9의 배수라 한 바퀴 돌아도 이음매 없이 반복된다. */}
        <pattern id={dotsId} width="9" height="9" patternUnits="userSpaceOnUse">
          <circle cx="4.5" cy="4.5" r="2.4" fill={dotColor} />
          <animateTransform
            attributeName="patternTransform"
            type="translate"
            from="0 0"
            to="900 0"
            dur="3.2s"
            repeatCount="indefinite"
          />
        </pattern>
        {/* 도트 흐름 위에 넓은 빛줄기 하나가 캔버스 밖 왼쪽에서 오른쪽 끝까지 스치듯
            지나가며 역동성을 한 겹 더한다. 양 끝에서 이미 투명해진 채로 화면 밖에 있다가
            다시 시작하므로 반복 지점이 튀지 않는다. */}
        <linearGradient
          id={sweepId}
          gradientUnits="userSpaceOnUse"
          x1="-650"
          y1="-80"
          x2="-150"
          y2="540"
        >
          <stop offset="0%" stopColor={dotColor} stopOpacity="0" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="100%" stopColor={dotColor} stopOpacity="0" />
          <animateTransform
            attributeName="gradientTransform"
            type="translate"
            from="0 0"
            to="3100 0"
            dur="2.6s"
            repeatCount="indefinite"
          />
        </linearGradient>
        {/* 실제 모양은 이 path 하나에서만 정의하고, 아래 두 곳(마스크/은은한 광원)은
            <use>로 그 모양을 그대로 재사용한다 — 이러면 모핑 애니메이션이 한 곳에만
            있어도 두 레이어가 항상 완벽하게 같은 순간의 같은 모양을 그리게 된다. */}
        <path id={pathId} d={WAVE_SHAPES[0]}>
          <animate attributeName="d" values={morphValues} dur="10s" calcMode="linear" repeatCount="indefinite" />
        </path>
        <mask id={maskId}>
          <use href={`#${pathId}`} fill="#fff" filter={`url(#${crispBlurId})`} />
        </mask>
      </defs>

      <use href={`#${pathId}`} filter={`url(#${softBlurId})`} fill={dotColor} opacity="0.5" />
      <rect width="100%" height="100%" fill={`url(#${dotsId})`} mask={`url(#${maskId})`} />
      <rect
        width="100%"
        height="100%"
        fill={`url(#${sweepId})`}
        mask={`url(#${maskId})`}
        style={{ mixBlendMode: "screen" }}
      />
    </svg>
  );
}

function FooterContent({ theme }: { theme: "dark" | "sub" }) {
  const { time, date } = useSeoulClock();
  const isSub = theme === "sub";
  const year = new Date().getFullYear();

  const utilityTextClass = isSub ? "text-sub-secondary-txt" : "text-white/70";
  const utilityStrongClass = isSub ? "text-sub-primary-txt" : "text-white";

  return (
    <div>
      <div
        className={[
          "utility-bar flex items-start justify-between gap-6 pb-10",
          "font-en text-base leading-[24px] tracking-[0.01em]",
          "max-lg:flex-col max-lg:gap-3 max-lg:pb-6 max-lg:text-sm max-lg:leading-5",
        ].join(" ")}
      >
        <div className={utilityStrongClass}>
          <p className="font-medium">
            {CITY} {time}
          </p>
          <p className={utilityTextClass}>
            {date} ({GMT_LABEL})
          </p>
        </div>

        <div className={utilityStrongClass}>
          <button
            type="button"
            onClick={scrollToTop}
            className={[
              "cursor-pointer font-medium transition-opacity duration-200 hover:opacity-70",
              utilityStrongClass,
            ].join(" ")}
          >
            Back to top ↑
          </button>
          <p className={utilityTextClass}>Open for new projects · {year}</p>
        </div>

        <p className={[utilityStrongClass, "font-medium max-lg:hidden"].join(" ")}>
          ©{year} SHIN MIN SEOK
        </p>
      </div>

      {/* 이 그래픽만 부모의 max-w-[1880px]+px-10 안쪽 여백을 벗어나 화면 끝까지 꽉 채운다
          ("풀블리드"). left-1/2 + -translate-x-1/2 + w-screen 조합은 부모의 실제 패딩 값을
          몰라도 항상 뷰포트 기준으로 중앙 정렬되어 양 끝이 정확히 화면 가장자리에 맞는다. */}
      <div className="graphic relative left-1/2 w-screen -translate-x-1/2 overflow-hidden bg-black aspect-[1900/460] max-lg:aspect-[3/2] max-sm:aspect-[4/5]">
        <HalftoneWave />
        <span className="absolute left-6 bottom-6 font-en text-2xl font-bold uppercase tracking-[0.06em] text-white max-lg:text-xl max-sm:left-4 max-sm:bottom-4 max-sm:text-base">
          Shin Min Seok
        </span>
        <span className="absolute right-6 bottom-6 max-w-[70%] text-right font-en text-2xl italic font-medium text-white max-lg:text-lg max-sm:right-4 max-sm:bottom-4 max-sm:max-w-[80%] max-sm:text-sm">
          『 Design quietly. Impact loudly. 』
        </span>
        {/* 태블릿 이하에서 3열 유틸리티 바가 세로로 쌓이면서 숨긴 copyright을 그래픽 안에도
            한 줄 남겨 둔다 — 화면이 좁아도 저작권 표기가 사라지지 않도록. */}
        <p className="absolute left-6 top-6 font-en text-sm text-white/60 hidden max-lg:block max-sm:left-4 max-sm:top-4">
          ©{year} SHIN MIN SEOK
        </p>
      </div>
    </div>
  );
}

export default function Footer({ theme = "dark", revealDuration }: FooterProps) {
  // 마지막 요소의 아래 여백은 margin이 아니라 padding으로 준다 — margin-bottom은 부모/body에
  // border·padding·overflow가 없으면 그대로 밖으로 collapse되어(margin collapsing) body
  // 바깥(html)까지 스크롤 영역을 늘려버리는데, 그 늘어난 부분은 .wrap의 배경색(bg-black)이
  // 칠해지는 범위 밖이라 브라우저 기본 배경(흰색)이 그대로 드러나 페이지 맨 아래에 흰 여백이
  // 남는 문제가 있었다. padding은 collapse되지 않고 박스 안쪽 여백으로 남아 배경색 범위에
  // 포함되므로 이 문제가 생기지 않는다.
  if (revealDuration != null) {
    return (
      <Reveal as="footer" duration={revealDuration} className="max-w-[1880px] px-10 mx-auto pb-0 max-lg:px-5 max-sm:px-[10px]">
        <FooterContent theme={theme} />
      </Reveal>
    );
  }

  return (
    <footer className="max-w-[1880px] px-10 mx-auto pb-0 max-lg:px-5 max-sm:px-[10px]">
      <FooterContent theme={theme} />
    </footer>
  );
}
