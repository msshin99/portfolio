import { useState } from "react";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import Preloader from "../components/common/Preloader";
import Hero from "../components/home/Hero";
import IntroTop from "../components/home/IntroTop";
import Reveal from "../components/common/Reveal";
import StaggerReveal from "../components/common/StaggerReveal";
import WorkCard from "../components/common/WorkCard";
import SeeAllWorkLink from "../components/common/SeeAllWorkLink";
import KeywordCard from "../components/common/KeywordCard";
import SkillSwiper from "../components/common/SkillSwiper";
import SectionTitle from "../components/common/SectionTitle";
import ClientMarqueeList, { DEFAULT_CLIENT_ROWS, type ClientRowItem } from "../components/home/ClientMarqueeList";
import WorkTogether, { DEFAULT_WORK_TOGETHER_TEXT } from "../components/home/WorkTogether";
import HeroDiagram, {
  HERO_DIAGRAM_HEADING,
  HERO_DIAGRAM_SUBTEXT,
  HERO_DIAGRAM_CENTER_LABEL,
  HERO_DIAGRAM_LLM_LABEL,
  HERO_DIAGRAM_LEFT_ITEMS,
  HERO_DIAGRAM_RIGHT_ITEMS,
  HERO_FEATURE_CARDS,
  PILL_ICON_KEYS,
  FEATURE_ICON_KEYS,
  type DiagramPillItem,
  type FeatureCardItem,
} from "../components/home/HeroDiagram";
import { keywords as defaultKeywords, type KeywordItem } from "../data/keywords";
import { skillGroups, type SkillSlide } from "../data/skills";
import {
  DEFAULT_HERO_LABEL,
  DEFAULT_HERO_TAGLINE,
  DEFAULT_HERO_STATEMENT,
  DEFAULT_HERO_BIO,
  DEFAULT_HERO_BIO_KO,
  DEFAULT_INTRO_HEADING,
  DEFAULT_INTRO_DESCRIPTION,
  DEFAULT_WORKS_SUBTXT,
  DEFAULT_WORKS_TITLE,
  DEFAULT_WORKS_DESCRIPTION,
  DEFAULT_SKILLS_SUBTXT,
  DEFAULT_SKILLS_TITLE,
} from "../data/siteDefaults";
import { usePortfolios, mapRowToWorkItem } from "../lib/portfolioApi";
import { useSiteContent, getSiteText, getSiteTextOptional, getSiteImage } from "../lib/siteContentApi";

const DEFAULT_INTRO_HEADING_KO =
  "디자인은 사람을 움직이고, 사람은 세상을 움직입니다. 디자인은 보이는 것이 아니라 느끼고, 기억하고, 연결되는 것입니다.";

/** 관리자가 site_content에 keyword_{n}_title/sub/image를 채우면 그 값으로, 비워두면
 *  data/keywords.ts의 기본 콘텐츠로 대체된다. "01." 같은 번호 라벨은 관리자가 편집할 수
 *  없는 위치 표시용이라 원본 데이터의 num을 그대로 쓴다. */
function resolveKeywords(siteContent: Parameters<typeof getSiteText>[0]): KeywordItem[] {
  return defaultKeywords.map((kw, i) => {
    const n = i + 1;
    return {
      num: kw.num,
      title: getSiteText(siteContent, `keyword_${n}_title`, kw.title),
      sub: getSiteText(siteContent, `keyword_${n}_sub`, kw.sub),
      image: getSiteImage(siteContent, `keyword_${n}_image`, kw.image),
    };
  });
}

/** site_content에 담긴 아이콘 key 문자열이 유효한 값인지 확인한다 — 관리자가 목록에 없는
 *  값을 잘못 저장했거나 아직 한 번도 편집하지 않아 빈 문자열인 경우 기본 아이콘으로
 *  대체해서, 화면에서 아이콘이 통째로 안 그려지는 사고를 막는다. */
function resolvePillIcon(value: string, fallback: DiagramPillItem["icon"]): DiagramPillItem["icon"] {
  return (PILL_ICON_KEYS as string[]).includes(value) ? (value as DiagramPillItem["icon"]) : fallback;
}
function resolveFeatureIcon(value: string, fallback: FeatureCardItem["icon"]): FeatureCardItem["icon"] {
  return (FEATURE_ICON_KEYS as string[]).includes(value) ? (value as FeatureCardItem["icon"]) : fallback;
}

