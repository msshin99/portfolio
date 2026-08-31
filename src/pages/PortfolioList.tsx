import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import Reveal from "../components/common/Reveal";
import WorkCard from "../components/common/WorkCard";
import { portfolioListGroups } from "../data/works";
import { usePortfolios, mapRowToWorkItem } from "../lib/portfolioApi";
import { useGraphicWorks, mapGraphicWorkRowToWorkItem } from "../lib/graphicWorksApi";

const h2Class =
  "font-en text-[68px] leading-[76px] font-medium max-lg:text-[56px] max-lg:leading-[66px] max-sm:text-[40px] max-sm:leading-[48px] mb-[30px] max-lg:mb-6 max-sm:mb-[18px]";

export default function PortfolioList() {
  // nordune/goalcheck/prmr는 Supabase portfolios에서, chairpdp/cosmeticpdp/memory-in-frame
  // 등은 graphic_works에서 불러와 각 그룹 맨 앞에 끼워 넣는다 — 관리자가 새 프로젝트를
  // 등록하면 코드 변경 없이 여기 자동으로 나타난다.
  const { rows } = usePortfolios();
  const { rows: graphicRows } = useGraphicWorks();
  const dynamicWebItems = (rows ?? []).map(mapRowToWorkItem);
  const dynamicGraphicItems = (graphicRows ?? []).map(mapGraphicWorkRowToWorkItem);
  const groups = portfolioListGroups.map((group) => {
    if (group.heading === "WEB DESIGN") return { ...group, items: [...dynamicWebItems, ...group.items] };
    if (group.heading === "GRAPIC DESIGN") return { ...group, items: [...dynamicGraphicItems, ...group.items] };
    return group;
  });

  return (
    <div className="wrap relative bg-black text-white min-h-screen">
      <Header variant="default" />
      <div className="subpage max-w-[1880px] mx-auto px-10 max-sm:px-4">
        <div className="portfolio-list pt-[180px] pb-20 max-lg:pt-[140px] max-lg:pb-[60px] max-[767px]:pt-[100px] max-[767px]:pb-10">
          {groups.map((group) => (
            <Reveal
              key={group.heading}
              duration={3000}
              className="mb-[160px] max-lg:mb-[100px] max-[767px]:mb-20"
            >
              <h2 className={h2Class}>{group.heading}</h2>
              <ul className="work-list sub-page grid grid-cols-3 justify-between gap-x-5 gap-y-[60px] max-[767px]:grid-cols-1 max-[767px]:gap-7">
                {group.items.map((item) => (
                  <WorkCard key={item.title} item={item} subPage shared />
                ))}
              </ul>
            </Reveal>
          ))}
        </div>
      </div>
      <Footer theme="dark" revealDuration={2000} />
    </div>
  );
}
