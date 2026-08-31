import type { CSSProperties } from "react";
import Header from "../components/layout/Header";
import PortfolioDetailContent from "./PortfolioDetailContent";
import type { PortfolioDetail as PortfolioDetailData } from "../data/portfolioDetails";

interface PortfolioDetailProps {
  detail: PortfolioDetailData;
}

/** 검정+골드 럭셔리 나이트라이프 브랜딩인 goldenpine만 상세페이지 전체를 다크 테마로 보여준다.
 *  --color-sub-*-txt 변수를 이 wrapper에서 재정의하면, text-sub-primary-txt 등 그 변수를
 *  참조하는 하위의 모든 Tailwind 유틸리티 클래스가 별도 수정 없이 자동으로 밝은 색으로 바뀐다. */
const DARK_SLUGS = new Set(["goldenpine"]);

export default function PortfolioDetail({ detail }: PortfolioDetailProps) {
  const isDark = DARK_SLUGS.has(detail.slug);

  return (
    <div
      className={`sub text-sub-primary-txt min-h-screen relative ${isDark ? "" : "bg-white"}`}
      style={
        isDark
          ? ({
              backgroundColor: "#000000",
              "--color-sub-primary-txt": "#ffffff",
              "--color-sub-secondary-txt": "#cfcfcf",
              "--color-sub-tertiary-txt": "#9a9a9a",
            } as CSSProperties)
          : undefined
      }
    >
      <Header variant="default" />
      <PortfolioDetailContent detail={detail} />
    </div>
  );
}
