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

  return (
    <li
      ref={tiltRef}
      className={[
        "group h-[14vw] bg-[#0f0f0f] rounded-md overflow-hidden",
        "transition-shadow duration-300 hover:shadow-[0_20px_45px_rgba(0,0,0,0.55)]",
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
              className="pointer-events-none absolute inset-0 rounded-md transition-transform duration-300 ease-[ease-in-out] scale-[0.8] opacity-0 group-hover:scale-100 group-hover:opacity-100"
              style={{ backgroundColor: slide.hoverBg }}
            />
            <img
              src={slide.image}
              alt={slide.key}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-w-[15%] h-auto max-lg:max-w-[12%] max-sm:max-w-[14%]"
            />
            <img
              src={slide.imageHover}
              alt=""
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-w-[15%] h-auto max-lg:max-w-[12%] max-sm:max-w-[14%] opacity-0 group-hover:opacity-100"
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </li>
  );
}
