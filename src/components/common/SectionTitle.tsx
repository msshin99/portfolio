import type { ReactNode } from "react";
import { useTilt } from "../../hooks/useTilt";

interface SectionTitleProps {
  subTxt: string;
  title: string;
  description?: ReactNode;
}

export default function SectionTitle({ subTxt, title, description }: SectionTitleProps) {
  // 헤딩 자체를 살짝 3D로 기울여서, 스크롤로 지나치기 쉬운 큰 타이틀에도 마우스로
  // 다가가면 반응하는 인터랙션을 준다(카드형 요소에 이미 쓰던 tilt를 텍스트에 적용).
  const tiltRef = useTilt<HTMLHeadingElement>({ max: 6, scale: 1.03 });

  return (
    <div className="section-title mb-[60px] max-lg:mb-10 max-sm:mb-[26px]">
      <span className="sub-txt font-en text-xl leading-7 font-light text-secondary-txt mb-8 block max-lg:text-lg max-lg:leading-[26px] max-lg:mb-7 max-sm:text-base max-sm:leading-6 max-sm:mb-5">
        {subTxt}
      </span>
      <div className="main-txt flex justify-between items-start flex-wrap gap-10 max-lg:gap-[18px] max-sm:gap-2.5">
        <h2
          ref={tiltRef}
          className="font-en text-[68px] leading-[76px] font-medium will-change-transform max-lg:text-[56px] max-lg:leading-[66px] max-sm:text-[40px] max-sm:leading-[48px]"
        >
          {title}
        </h2>
        {description ? (
          <p className="font-ko text-base leading-6 font-light text-secondary-txt max-w-[720px] max-lg:max-w-full max-sm:text-sm max-sm:leading-[22px]">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}
