import type { ColorCard as ColorCardData } from "../../data/portfolioDetails";

/** Figma 컬러 팔레트 디자인의 5칸 폭 비율(1608px 기준 530:348:311:219:200) — 색상은
 *  프로젝트마다 바뀌어도 이 비율은 고정이라 인덱스로 고정해 둔다. */
const BASE_WEIGHTS = [530, 348, 311, 219, 200];

/** hover된 카드는 원래 비중과 무관하게 이 고정값까지 확 커지고, 나머지는 자기 비중에
 *  비례해서 줄어든다 — 어떤 카드를 hover하든 "확 커지는" 임팩트가 비슷하게 느껴지게 한다. */
const HOVER_GROW = 1200;
const DIM_SHRINK = 0.5;

interface ColorCardProps {
  card: ColorCardData;
  index: number;
  hoveredIndex: number | null;
  onHover: (index: number | null) => void;
}

export default function ColorCard({ card, index, hoveredIndex, onHover }: ColorCardProps) {
  const baseWeight = BASE_WEIGHTS[index] ?? 260;
  const isHovered = hoveredIndex === index;
  const isDimmed = hoveredIndex !== null && !isHovered;
  const flexGrow = isHovered ? HOVER_GROW : isDimmed ? baseWeight * DIM_SHRINK : baseWeight;

  return (
    <li
      onMouseEnter={() => onHover(index)}
      onMouseLeave={() => onHover(null)}
      className={[
        "relative flex items-end p-5 text-white h-[400px] overflow-hidden cursor-pointer",
        "max-lg:!flex-none max-lg:h-[110px] max-lg:p-4",
        "max-sm:h-[90px] max-sm:p-3.5",
        card.border ? "border-y border-r border-[#ddd] max-lg:border-r-0" : "",
      ].join(" ")}
      style={{
        background: card.background,
        color: card.textColor,
        flexGrow,
        flexBasis: 0,
        transition: "flex-grow 0.7s cubic-bezier(0.22,1,0.36,1)",
      }}
    >
      <p
        className={[
          "font-en leading-none flex items-center gap-1.5 whitespace-nowrap transition-all duration-500 ease-out",
          isHovered ? "text-3xl max-lg:text-2xl" : "text-base max-lg:text-sm max-sm:text-[13px]",
          isDimmed ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0",
        ].join(" ")}
      >
        <span className="opacity-70 font-normal">Hex Code:</span>
        <span className="font-semibold">{card.hexLabel}</span>
      </p>
    </li>
  );
}
