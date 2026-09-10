import { useState } from "react";
import { motion } from "framer-motion";
import WorkCard from "../components/common/WorkCard";
import DeviceSwiper from "../components/portfolio/DeviceSwiper";
import FontStyleGuide from "../components/portfolio/FontStyleGuide";
import ColorCard from "../components/portfolio/ColorCard";
import ButtonStyleGuide from "../components/portfolio/ButtonStyleGuide";
import InputStyleGuide from "../components/portfolio/InputStyleGuide";
import Reveal from "../components/common/Reveal";
import StaggerReveal from "../components/common/StaggerReveal";
import type { PortfolioDetail as PortfolioDetailData } from "../data/portfolioDetails";
import { usePortfolios, mapRowToWorkItem } from "../lib/portfolioApi";

interface PortfolioDetailContentProps {
  detail: PortfolioDetailData;
  /** 모달(오버레이)로 열렸을 때만 전달 — 리스트 썸네일(WorkCard)과 같은 layoutId를 공유해서
   *  히어로 이미지가 썸네일 위치/크기에서 자연스럽게 모프되어 들어오게 한다. detail.visual과
   *  WorkCard가 쓰는 썸네일이 이제 완전히 같은 파일이라(data/works.ts 참고), 크로스페이드 없이
   *  이 모프 하나만으로 "같은 사진이 자연스럽게 커진다"가 성립한다. */
  heroLayoutId?: string;
  /** heroLayoutId가 있을 때만 의미 있음. 히어로 이미지의 layoutId 모프가 실제로 다 끝났는지 —
   *  끝나기 전까진 아래 본문(제목/설명 등, 어두운 텍스트)을 숨겨둔다. 모달의 흰 배경도 이
   *  시점에 맞춰 나타나므로(PortfolioDetailModal 참고), 미리 보이면 어두운 배경 위에 어두운
   *  텍스트가 겹쳐 안 보이게 된다. */
  heroSettled?: boolean;
  /** heroLayoutId가 있을 때만 호출됨 — 히어로 이미지의 layoutId 모프가 끝나는 순간 트리거. */
  onHeroSettled?: () => void;
}

/** 히어로 이미지가 썸네일 위치/크기에서 상세 히어로 크기로 모프되는 속도. 스프링은 정확한
 *  길이를 보장하지 않아 "지금 얼마나 느려졌는지" 가늠하기 어려워서, 눈으로 분명히 확인할 수
 *  있도록 duration이 고정된 tween으로 바꾸고 충분히 길게(1.4초) 잡았다. ease-out 계열
 *  ([0.22,1,0.36,1] 등)은 커지는 움직임이 처음 4~500ms 안에 거의 다 끝나버려서 duration을
 *  늘려도 "여전히 순식간에 끝난다"는 인상을 줬다 — 대칭적인 ease-in-out으로 바꿔서 움직임이
 *  전체 구간에 고르게 퍼지도록 했다. */
const HERO_MORPH_TRANSITION = { type: "tween" as const, duration: 1.4, ease: [0.65, 0, 0.35, 1] as const };

/** 컬러 시스템 타이틀("OO 속에서 더 또렷해지는" 형태)을 "속에서" 기준으로 앞/뒤 두 구간으로
 *  나눈다 — 앞쪽은 얇게(Thin), 강조되는 뒤쪽은 굵게(ExtraBold) 렌더링해서 Component 섹션
 *  타이틀과 같은 2단 굵기 스타일을 준다. "속에서"가 없는 타이틀은 전체를 뒤쪽(굵게)으로 취급한다. */
function splitTitleEmphasis(title: string): [string, string] {
  const marker = "속에서";
  const idx = title.indexOf(marker);
  if (idx === -1) return ["", title];
  const cut = idx + marker.length + 1; // "속에서" 뒤 공백 한 칸까지 앞쪽에 포함
  return [title.slice(0, cut), title.slice(cut)];
}

