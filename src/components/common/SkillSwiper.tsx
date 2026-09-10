import { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import type { SkillSlide } from "../../data/skills";
import { useTilt } from "../../hooks/useTilt";
import "swiper/css";

interface SkillSwiperProps {
  slides: [SkillSlide, SkillSlide];
}

export default function SkillSwiper({ slides }: SkillSwiperProps) {
  const tiltRef = useTilt<HTMLLIElement>({ max: 10, scale: 1.04 });
  // 터치 기기는 hover가 없어서 group-hover만으로는 max-lg 이하 화면에서 컬러 배경/아이콘이
  // 절대 나타나지 않는다. 그렇다고 그 결과를 그냥 항상 켜두면 "hover 상태를 고정시켜 둔 것"일
  // 뿐 아무 반응성이 없어 어색하다 — 대신 탭할 때마다 켜졌다 꺼졌다 하는 실제 인터랙션으로
  // 대체해서, 데스크톱의 hover와 같은 자리에서 손가락으로 만져보는 경험을 준다.
  const [active, setActive] = useState(false);

  return (
    <li
      ref={tiltRef}
      onClick={() => setActive((v) => !v)}
      className={[
        "group h-[14vw] bg-[#0f0f0f] rounded-md overflow-hidden cursor-pointer",
        "transition-shadow duration-300 hover:shadow-[0_20px_45px_rgba(0,0,0,0.55)]",
        active ? "max-lg:shadow-[0_20px_45px_rgba(0,0,0,0.55)]" : "",
        "max-lg:h-[24vw]",
        "max-sm:rounded-sm max-sm:h-[28vw]",
      ].join(" ")}
    >
      <Swiper
        modules={[Autoplay]}
        direction="vertical"
        slidesPerView={1}
        spaceBetween={0}
        loop
        autoplay={{ delay: 2000, disableOnInteraction: false }}
        className="skill w-full h-full"
      >
        {slides.map((slide) => (
          <SwiperSlide key={slide.key} className="relative w-full h-full">
            <span
              className={[
                "pointer-events-none absolute inset-0 rounded-md transition-transform duration-300 ease-[ease-in-out]",
                "group-hover:scale-100 group-hover:opacity-100",
                active ? "scale-100 opacity-100" : "scale-[0.8] opacity-0",
              ].join(" ")}
              style={{ backgroundColor: slide.hoverBg }}
            />
            <img
              src={slide.image}
              alt={slide.key}
              className={[
                "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-w-[15%] h-auto max-lg:max-w-[12%] max-sm:max-w-[14%]",
                "transition-opacity duration-300 group-hover:opacity-0",
                active ? "opacity-0" : "",
              ].join(" ")}
            />
            <img
              src={slide.imageHover}
              alt=""
              className={[
                "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-w-[15%] h-auto max-lg:max-w-[12%] max-sm:max-w-[14%]",
                "transition-opacity duration-300 opacity-0 group-hover:opacity-100",
                active ? "opacity-100" : "",
              ].join(" ")}
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </li>
  );
}
