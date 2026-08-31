import { motion } from "framer-motion";
import WorkCard from "../components/common/WorkCard";
import DeviceSwiper from "../components/portfolio/DeviceSwiper";
import FontStyleGuide from "../components/portfolio/FontStyleGuide";
import ColorCard from "../components/portfolio/ColorCard";
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
  // Related Projects: Supabase에 등록된 전체 프로젝트를 그대로 보여준다(기존 정적
  // relatedWorks도 항상 nordune/goalcheck/prmr 전부를 보여줬고, 보고 있는 프로젝트 자신도
  // 포함되는 동작이었다 — 그 동작을 그대로 유지).
  const { rows: relatedRows } = usePortfolios();
  const relatedWorks = (relatedRows ?? []).map(mapRowToWorkItem);

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
              {detail.meta.map((row) => (
                <li key={row.label} className="mb-6 flex last:mb-0 max-lg:mb-[18px] max-sm:mb-[14px]">
                  <span className="font-en text-sm leading-[22px] font-medium text-sub-primary-txt inline-block w-full max-w-[180px]">
                    {row.label}
                  </span>
                  <span className="font-ko text-sm leading-[22px] font-light text-sub-tertiary-txt">
                    {row.value} {row.note ? <b className="text-sub-primary-txt font-medium">{row.note}</b> : null}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <a
            href={detail.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="more group font-en text-base leading-6 font-medium bg-sub-primary-txt text-white flex items-center gap-1.5 w-fit px-6 py-3 rounded-full border border-sub-primary-txt transition-all duration-500 ease-[ease] hover:bg-white hover:text-sub-primary-txt max-sm:text-sm max-sm:leading-[22px] max-sm:px-5 max-sm:py-2.5"
          >
            Go to website
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="max-sm:w-[18px]">
              <path
                d="M8.33325 3.33337H3.33325V16.6667H16.6666V11.6667"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-all duration-500 ease-[ease] group-hover:stroke-[#222]"
              />
              <path
                d="M14.1667 3.33337L16.6667 5.83337L14.1667 8.33337"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-all duration-500 ease-[ease] group-hover:stroke-[#222]"
              />
              <path
                d="M15.8333 5.83337H13C11.3431 5.83337 10 7.17652 10 8.83337V10"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-all duration-500 ease-[ease] group-hover:stroke-[#222]"
              />
            </svg>
          </a>
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
            <FontStyleGuide block={block} />
          </Reveal>
        ))}

        <div className="color-info mb-[140px] max-lg:mb-[100px] max-sm:mb-[60px]">
          <Reveal duration={1500} className="sub-txt max-w-[1530px] mx-auto mb-10">
            <h5 className="tit font-en text-[26px] leading-[34px] font-medium text-sub-primary-txt mb-5 max-lg:text-[22px] max-lg:leading-[32px] max-lg:mb-3.5 max-sm:text-xl max-sm:leading-7 max-sm:mb-2">
              Color Concept
            </h5>
            <p className="sub font-ko text-base leading-6 font-light text-sub-secondary-txt [word-break:keep-all] max-sm:text-sm max-sm:leading-5">
              {detail.colorInfo.description}
            </p>
          </Reveal>

          <StaggerReveal
            as="ul"
            className="color-card award max-w-[1530px] mx-auto grid grid-cols-5 gap-5 max-lg:grid-cols-3 max-lg:gap-4 max-sm:grid-cols-2 max-sm:gap-3"
            y={30}
            fromScale={0.9}
            stagger={0.06}
          >
            {detail.colorInfo.cards.map((card) => (
              <ColorCard key={card.name} card={card} />
            ))}
          </StaggerReveal>
        </div>
      </div>

      <Reveal duration={1500} className="web overflow-hidden">
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
