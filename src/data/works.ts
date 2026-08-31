import chairPdp from "../assets/work/chair-pdp.jpg";
import cosmeticPdp from "../assets/work/cosmetic-pdp.jpg";
import levis from "../assets/work/levis.jpg";
import memoryInFrame from "../assets/work/memory-in-frame.jpg";

export interface WorkItem {
  title: string;
  date: string;
  sub: string;
  image: string;
  href: string;
}

/** `/portfolio` 리스트 페이지의 정적 카테고리 그룹. nordune/goalcheck/prmr는 Supabase로
 *  이관되어 이 목록에서 빠졌다 — PortfolioList.tsx가 "WEB DESIGN" 그룹 맨 앞에 Supabase
 *  데이터를 동적으로 끼워 넣는다. chairpdp/cosmeticpdp(이미지 한 장짜리 템플릿)와 Behance
 *  외부 링크 항목은 이번 마이그레이션 범위 밖이라 그대로 정적 데이터로 남겨둔다. */
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
    items: [
      {
        title: "Chair Product Detail Page",
        date: "2024.11",
        sub: "Product Detail Page",
        image: chairPdp,
        href: "/portfolio/chairpdp",
      },
      {
        title: "Cosmetic Product Detail Page",
        date: "2023.06",
        sub: "Product Detail Page",
        image: cosmeticPdp,
        href: "/portfolio/cosmeticpdp",
      },
      {
        title: "Memory in frame",
        date: "2025.10",
        sub: "Logo design",
        image: memoryInFrame,
        href: "https://www.behance.net/gallery/184760121/Memory-in-frame-brand-identity",
      },
    ],
  },
];
