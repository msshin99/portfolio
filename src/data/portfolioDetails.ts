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
    /** 컬러 스타일 배지 아래, 설명 왼쪽에 크게 보이는 헤드라인. 비어 있으면 기존처럼
     *  설명 문단만 단독으로 보여준다(관리자페이지에서 아직 입력하지 않은 기존 프로젝트용). */
    title: string;
    description: string;
    cards: ColorCard[];
  };
  /** 컬러 가이드 바로 아래에 순서대로 배치되는 버튼 컴포넌트 가이드(들). 예시 버튼의
   *  가로/세로 크기가 다른 여러 개(예: 높이46px 가이드, 높이58px 가이드)를 가질 수 있어
   *  font_info처럼 배열로 둔다. 모든 프로젝트에 있는 섹션은 아니므로, 비어 있으면 아무것도
   *  렌더링하지 않는다. */
  buttonInfoBlocks: {
    radius: string;
    fontLabel: string;
    buttonWidth: number;
    buttonHeight: number;
  }[];
  /** 버튼 가이드 아래에 배치되는 "기본 인풋" 가이드(select/date/text 3종 예시) 노출 여부.
   *  내용이 프로젝트마다 달라지는 섹션이 아니라 고정 문서이므로 켜고 끄는 값 하나만 둔다. */
  hasInputGuide: boolean;
}
