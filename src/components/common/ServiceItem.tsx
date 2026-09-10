import type { ServiceItem as ServiceItemData } from "../../data/services";
import { useTilt } from "../../hooks/useTilt";

interface ServiceItemProps {
  item: ServiceItemData;
}

export default function ServiceItem({ item }: ServiceItemProps) {
  // figure 자체는 모바일에서 위치 고정용 translate를 이미 쓰고 있어서, tilt는
  // 안쪽 별도 래퍼에 적용해 transform 충돌을 피한다.
  const tiltRef = useTilt<HTMLDivElement>({ max: 12, scale: 1.04 });

  return (
    <li
      className={[
        "group flex items-center justify-between gap-[60px] w-full p-10 rounded-lg relative",
        "transition-all duration-500 ease-[ease] hover:bg-[#1a1a1a]",
        "max-lg:p-6",
        "max-sm:flex-col max-sm:p-[14px] max-sm:gap-1.5 max-sm:rounded-sm max-sm:mb-4 last:max-sm:mb-0",
      ].join(" ")}
    >
      <h4 className="font-en text-[42px] leading-[52px] font-medium max-lg:text-[30px] max-lg:leading-10 max-sm:text-lg max-sm:leading-[26px] max-sm:w-full">
        {item.titleLines[0]}
        <br className="max-sm:hidden" />
        {item.titleLines[1]}
      </h4>
      <div
        className={[
          "right flex items-center gap-8 max-w-[840px] w-full justify-between",
          "max-lg:max-w-[600px]",
          "max-sm:max-w-full max-sm:gap-3",
        ].join(" ")}
      >
        {/* 데스크톱은 hover 시 이미지가 화면 오른쪽에서 살짝 등장하는 연출이지만, 터치
            기기는 hover가 없어 그 상태(opacity-0)가 절대 바뀌지 않는다 — 모바일에서는
            absolute 배치와 hover 게이트를 걷어내고, 텍스트 옆에 항상 보이는 작은
            썸네일로 대신한다. */}
        <figure className="shrink-0">
          <div ref={tiltRef} className="will-change-transform">
            <img
              src={item.image}
              alt=""
              className={[
                "max-w-full h-auto rounded-md",
                "max-lg:rounded-sm max-lg:min-w-[148px]",
                "max-sm:w-20 max-sm:min-w-0",
              ].join(" ")}
            />
          </div>
        </figure>
        <p
          className={[
            "font-ko text-sm leading-[22px] font-light text-tertiary-txt max-w-[440px]",
            "transition-all duration-500 ease-[ease] group-hover:text-secondary-txt",
            "max-lg:max-w-[380px]",
            "max-sm:max-w-none max-sm:min-w-0 max-sm:flex-1",
          ].join(" ")}
        >
          {item.description}
        </p>
      </div>
    </li>
  );
}