/** 관리자가 site_content에 hero_pill_{side}_{n}_label/icon을 채우면 그 값으로, 비워두면
 *  HeroDiagram.tsx의 기본 pill 목록을 그대로 쓴다. */
function resolveHeroPills(
  siteContent: Parameters<typeof getSiteText>[0],
  side: "left" | "right",
  defaults: DiagramPillItem[]
): DiagramPillItem[] {
  return defaults.map((item, i) => {
    const n = i + 1;
    const iconText = getSiteText(siteContent, `hero_pill_${side}_${n}_icon`, item.icon);
    return {
      icon: resolvePillIcon(iconText, item.icon),
      label: getSiteText(siteContent, `hero_pill_${side}_${n}_label`, item.label),
    };
  });
}

/** 관리자가 site_content에 hero_feature_{n}_heading1/heading2/body/icon을 채우면 그
 *  값으로, 비워두면 HeroDiagram.tsx의 기본 카드 3개를 그대로 쓴다. */
function resolveHeroFeatures(siteContent: Parameters<typeof getSiteText>[0]): FeatureCardItem[] {
  return HERO_FEATURE_CARDS.map((item, i) => {
    const n = i + 1;
    const iconText = getSiteText(siteContent, `hero_feature_${n}_icon`, item.icon);
    return {
      icon: resolveFeatureIcon(iconText, item.icon),
      heading: [
        getSiteText(siteContent, `hero_feature_${n}_heading1`, item.heading[0]),
        // heading2는 "둘째 줄"이 없는 한 줄짜리 제목도 허용해야 해서, 관리자가
        // 일부러 비워 저장했다면 예전 기본 문구로 되돌아가지 않고 빈 문자열을
        // 그대로 쓴다(getSiteTextOptional 참고).
        getSiteTextOptional(siteContent, `hero_feature_${n}_heading2`, item.heading[1]),
      ],
      body: getSiteText(siteContent, `hero_feature_${n}_body`, item.body),
    };
  });
}

/** 관리자가 site_content에 skill_{key}_image/skill_{key}_hover_image를 채우면 그
 *  값으로, 비워두면 data/skills.ts의 기본 아이콘 이미지를 그대로 쓴다. */
function resolveSkillGroups(siteContent: Parameters<typeof getSiteText>[0]): [SkillSlide, SkillSlide][] {
  return skillGroups.map(
    (pair) =>
      pair.map((slide) => ({
        ...slide,
        image: getSiteImage(siteContent, `skill_${slide.key}_image`, slide.image),
        imageHover: getSiteImage(siteContent, `skill_${slide.key}_hover_image`, slide.imageHover),
      })) as [SkillSlide, SkillSlide]
  );
}

/** 관리자가 site_content에 client_row_{n}_*를 채우면 그 값으로, 비워두면
 *  ClientMarqueeList.tsx의 기본 서비스 라인업 4개를 그대로 쓴다. */
function resolveClientRows(siteContent: Parameters<typeof getSiteText>[0]): ClientRowItem[] {
  return DEFAULT_CLIENT_ROWS.map((row, i) => {
    const n = i + 1;
    return {
      category: getSiteText(siteContent, `client_row_${n}_category`, row.category),
      title: getSiteText(siteContent, `client_row_${n}_title`, row.title),
      meta: getSiteText(siteContent, `client_row_${n}_meta`, row.meta),
      image: getSiteImage(siteContent, `client_row_${n}_image`, row.image),
      marqueeParts: [
        getSiteText(siteContent, `client_row_${n}_marquee1`, row.marqueeParts[0]),
        getSiteText(siteContent, `client_row_${n}_marquee2`, row.marqueeParts[1]),
      ],
    };
  });
}

const sectionBase = "max-w-[1880px] mx-auto px-10 max-lg:px-10 max-sm:px-5";
const sectionClass = `${sectionBase} mb-[280px] max-lg:mb-[240px] max-sm:mb-[180px]`;
// work 섹션 바로 아래엔 WorkTogether 마퀴가 자체 상단 padding(모바일 60px)을
// 이미 갖고 있어, 다른 섹션과 똑같이 mb-[180px]를 쓰면 두 요소 사이 간격이
// 합산되어(180+60=240px) 유독 휑하게 벌어져 보였다 — 모바일에서만 이 섹션의
// 여백을 조금 줄인다.
const workSectionClass = `${sectionBase} mb-[280px] max-lg:mb-[240px] max-sm:mb-[100px]`;

