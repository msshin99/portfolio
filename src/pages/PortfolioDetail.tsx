import Header from "../components/layout/Header";
import PortfolioDetailContent from "./PortfolioDetailContent";
import type { PortfolioDetail as PortfolioDetailData } from "../data/portfolioDetails";

interface PortfolioDetailProps {
  detail: PortfolioDetailData;
}

export default function PortfolioDetail({ detail }: PortfolioDetailProps) {
  return (
    <div className="sub bg-white text-sub-primary-txt min-h-screen relative">
      <Header variant="default" />
      <PortfolioDetailContent detail={detail} />
    </div>
  );
}