/**
 * PortfolioDetail 페이지의 본문. Header/Footer를 감싸는 껍데기(PortfolioDetail.tsx, 풀 페이지용)와
 * 모달 오버레이 껍데기(PortfolioDetailModal.tsx) 양쪽에서 그대로 재사용한다.
 */
export default function PortfolioDetailContent({
  detail,
  heroLayoutId,
  heroSettled = true,
  onHeroSettled,
}: PortfolioDetailContentProps) {
  // Related Projects: 지금 보고 있는 프로젝트 자신은 제외하고, 다른 프로젝트로 이동할 수
  // 있는 카드를 최대 3개까지만 보여준다.
  const { rows: relatedRows } = usePortfolios();
  const relatedWorks = (relatedRows ?? [])
    .filter((row) => row.slug !== detail.slug)
    .slice(0, 3)
    .map(mapRowToWorkItem);
  const isDark = detail.slug === "goldenpine";
  const [hoveredColorIndex, setHoveredColorIndex] = useState<number | null>(null);
  // 형광펜 배지의 샤인 스윕은 -160%의 initial x를 갖는데, 배지 자체가 overflow-hidden이라
  // 그 위치에서는 IntersectionObserver 상 뷰포트 교차 영역이 0이 되어 whileInView가 절대
  // 트리거되지 않는다(스윕을 담당하는 span 자신은 화면에 보이지 않게 숨겨둔 상태이므로).
  // 그래서 위치가 바뀌지 않는 배지 wrapper의 등장을 별도로 감지해 state로 넘기고,
  // 샤인 span은 그 state를 animate로 그대로 반영한다.
  const [taskBadgeInView, setTaskBadgeInView] = useState(false);

  return (
    <>
      <div className="visual sub w-full h-screen overflow-hidden relative mb-[100px] max-lg:h-auto max-lg:mb-20 max-sm:h-[50vh] max-sm:mb-10">
        <figure className="w-full h-full relative overflow-hidden">
          {heroLayoutId ? (
            // WorkCard와 마찬가지로 layoutId는 콘텐츠 없는 wrapper div에 걸고, 실제 <img>는
            // 일반 img로 둔다 — 이미지에 직접 layoutId를 걸면 3:2 썸네일과 풀스크린 히어로의
            // 비율 차이 때문에 framer-motion이 자동으로 두 인스턴스를 crossfade시켜서 전환 중
            // 잔상처럼 보이는 문제가 있었다(자세한 이유는 WorkCard.tsx 주석 참고). 안쪽 img에
            // framer의 layout prop을 주면 부모가 작아지는 것과 반대로 역보정 transform이 걸려서
            // 사진 자체는 항상 풀스크린 크기 그대로 있고 부모 박스만 넓어지는 것처럼 보이는
            // — 즉 "사진이 커진다"가 아니라 "창이 넓어진다"로 바뀌어버리는 문제가 있었다.
            <motion.div
              layoutId={heroLayoutId}
              className="w-full h-full"
              transition={HERO_MORPH_TRANSITION}
              onLayoutAnimationComplete={onHeroSettled}
            >
              <img src={detail.visual} alt="" className="w-full h-full object-cover block" />
            </motion.div>
          ) : (
            <img src={detail.visual} alt="" className="w-full h-full object-cover block" />
          )}
        </figure>
      </div>

      <motion.div
        initial={heroLayoutId ? { opacity: 0, y: 32 } : false}
        animate={heroSettled ? { opacity: 1, y: 0 } : { opacity: 0, y: 32 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
      <div className="subpage max-w-[1880px] mx-auto px-10 max-sm:px-4">
        <div className="portfolio-info mb-20 max-lg:mb-15 max-sm:mb-15">
          <div className="top-title mb-10 max-lg:mb-6 max-sm:mb-[18px]">
            <h3 className="text-[60px] leading-[72px] font-bold mb-2 max-sm:mb-1">{detail.title}</h3>
            <p className="font-ko text-lg leading-[26px] font-light text-sub-secondary-txt max-lg:text-base max-sm:text-[15px]">
              {detail.subtitle}
            </p>
          </div>

          <div className="middle-txt flex justify-between gap-[60px] mb-6 max-w-[1700px] max-lg:flex-col max-lg:gap-[30px] max-lg:mb-10 max-sm:gap-[26px] max-sm:mb-8">
            <div className="left max-w-[900px] min-w-[500px] w-full max-lg:max-w-full max-lg:min-w-0">
              {detail.description.map((p, i) => (
                <p
                  key={i}
                  className="font-ko text-base leading-6 font-light text-sub-secondary-txt mb-4 last:mb-0 max-lg:text-[15px] max-sm:text-sm max-sm:leading-[22px]"
                >
                  {p}
                </p>
              ))}
            </div>
            <ul className="right max-w-[480px] w-full max-lg:max-w-full">
              {detail.meta.map((row) => {
                const isMyTask = row.label === "My Task";
                return (
                  <li key={row.label} className="mb-6 flex last:mb-0 max-lg:mb-[18px] max-sm:mb-[14px]">
                    <span className="font-en text-sm leading-[22px] font-medium text-sub-primary-txt inline-block w-full max-w-[180px]">
                      {row.label}
                    </span>
                    <span className="font-ko text-[15px] leading-[22px] max-sm:text-sm">
                      {isMyTask ? (
                        <motion.span
                          onViewportEnter={() => setTaskBadgeInView(true)}
                          viewport={{ once: true }}
                          className="relative inline-block overflow-hidden rounded-md px-2 py-1"
                        >
                          <motion.span
                            initial={{ scaleX: 0 }}
                            animate={taskBadgeInView ? { scaleX: 1 } : undefined}
                            transition={{ duration: 0.5, ease: [0.65, 0, 0.35, 1] }}
                            className="absolute inset-0 origin-left bg-sub-primary-txt/10"
                          />
                          <motion.span
                            initial={{ scale: 0.85, opacity: 0 }}
                            animate={taskBadgeInView ? { scale: 1, opacity: 1 } : undefined}
                            transition={{ type: "spring", stiffness: 320, damping: 14, delay: 0.35 }}
                            className="relative inline-block font-semibold text-sub-primary-txt"
                          >
                            {row.value}
                          </motion.span>
                          {taskBadgeInView ? (
                            <motion.span
                              aria-hidden
                              initial={{ x: "-160%" }}
                              animate={{ x: "260%" }}
                              transition={{
                                duration: 1.1,
                                ease: "easeInOut",
                                delay: 1.1,
                                repeat: Infinity,
                                repeatDelay: 2.2,
                              }}
                              className="pointer-events-none absolute inset-y-0 left-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/90 to-transparent"
                            />
                          ) : null}
                        </motion.span>
                      ) : (
                        <span className="font-normal text-sub-primary-txt">{row.value}</span>
                      )}{" "}
                      {row.note ? <b className="text-sub-primary-txt font-medium">{row.note}</b> : null}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          {detail.websiteUrl ? (
            <a
              href={detail.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={[
                "more group font-en text-base leading-6 font-medium flex items-center gap-1.5 w-fit px-6 py-3 rounded-full border transition-all duration-500 ease-[ease] max-sm:text-sm max-sm:leading-[22px] max-sm:px-5 max-sm:py-2.5",
                isDark
                  ? "bg-white text-black border-white hover:bg-black hover:text-white"
                  : "bg-sub-primary-txt text-white border-sub-primary-txt hover:bg-white hover:text-sub-primary-txt",
              ].join(" ")}
            >
              Go to website
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="max-sm:w-[18px]">
                <path
                  d="M8.33325 3.33337H3.33325V16.6667H16.6666V11.6667"
                  stroke={isDark ? "#000000" : "white"}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`transition-all duration-500 ease-[ease] ${isDark ? "group-hover:stroke-white" : "group-hover:stroke-[#222]"}`}
                />
                <path
                  d="M14.1667 3.33337L16.6667 5.83337L14.1667 8.33337"
                  stroke={isDark ? "#000000" : "white"}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`transition-all duration-500 ease-[ease] ${isDark ? "group-hover:stroke-white" : "group-hover:stroke-[#222]"}`}
                />
                <path
                  d="M15.8333 5.83337H13C11.3431 5.83337 10 7.17652 10 8.83337V10"
                  stroke={isDark ? "#000000" : "white"}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`transition-all duration-500 ease-[ease] ${isDark ? "group-hover:stroke-white" : "group-hover:stroke-[#222]"}`}
                />
              </svg>
            </a>
          ) : null}
        </div>

        <Reveal duration={1500} className="box-container mb-[140px] flex gap-5 max-lg:flex-col max-lg:mb-[100px] max-sm:mb-[60px] max-sm:gap-3">
          <div className="left w-1/2 flex flex-col justify-between max-lg:w-full max-lg:gap-5 max-sm:gap-3">
            <figure className="web relative rounded-md overflow-hidden">
              <img src={detail.boxContainer.sub1} alt="" className="rounded-md max-w-full h-auto" />
            </figure>
            <figure className="relative rounded-md">
              <img src={detail.boxContainer.sub2} alt="" className="rounded-md max-w-full h-auto" />
            </figure>
          </div>
          <div className="right w-1/2 rounded-md max-lg:w-full">
            <DeviceSwiper slides={detail.boxContainer.device} />
          </div>
        </Reveal>

        <Reveal duration={1500} className="sub-title award max-w-[1530px] mx-auto flex justify-between gap-[60px] mb-20 max-lg:flex-col max-lg:gap-5 max-lg:mb-15 max-sm:gap-2 max-sm:mb-6">
          <span className="text-sub-secondary-txt text-sm">[Ui Element]</span>
          <p className="font-en text-[32px] leading-[42px] font-medium text-sub-primary-txt max-w-[1024px] max-lg:text-[28px] max-lg:leading-[38px] max-sm:text-lg max-sm:leading-[26px]">
            Establishing a consistent design foundation through font and color palette.
          </p>
        </Reveal>

        {detail.fontInfoBlocks.map((block, i) => (
          <Reveal key={i} duration={1500}>
            <FontStyleGuide block={block} isDark={isDark} />
          </Reveal>
        ))}

        <div className="color-info mb-[140px] max-lg:mb-[100px] max-sm:mb-[60px]">
          <Reveal duration={1500} className="sub-txt max-w-[1530px] mx-auto mb-10">
            <h5 className="tit mb-5 max-lg:mb-3.5 max-sm:mb-2">
              <span className="inline-flex w-fit items-center justify-center rounded-full border border-sub-primary-txt px-8 py-[18px] font-ko text-lg font-semibold uppercase leading-4 text-sub-primary-txt max-lg:px-6 max-lg:py-3.5 max-lg:text-base max-sm:px-5 max-sm:py-3 max-sm:text-sm">
                Color Style
              </span>
            </h5>
            {detail.colorInfo.title ? (
              <div className="flex items-start justify-between gap-[60px] max-lg:flex-col max-lg:gap-4">
                <p className="font-ko text-[46px] leading-[46px] font-thin text-sub-primary-txt max-w-[600px] [word-break:keep-all] max-lg:text-[34px] max-lg:leading-[42px] max-sm:text-[24px] max-sm:leading-[32px]">
                  {(() => {
                    const [lead, emphasis] = splitTitleEmphasis(detail.colorInfo.title);
                    return (
                      <>
                        {lead}
                        <b className="font-extrabold">{emphasis}</b>
                      </>
                    );
                  })()}
                </p>
                <p className="sub font-ko text-base leading-6 font-light tracking-[-0.4px] text-sub-tertiary-txt max-w-[663px] [word-break:keep-all] max-sm:text-sm max-sm:leading-5">
                  {detail.colorInfo.description}
                </p>
              </div>
            ) : (
              <p className="sub font-ko text-base leading-6 font-light text-sub-secondary-txt [word-break:keep-all] max-sm:text-sm max-sm:leading-5">
                {detail.colorInfo.description}
              </p>
            )}
          </Reveal>

          <StaggerReveal
            as="ul"
            className="color-card award max-w-[1530px] mx-auto flex max-lg:flex-col"
            y={30}
            fromScale={0.9}
            stagger={0.06}
          >
            {detail.colorInfo.cards.map((card, i) => (
              <ColorCard
                key={i}
                card={card}
                index={i}
                hoveredIndex={hoveredColorIndex}
                onHover={setHoveredColorIndex}
              />
            ))}
          </StaggerReveal>
        </div>

        {detail.buttonInfoBlocks.length > 0 || detail.hasInputGuide ? (
          <Reveal duration={1500} className="max-w-[1530px] mx-auto mb-20 max-lg:mb-14 max-sm:mb-8">
            <h5 className="tit mb-5 max-lg:mb-3.5 max-sm:mb-2">
              <span className="inline-flex w-fit items-center justify-center rounded-full border border-sub-primary-txt px-8 py-[18px] font-ko text-lg font-semibold uppercase leading-4 text-sub-primary-txt max-lg:px-6 max-lg:py-3.5 max-lg:text-base max-sm:px-5 max-sm:py-3 max-sm:text-sm">
                Component
              </span>
            </h5>
            <div className="flex items-start justify-between gap-[60px] max-lg:flex-col max-lg:gap-4">
              <p className="font-ko text-[46px] leading-[46px] font-thin text-sub-primary-txt shrink-0 whitespace-nowrap max-lg:text-[34px] max-lg:leading-[42px] max-sm:whitespace-normal max-sm:text-[24px] max-sm:leading-[32px]">
                일관된 사용성에 집중한, <b className="font-extrabold">컴포넌트</b>
              </p>
              <p className="font-ko text-sm leading-[22px] font-light text-sub-tertiary-txt max-w-[500px] [word-break:keep-all] max-sm:text-xs">
                버튼과 인풋의 크기·여백·상태 값을 하나의 기준으로 통일해, 어떤 화면에서도 예측 가능하고 일관된 사용자 경험을 제공합니다.
                사소한 차이도 하나의 규칙 안에서 정의했습니다.
              </p>
            </div>
          </Reveal>
        ) : null}

        {detail.buttonInfoBlocks.map((block, i) => (
          <Reveal key={i} duration={1500}>
            <ButtonStyleGuide
              radius={block.radius}
              fontLabel={block.fontLabel}
              buttonWidth={block.buttonWidth}
              buttonHeight={block.buttonHeight}
            />
          </Reveal>
        ))}

        {detail.hasInputGuide ? (
          <Reveal duration={1500}>
            <InputStyleGuide />
          </Reveal>
        ) : null}
      </div>

      <Reveal duration={1500} className="web overflow-hidden mt-40 max-lg:mt-28 max-sm:mt-16">
        <div className={`cont ${detail.slug} relative w-full max-w-full mx-auto`}>
          <a href="" className="block w-full max-w-[1320px] mx-auto">
            <img src={detail.mainImage} alt="" className="w-full" />
          </a>
        </div>
      </Reveal>

      <div className="subpage max-w-[1880px] mx-auto px-10 max-sm:px-4">
        <div className="portfolio-list pt-[180px] pb-20 max-lg:pt-[140px] max-lg:pb-[60px] max-[767px]:pt-[100px] max-[767px]:pb-10">
          <div className="mb-[140px] max-lg:mb-[100px] max-[767px]:mb-20">
            <Reveal duration={1500}>
              <h2 className="font-en text-[68px] leading-[76px] font-medium mb-[30px] max-lg:text-[56px] max-lg:leading-[66px] max-lg:mb-6 max-sm:text-[40px] max-sm:leading-[48px] max-sm:mb-[18px]">
                Related Projects
              </h2>
            </Reveal>
            <StaggerReveal as="ul" className="work-list sub-page grid grid-cols-3 justify-between gap-x-5 gap-y-10 max-[767px]:grid-cols-1 max-[767px]:gap-7">
              {relatedWorks.map((item) => (
                <WorkCard key={item.title} item={item} subPage />
              ))}
            </StaggerReveal>
          </div>
        </div>
      </div>
      </motion.div>
    </>
  );
}