/**
 * My Works 카드 너비 — 피그마 선택 노드(2007:214) 실측 기준.
 * 1/2/3행 모두 justify-between 행 안에서 카드 자체에 명시적 너비를 줘서, 큰 카드는
 * 왼쪽(또는 오른쪽)에 크게, 작은 카드는 반대쪽에 작게 붙고 그 사이는 여백으로 남는다.
 * (컨테이너 1840px 기준 큰 카드 910px≈1/2, 작은 카드 600px≈1/3 — 그대로도 거의 정확히 맞는다.)
 */
const BIG_CARD = "grow-0 shrink-0 basis-1/2 max-sm:basis-auto max-sm:w-full";
const SMALL_CARD = "grow-0 shrink-0 basis-1/3 max-sm:basis-auto max-sm:w-full";

/** 관리자가 메인에 노출시킨 최대 6개 항목이 1~6번 슬롯 순서대로 이 3행(2칸씩)에 채워진다.
 *  레이아웃/카드 크기는 그대로 두고 데이터 소스만 Supabase로 바꿨다 — 6개 미만이면
 *  뒷 슬롯(행)은 그냥 렌더링되지 않는다(관리자가 더 등록하면 자동으로 채워짐). */
const HOME_SLOT_WIDTHS = [BIG_CARD, SMALL_CARD, SMALL_CARD, BIG_CARD, SMALL_CARD, SMALL_CARD];

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

