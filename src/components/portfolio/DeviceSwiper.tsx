import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Keyboard } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

interface DeviceSwiperProps {
  slides: { label: string; image: string }[];
}

export default function DeviceSwiper({ slides }: DeviceSwiperProps) {
  return (
    <div className="swiper device relative">
      <Swiper
        modules={[Navigation, Pagination, Keyboard]}
        slidesPerView={1}
        spaceBetween={0}
        loop
        pagination={{ el: ".swiper-pagination", clickable: true }}
        navigation={{ nextEl: ".swiper-button-next", prevEl: ".swiper-button-prev" }}
        grabCursor
        keyboard={{ enabled: true, onlyInViewport: true }}
      >
        {slides.map((slide) => (
          <SwiperSlide key={slide.label}>
            <p className="tit">{slide.label}</p>
            <img src={slide.image} alt="" className="max-w-full h-auto rounded-md" />
          </SwiperSlide>
        ))}
      </Swiper>
      <div className="swiper-pagination" />
      <div className="swiper-button-prev" />
      <div className="swiper-button-next" />
    </div>
  );
}
