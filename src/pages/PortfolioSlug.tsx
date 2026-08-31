import { Navigate, useParams } from "react-router-dom";
import PortfolioDetail from "./PortfolioDetail";
import PortfolioImage from "./PortfolioImage";
import { usePortfolios, mapRowToPortfolioDetail } from "../lib/portfolioApi";
import { useGraphicWorks } from "../lib/graphicWorksApi";
import chairDetail from "../assets/portfolio/detailpage/chair-detail-page.jpg";
import cosmeticDetail from "../assets/portfolio/detailpage/cosmetic-detail-page.jpg";

// chairpdp/cosmeticpdp는 이미지 한 장짜리 별도 템플릿이라 이번 Supabase 이관 범위에서
// 제외했다 — 계속 정적 데이터로 남겨둔다.
const IMAGE_ONLY_SLUGS: Record<string, string> = {
  chairpdp: chairDetail,
  cosmeticpdp: cosmeticDetail,
};

export default function PortfolioSlug() {
  const { slug = "" } = useParams();
  const { rows, loading, error } = usePortfolios();
  const { rows: graphicRows, loading: graphicLoading } = useGraphicWorks();

  if (IMAGE_ONLY_SLUGS[slug]) {
    return <PortfolioImage image={IMAGE_ONLY_SLUGS[slug]} />;
  }

  if (loading || graphicLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-sub-secondary-txt">
        불러오는 중...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-sub-secondary-txt">
        데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
      </div>
    );
  }

  const row = rows?.find((r) => r.slug === slug);
  if (row) {
    return <PortfolioDetail detail={mapRowToPortfolioDetail(row)} />;
  }

  // 관리자페이지에서 그래픽 디자인 항목에 "메인 이미지"를 등록하면 이 slug로 전용 페이지가
  // 자동 생긴다(AdminGraphicWorks.tsx 참고) — chairpdp/cosmeticpdp와 같은 PortfolioImage를
  // 재사용해서 이미지 한 장을 그대로 보여준다.
  const graphicRow = graphicRows?.find((r) => r.slug === slug && r.main_image_url);
  if (graphicRow?.main_image_url) {
    return <PortfolioImage image={graphicRow.main_image_url} />;
  }

  return <Navigate to="/portfolio" replace />;
}
