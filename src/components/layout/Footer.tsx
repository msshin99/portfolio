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
function HalftoneWave({ dotColor = "#e9e6dd" }: { dotColor?: string }) {
  const maskId = "footer-wave-mask";
  const softBlurId = "footer-wave-soft";
  const crispBlurId = "footer-wave-crisp";
  const dotsId = "footer-wave-dots";

  const blobA =
    "M1950,-40 C1650,-30 1350,30 1150,70 C880,125 620,240 360,410 C320,436 290,452 268,462 " +
    "C300,438 350,405 430,368 C660,262 940,190 1200,220 C1450,250 1700,240 1950,110 Z";

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
        {/* 타일 안의 점 자체에 CSS transform/animation을 걸면 크롬이 패턴을 더 이상
            반복 타일로 그리지 않고 뭉개서 그려버린다(도트가 사라지고 뿌연 덩어리로 보임).
            SMIL(animate/animateTransform)은 CSS가 아니라 속성 자체를 바꾸는 방식이라
            이 문제가 없어서, 이동(patternTransform)과 크기 변화(r)를 둘 다 SMIL로 건다.
            duration을 짧게(1.2~1.4초) 잡아서 천천히 흐르는 느낌이 아니라 실제로 살아
            움직이는 듯한 역동적인 웨이브가 되도록 했다. */}
        <pattern id={dotsId} width="9" height="9" patternUnits="userSpaceOnUse">
          <circle cx="4.5" cy="4.5" r="2.4" fill={dotColor}>
            <animate attributeName="r" values="1.1;3.3;1.1" dur="1.4s" repeatCount="indefinite" />
          </circle>
          <animateTransform
            attributeName="patternTransform"
            type="translate"
            from="0 0"
            to="9 9"
            dur="1.2s"
            repeatCount="indefinite"
          />
        </pattern>
        <mask id={maskId}>
          <path d={blobA} fill="#fff" filter={`url(#${crispBlurId})`} />
        </mask>
      </defs>

      <path d={blobA} filter={`url(#${softBlurId})`} fill={dotColor} opacity="0.5" />
      <rect width="100%" height="100%" fill={`url(#${dotsId})`} mask={`url(#${maskId})`} />
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
      <Reveal as="footer" duration={revealDuration} className="max-w-[1880px] px-10 mx-auto pb-[100px] max-lg:px-5 max-lg:pb-[70px] max-sm:px-[10px] max-sm:pb-[40px]">
        <FooterContent theme={theme} />
      </Reveal>
    );
  }

  return (
    <footer className="max-w-[1880px] px-10 mx-auto pb-[100px] max-lg:px-5 max-lg:pb-[70px] max-sm:px-[10px] max-sm:pb-[40px]">
      <FooterContent theme={theme} />
    </footer>
  );
}
