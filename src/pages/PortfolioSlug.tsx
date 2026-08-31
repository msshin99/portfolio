import { Navigate, useParams } from "react-router-dom";
import PortfolioDetail from "./PortfolioDetail";
import PortfolioImage from "./PortfolioImage";
import { usePortfolios, mapRowToPortfolioDetail } from "../lib/portfolioApi";
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

  if (IMAGE_ONLY_SLUGS[slug]) {
    return <PortfolioImage image={IMAGE_ONLY_SLUGS[slug]} />;
  }

  if (loading) {
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

  return <Navigate to="/portfolio" replace />;
}
