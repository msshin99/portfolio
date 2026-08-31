import type { KeywordItem } from "../../data/keywords";
import { useTilt } from "../../hooks/useTilt";

interface KeywordCardProps {
  item: KeywordItem;
}

export default function KeywordCard({ item }: KeywordCardProps) {
  const tiltRef = useTilt<HTMLElement>({ max: 16, scale: 1.08 });

  return (
    <li
      className={[
        "group font-en border-r border-[#121212] px-8",
        "nth-[4n]:border-r-0",
        "max-lg:px-[26px] max-lg:nth-[2n]:border-r-0",
        "max-sm:px-0 max-sm:border-r-0",
      ].join(" ")}
    >
      <span className="num text-base leading-6 font-medium text-primary-txt mb-7 block max-lg:text-sm max-lg:leading-[22px] max-lg:mb-5 max-sm:text-sm max-sm:mb-3 transition-colors duration-300 group-hover:text-white">
        {item.num}
      </span>
      <h5 className="tit font-ko text-[26px] leading-8 font-bold mb-0.5 max-lg:text-2xl max-lg:leading-[30px] max-lg:mb-0 max-sm:text-xl max-sm:leading-7">
        {item.title}
      </h5>
      <p className="sub text-sm leading-[22px] font-light text-secondary-txt mb-20 max-lg:mb-10 max-sm:text-[13px] max-sm:mb-6">
        {item.sub}
      </p>
      <figure
        ref={tiltRef}
        className="relative flex justify-center items-center will-change-transform"
      >
        <span className="pointer-events-none absolute inset-0 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-60 [background:radial-gradient(circle,var(--color-primary-txt),transparent_70%)]" />
        <img
          src={item.image}
          alt=""
          className="relative max-w-full h-auto max-sm:w-[180px] [filter:drop-shadow(0_0_0_rgba(0,0,0,0))] transition-[filter] duration-500 group-hover:[filter:drop-shadow(0_18px_24px_rgba(0,0,0,0.45))]"
        />
      </figure>
    </li>
  );
}
