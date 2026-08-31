import levis from "../assets/work/levis.jpg";

export interface WorkItem {
  title: string;
  date: string;
  sub: string;
  image: string;
  href: string;
}

/** `/portfolio` 리스트 페이지의 정적 카테고리 그룹. nordune/goalcheck/prmr는 Supabase
 *  portfolios 테이블로, chairpdp/cosmeticpdp/memory-in-frame은 graphic_works 테이블로
 *  이관되어 이 목록에서 빠졌다 — PortfolioList.tsx가 각 그룹 맨 앞에 Supabase 데이터를
 *  동적으로 끼워 넣는다. Behance 외부 링크뿐인 "Revis"만 이번 마이그레이션 범위 밖이라
 *  그대로 정적 데이터로 남겨둔다. */
export const portfolioListGroups: { heading: string; items: WorkItem[] }[] = [
  {
    heading: "WEB DESIGN",
    items: [
      {
        title: "Revis",
        date: "2025.10",
        sub: "Fashion Ecommerce redesign",
        image: levis,
        href: "https://www.behance.net/gallery/200334305/Levis-website-redesign",
      },
    ],
  },
  {
    heading: "GRAPIC DESIGN",
    items: [],
  },
];
