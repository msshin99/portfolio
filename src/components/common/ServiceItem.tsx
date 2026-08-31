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
          "max-sm:max-w-full max-sm:gap-0",
        ].join(" ")}
      >
        <figure
          className={[
            "shrink-0",
            "max-sm:absolute max-sm:right-[-40px] max-sm:top-1/2 max-sm:-translate-x-1/2 max-sm:-translate-y-1/2",
            "max-sm:opacity-0 max-sm:transition-[opacity,transform] max-sm:duration-500 max-sm:ease-[ease] max-sm:group-hover:opacity-100",
          ].join(" ")}
        >
          <div ref={tiltRef} className="will-change-transform">
            <img
              src={item.image}
              alt=""
              className={[
                "max-w-full h-auto rounded-md",
                "max-lg:rounded-sm max-lg:min-w-[148px]",
                "max-sm:w-[136px] max-sm:min-w-[120px]",
              ].join(" ")}
            />
          </div>
        </figure>
        <p
          className={[
            "font-ko text-sm leading-[22px] font-light text-tertiary-txt max-w-[440px]",
            "transition-all duration-500 ease-[ease] group-hover:text-secondary-txt",
            "max-lg:max-w-[380px]",
            "max-sm:max-w-full",
          ].join(" ")}
        >
          {item.description}
        </p>
      </div>
    </li>
  );
}
