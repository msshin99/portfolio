import type { KeywordItem } from "../../data/keywords";

interface KeywordCardProps {
  item: KeywordItem;
  /** 4개 카드가 순서대로 약간씩 다른 타이밍에 반응하도록 hover
   *  transition-delay를 인덱스에 비례해서 준다(개별로 반응하는 느낌). */
  index?: number;
}

export default function KeywordCard({ item, index = 0 }: KeywordCardProps) {
  const hoverDelay = { transitionDelay: `${index * 40}ms` };

  return (
    <li
      className={[
        "group font-en border-r border-[#121212] px-8",
        "nth-[4n]:border-r-0",
        "max-lg:px-[26px] max-lg:nth-[2n]:border-r-0",
        "max-sm:px-0 max-sm:border-r-0",
      ].join(" ")}
    >
      <span className="num text-base leading-6 font-medium text-primary-txt mb-7 block max-lg:text-sm max-lg:leading-[22px] max-lg:mb-5 max-sm:text-sm max-sm:mb-3">
        {item.num}
      </span>
      <h5
        style={hoverDelay}
        className="tit font-ko text-[26px] leading-8 font-bold mb-0.5 max-lg:text-2xl max-lg:leading-[30px] max-lg:mb-0 max-sm:text-xl max-sm:leading-7 transition-colors duration-[220ms] ease-out group-hover:text-primary-txt"
      >
        {item.title}
      </h5>
      <p className="sub text-sm leading-[22px] font-light text-secondary-txt mb-20 max-lg:mb-10 max-sm:text-[13px] max-sm:mb-6">
        {item.sub}
      </p>
      <figure className="relative flex justify-center items-center">
        {/* 브랜드 컬러 블롭 하이라이트 — 아이콘 뒤에서 fade-in되는 은은한
            원형 글로우. blur로 경계를 부드럽게 흐려서 딱딱한 원이 아니라
            블롭에 가까운 느낌을 낸다. */}
        <span
          aria-hidden="true"
          style={hoverDelay}
          className="pointer-events-none absolute h-[150px] w-[150px] rounded-full bg-primary-txt/25 blur-2xl opacity-0 scale-75 transition-[opacity,transform] duration-[220ms] ease-out group-hover:opacity-100 group-hover:scale-100"
        />
        <img
          src={item.image}
          alt=""
          style={hoverDelay}
          className="relative w-[180px] max-w-full h-auto transition-transform duration-[220ms] ease-out group-hover:scale-[1.15] group-hover:-rotate-6"
        />
      </figure>
    </li>
  );
}
