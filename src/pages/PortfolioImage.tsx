interface PortfolioImageProps {
  image: string;
}

export default function PortfolioImage({ image }: PortfolioImageProps) {
  return (
    <div className="sub bg-white text-sub-primary-txt min-h-screen">
      <div className="web overflow-hidden">
        <div className="cont dpd relative w-full max-w-full mx-auto">
          <a href="" className="block w-full max-w-[860px] mx-auto">
            <img src={image} alt="" className="w-full" />
          </a>
        </div>
      </div>
    </div>
  );
}
