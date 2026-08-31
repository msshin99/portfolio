import type { ColorCard as ColorCardData } from "../../data/portfolioDetails";

interface ColorCardProps {
  card: ColorCardData;
}

export default function ColorCard({ card }: ColorCardProps) {
  return (
    <li
      className={[
        "rounded-md text-white w-full aspect-square flex flex-col justify-between p-[18px]",
        "max-lg:p-3.5 max-sm:p-3",
        // WorkCard와 같은 톤의 hover: 살짝 떠오르며 그림자가 생긴다. 각 카드 고유 배경색이
        // 그대로 그림자에 살짝 배어 나오도록 shadow 색을 currentColor 대신 검정 계열로 통일.
        "transition-transform duration-300 ease-[ease] will-change-transform",
        "hover:-translate-y-1.5 hover:shadow-[0_16px_32px_rgba(0,0,0,0.25)]",
        card.border ? "border border-[#ddd]" : "",
      ].join(" ")}
      style={{ background: card.background, color: card.textColor }}
    >
      <p className="color-tit font-en text-xl leading-7 font-medium max-lg:text-lg max-lg:leading-[26px] max-sm:text-base max-sm:leading-6">
        {card.name}
      </p>
      <p className="code flex justify-between">
        <span className="font-en text-sm font-light">Hex Code:</span>
        <span className="font-en text-sm font-medium">{card.hexLabel}</span>
      </p>
    </li>
  );
}
