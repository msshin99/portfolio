// nordune/goalcheck/prmr의 실제 상세 콘텐츠는 Supabase portfolios 테이블(content_blocks)로
// 이관됐다. 이 파일에는 렌더링 컴포넌트(PortfolioDetailContent, FontStyleGuide, ColorCard)와
// 어댑터(lib/portfolioApi.ts의 mapRowToPortfolioDetail)가 공유하는 타입 정의만 남아있다.

export interface FontGuide {
  variant?: "two" | "three" | "prmr";
  title: string;
  sample: string;
  weight: string;
  sizes: string[];
  letterSpacing: string;
  tags: string[];
}

export interface FontInfoBlock {
  image: string;
  imageMobile: string;
  /** prmr.html의 첫 font-info 블록에만 붙는 하단 마진 축소 클래스(.mr) */
  tight?: boolean;
  guides: FontGuide[];
}

export interface ColorCard {
  name: string;
  /** 화면에 표시되는 hex 텍스트 (원본 오탈자 포함 그대로) */
  hexLabel: string;
  background: string;
  textColor?: string;
  border?: boolean;
}

export interface PortfolioDetail {
  slug: string;
  title: string;
  subtitle: string;
  description: string[];
  meta: { label: string; value: string; note?: string }[];
  websiteUrl: string;
  visual: string;
  mainImage: string;
  boxContainer: {
    sub1: string;
    sub2: string;
    device: { label: string; image: string }[];
  };
  fontInfoBlocks: FontInfoBlock[];
  colorInfo: {
    description: string;
    cards: ColorCard[];
  };
}
