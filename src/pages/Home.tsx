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
import visualImg from "../assets/visual-img.jpg";
import { keywords as defaultKeywords, type KeywordItem } from "../data/keywords";
import { skillGroups } from "../data/skills";
import { usePortfolios, mapRowToWorkItem } from "../lib/portfolioApi";
import { useSiteContent, getSiteText, getSiteImage } from "../lib/siteContentApi";

const DEFAULT_HERO_HEADING = "The Web Designer\nfor Bold Visual Experiences";
const DEFAULT_HERO_SUBTEXT = "Where creativity meets functionality for effortless user engagement";

const DEFAULT_INTRO_HEADING =
  "Design moves people. And people move the world. Design is not just what we see it’s how we feel, remember, and connect.";
const DEFAULT_INTRO_HEADING_KO =
  "디자인은 사람을 움직이고, 사람은 세상을 움직입니다. 디자인은 보이는 것이 아니라 느끼고, 기억하고, 연결되는 것입니다.";
const DEFAULT_INTRO_DESCRIPTION =
  "사소한 요소 하나에도 의미를 담고, 그 안에서 공감과 연결의 순간을 만들어내는 디자인을 추구합니다. 나의 디자인은 '어떻게 보일까'보다 '어떻게 느껴질까'를 더 깊이 고민합니다. 저는 디자인을 통해 사람들의 하루에 잔잔한 변화를 만들고, 기억에 남는 경험과 진심이 닿는 브랜드를 만들어가고자 합니다.";

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
        getSiteText(siteContent, `hero_feature_${n}_heading2`, item.heading[1]),
      ],
      body: getSiteText(siteContent, `hero_feature_${n}_body`, item.body),
    };
  });
}

const sectionClass = "max-w-[1880px] mx-auto px-10 mb-[280px] max-lg:px-10 max-lg:mb-[240px] max-sm:px-5 max-sm:mb-[180px]";

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
  const { rows } = usePortfolios();
  const { rows: siteContent } = useSiteContent();
  const heroHeading = getSiteText(siteContent, "hero_heading", DEFAULT_HERO_HEADING);
  const heroSubtext = getSiteText(siteContent, "hero_subtext", DEFAULT_HERO_SUBTEXT);
  const heroImage = getSiteImage(siteContent, "hero_image", visualImg);
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
      <Preloader />
      <Header variant="default" />
      <main>
        <Hero image={heroImage} heading={heroHeading} subtext={heroSubtext} />

        <section className={`intro ${sectionClass}`}>
          <IntroTop
            heading={introHeading}
            hoverHeading={introHeading === DEFAULT_INTRO_HEADING ? DEFAULT_INTRO_HEADING_KO : undefined}
            description={introDescription}
          />
          <div className="bottom">
            <StaggerReveal
              as="ul"
              className="keyword grid grid-cols-4 max-lg:grid-cols-2 max-sm:grid-cols-1"
              y={40}
              stagger={0.1}
            >
              {resolvedKeywords.map((item, index) => (
                <KeywordCard key={item.num} item={item} index={index} />
              ))}
            </StaggerReveal>
          </div>
        </section>

        <Reveal as="section" duration={3000} className={`work ${sectionClass}`}>
          <SectionTitle
            subTxt="(Professional)"
            title="My Works"
            description="제가 경험한 과정, 고민의 흔적, 그리고 디자인을 통해 사람들과 나눈 감정의 이야기들입니다. 각 프로젝트는 서로 다른 목적과 문제를 가지고 있었지만, 그 안에서 저는 항상 사람과의 연결, 공감, 그리고 의미 있는 변화를 찾고자 했습니다"
          />

          {featuredRows.map((rowItems, rowIndex) => (
            <StaggerReveal
              key={rowIndex}
              as="ul"
              className="work-list flex justify-between gap-5 mb-[240px] max-lg:gap-4 max-lg:mb-[60px] max-sm:flex-col max-sm:gap-7 max-sm:mb-10 [perspective:1400px]"
              rotateX={-28}
              y={70}
            >
              {rowItems.map((item, i) => (
                <WorkCard
                  key={item.href}
                  item={item}
                  shared
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
          <SectionTitle subTxt="(Capabilities)" title="Skills" />
          <StaggerReveal
            as="ul"
            className="skill-list grid grid-cols-4 gap-5 max-lg:grid-cols-2 max-lg:gap-4 max-sm:gap-3"
            y={30}
            fromScale={0.8}
            stagger={0.1}
            rotateZ={10}
          >
            {skillGroups.map((slides, i) => (
              <SkillSwiper key={i} slides={slides} />
            ))}
          </StaggerReveal>
        </Reveal>
      </main>
      <Footer theme="dark" revealDuration={3000} />
    </div>
  );
}