export default function Home() {
  // Preloader가 화면을 가리고 있는 동안 흘러버린 시간은 사용자 눈엔 없었던
  // 셈이라, Hero의 등장 애니메이션이나 "몇 초 후 전환" 같은 연출은 이 값이
  // true가 된 뒤(=인트로가 실제로 콘텐츠를 드러내기 시작한 뒤)부터
  // 시작해야 한다.
  const [introDone, setIntroDone] = useState(false);
  const { rows, loading: portfoliosLoading } = usePortfolios();
  const { rows: siteContent } = useSiteContent();
  const introHeading = getSiteText(siteContent, "intro_heading", DEFAULT_INTRO_HEADING);
  const introDescription = getSiteText(siteContent, "intro_description", DEFAULT_INTRO_DESCRIPTION);
  const resolvedKeywords = resolveKeywords(siteContent);
  const heroDiagramHeadingText = getSiteText(
    siteContent,
    "hero_diagram_heading",
    HERO_DIAGRAM_HEADING.join("\n")
  );
  const [heroDiagramHeadingLine1, heroDiagramHeadingLine2] = heroDiagramHeadingText.split("\n");
  const heroDiagramHeading: [string, string] = [
    heroDiagramHeadingLine1 ?? HERO_DIAGRAM_HEADING[0],
    heroDiagramHeadingLine2 ?? HERO_DIAGRAM_HEADING[1],
  ];
  const heroDiagramSubtext = getSiteText(siteContent, "hero_diagram_subtext", HERO_DIAGRAM_SUBTEXT);
  const heroDiagramCenterLabel = getSiteText(siteContent, "hero_diagram_center_label", HERO_DIAGRAM_CENTER_LABEL);
  const heroDiagramLlmLabel = getSiteText(siteContent, "hero_diagram_llm_label", HERO_DIAGRAM_LLM_LABEL);
  const resolvedHeroPillsLeft = resolveHeroPills(siteContent, "left", HERO_DIAGRAM_LEFT_ITEMS);
  const resolvedHeroPillsRight = resolveHeroPills(siteContent, "right", HERO_DIAGRAM_RIGHT_ITEMS);
  const resolvedHeroFeatures = resolveHeroFeatures(siteContent);
  const heroLabel = getSiteText(siteContent, "hero_label", DEFAULT_HERO_LABEL);
  const heroTagline = getSiteText(siteContent, "hero_tagline", DEFAULT_HERO_TAGLINE);
  const heroStatement = getSiteText(siteContent, "hero_statement", DEFAULT_HERO_STATEMENT);
  const heroBio = getSiteText(siteContent, "hero_bio", DEFAULT_HERO_BIO);
  const heroBioKo = getSiteText(siteContent, "hero_bio_ko", DEFAULT_HERO_BIO_KO);
  const worksSubTxt = getSiteText(siteContent, "works_subtxt", DEFAULT_WORKS_SUBTXT);
  const worksTitle = getSiteText(siteContent, "works_title", DEFAULT_WORKS_TITLE);
  const worksDescription = getSiteText(siteContent, "works_description", DEFAULT_WORKS_DESCRIPTION);
  const skillsSubTxt = getSiteText(siteContent, "skills_subtxt", DEFAULT_SKILLS_SUBTXT);
  const skillsTitle = getSiteText(siteContent, "skills_title", DEFAULT_SKILLS_TITLE);
  const workTogetherText = getSiteText(siteContent, "work_together_text", DEFAULT_WORK_TOGETHER_TEXT);
  const resolvedSkillGroups = resolveSkillGroups(siteContent);
  const resolvedClientRows = resolveClientRows(siteContent);
  const featuredRows = chunk(
    (rows ?? [])
      .filter((r) => r.is_featured_on_main && r.main_display_order != null)
      .sort((a, b) => (a.main_display_order ?? 0) - (b.main_display_order ?? 0))
      .slice(0, 6)
      .map(mapRowToWorkItem),
    2
  );

  return (
    <div className="wrap relative bg-black text-white min-h-screen">
      <Preloader onFinish={() => setIntroDone(true)} />
      <Header variant="default" />
      <main>
        <Hero
          readyToReveal={introDone}
          label={heroLabel}
          tagline={heroTagline}
          statement={heroStatement}
          bio={heroBio}
          bioKo={heroBioKo}
        />

        <section className={`intro ${sectionClass}`}>
          <IntroTop
            heading={introHeading}
            hoverHeading={introHeading === DEFAULT_INTRO_HEADING ? DEFAULT_INTRO_HEADING_KO : undefined}
            description={introDescription}
          />
          <div className="bottom">
            {/* 원래 delay=1.6은 위 IntroTop 타이틀 진입 타임라인이 완전히 다
                끝난 뒤에야 키워드가 나타나기 시작하도록 맞춘 값이었는데,
                타이틀이 다 뜬 뒤로도 한참 정적이 흐르다 키워드가 나타나서
                "늦게 나온다"는 인상을 줬다 — 타이틀 문단이 아직 페이드인되는
                마지막 구간(꼬리)과 살짝 겹치도록 당겨서, 타이틀 → 키워드가
                끊김 없이 이어지는 한 호흡처럼 보이게 한다. */}
            <StaggerReveal
              as="ul"
              className="keyword grid grid-cols-4 max-lg:grid-cols-2 max-sm:grid-cols-1"
              y={40}
              delay={1.05}
              stagger={0.12}
            >
              {resolvedKeywords.map((item, i) => (
                <KeywordCard key={item.num} item={item} index={i} />
              ))}
            </StaggerReveal>
          </div>
        </section>

        {/* 다른 섹션(hero-diagram/skills 등)과 달리 이 섹션만 3초 대신 1초로 줄였다 —
            안에 WorkCard 각각이 자기 자신의 등장 애니메이션(StaggerReveal 1초 + tilt)을
            또 갖고 있어서, 바깥 섹션까지 3초짜리 blur/scale/tilt 리빌이 겹치면 스크롤
            진입 후 한참 동안 카드 이미지가 흐리고 눌린 채로 보여 "포트폴리오만 늦게
            나온다"거나 "이미지가 잘려 보인다"는 인상으로 이어졌다.
            rootMargin도 기본(-120px, 화면에 상당히 들어온 뒤에야 시작)이 아니라
            양수(+400px)로 넘겨서, 섹션이 화면 아래쪽으로 아직 400px 남았을 때부터
            미리 리빌을 시작한다 — 실제로 눈에 보이는 시점엔 이미 애니메이션이 끝나
            있어서, 스크롤을 멈추고 바라볼 때 흐릿하거나 눌린 상태를 보게 되는 일이
            없어진다. */}
        <Reveal
          as="section"
          duration={1000}
          rootMargin="0px 0px 400px 0px"
          className={`work ${workSectionClass}`}
        >
          <SectionTitle subTxt={worksSubTxt} title={worksTitle} description={worksDescription} />

          {/* Supabase에서 포트폴리오 목록을 받아오는 동안(특히 네트워크가 느리거나
              Supabase 프로젝트가 한동안 유휴 상태였다가 깨어나는 경우 몇 초씩 걸릴
              수 있다) 이 자리가 텅 비어 있으면 "페이지가 이상하게 렌더링된다"는
              인상을 준다 — 실제 카드와 같은 grid/폭을 쓰는 펄스 스켈레톤을 대신
              보여줘서, 로딩이 의도된 상태라는 걸 바로 알 수 있게 한다. */}
          {portfoliosLoading &&
            [0, 1, 2].map((rowIndex) => (
              <div
                key={rowIndex}
                className="work-list flex justify-between gap-5 mb-[240px] max-lg:gap-4 max-lg:mb-[60px] max-sm:flex-col max-sm:gap-7 max-sm:mb-10"
              >
                {[0, 1].map((i) => (
                  <div key={i} className={HOME_SLOT_WIDTHS[rowIndex * 2 + i]}>
                    <div className="w-full aspect-[3/2] max-w-full animate-pulse rounded-md bg-white/5 max-lg:rounded-sm" />
                    <div className="mt-4 h-4 w-2/3 animate-pulse rounded bg-white/5" />
                    <div className="mt-2 h-3 w-1/3 animate-pulse rounded bg-white/5" />
                  </div>
                ))}
              </div>
            ))}

          {featuredRows.map((rowItems, rowIndex) => (
            <StaggerReveal
              key={rowIndex}
              as="ul"
              className="work-list flex justify-between gap-5 mb-[240px] max-lg:gap-4 max-lg:mb-[60px] max-sm:flex-col max-sm:gap-7 max-sm:mb-10 [perspective:1400px]"
              rotateX={-28}
              y={70}
              rootMargin="0px 0px 400px 0px"
            >
              {rowItems.map((item, i) => (
                <WorkCard
                  key={item.href}
                  item={item}
                  shared
                  thumbnailReveal
                  widthClassName={HOME_SLOT_WIDTHS[rowIndex * 2 + i]}
                  titleClassName="text-[18px] leading-7 max-lg:text-[18px] max-lg:leading-7 max-sm:text-[16px] max-sm:leading-[26px]"
                  dateClassName="text-[14px] leading-6 max-lg:text-[14px]"
                  subClassName="text-[14px] leading-[22px] max-lg:text-[14px]"
                />
              ))}
            </StaggerReveal>
          ))}

          <SeeAllWorkLink />
        </Reveal>

        <WorkTogether text={workTogetherText} />

        {/* 검은/흰 밴드가 화면 끝까지 이어지는 디자인이라, 다른 섹션들처럼
            max-width 컨테이너 안에 가두지 않고 화면 전체 폭으로 둔다 —
            위아래 여백만 다른 섹션과 같은 리듬(mb-[280px] 계열)을 맞춘다. */}
        <section className="client-marquee mb-[280px] max-lg:mb-[240px] max-sm:mb-[180px]">
          <ClientMarqueeList rows={resolvedClientRows} />
        </section>

        <Reveal as="section" duration={3000} className={`hero-diagram ${sectionClass}`}>
          <HeroDiagram
            heading={heroDiagramHeading}
            subtext={heroDiagramSubtext}
            centerLabel={heroDiagramCenterLabel}
            llmLabel={heroDiagramLlmLabel}
            leftItems={resolvedHeroPillsLeft}
            rightItems={resolvedHeroPillsRight}
            featureCards={resolvedHeroFeatures}
          />
        </Reveal>

        <Reveal as="section" duration={3000} className={`skills ${sectionClass}`}>
          <SectionTitle subTxt={skillsSubTxt} title={skillsTitle} />
          <StaggerReveal
            as="ul"
            className="skill-list grid grid-cols-4 gap-5 max-lg:grid-cols-2 max-lg:gap-4 max-sm:gap-3"
            y={30}
            fromScale={0.8}
            stagger={0.1}
            rotateZ={10}
          >
            {resolvedSkillGroups.map((slides, i) => (
              <SkillSwiper key={i} slides={slides} />
            ))}
          </StaggerReveal>
        </Reveal>
      </main>
      <Footer theme="dark" revealDuration={3000} />
    </div>
  );
}
