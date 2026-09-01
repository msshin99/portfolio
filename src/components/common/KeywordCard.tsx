import type { PointerEvent } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import type { KeywordItem } from "../../data/keywords";
import { useTilt } from "../../hooks/useTilt";
import { prefersReducedMotion } from "../../lib/gsap";

interface KeywordCardProps {
  item: KeywordItem;
  /** 유휴 상태 부유 애니메이션의 시작 딜레이를 카드마다 다르게 주기 위한 순번. */
  index: number;
}

export default function KeywordCard({ item, index }: KeywordCardProps) {
  const tiltRef = useTilt<HTMLElement>({ max: 24, scale: 1.15 });

  // 마우스 위치를 따라가는 스페큘러 글레어(유리/메탈 렌더 위에서 빛이 미끄러지는
  // 하이라이트)의 중심 좌표. figure 자체의 transform은 useTilt(GSAP)가 소유하므로,
  // 이 값들은 별도의 오버레이 span의 배경 위치만 구동해 서로 다른 스타일 속성을 건드려
  // GSAP와 충돌하지 않는다.
  const glareX = useMotionValue(50);
  const glareY = useMotionValue(50);
  const glareBackground = useTransform(
    [glareX, glareY],
    ([x, y]) => `radial-gradient(circle at ${x}% ${y}%, rgba(255,255,255,0.95), transparent 32%)`
  );

  const handlePointerMove = (e: PointerEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    glareX.set(((e.clientX - rect.left) / rect.width) * 100);
    glareY.set(((e.clientY - rect.top) / rect.height) * 100);
  };

  const reduceMotion = prefersReducedMotion();

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
      {/* li 자체는 StaggerReveal(GSAP)이 진입 애니메이션에서 transform을 직접 제어하므로,
          유휴 부유 애니메이션은 그 밑의 별도 래퍼에 건다 — 같은 엘리먼트의 transform을
          GSAP와 framer-motion이 동시에 쓰면 서로 덮어써버린다. */}
      <motion.div
        animate={reduceMotion ? undefined : { y: [0, -6, 0] }}
        transition={{
          duration: 3.6,
          repeat: Infinity,
          ease: "easeInOut",
          delay: index * 0.3,
        }}
      >
        <figure
          ref={tiltRef}
          onPointerMove={handlePointerMove}
          className="relative flex justify-center items-center will-change-transform"
        >
          <span className="pointer-events-none absolute inset-0 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-[0.12] [background:radial-gradient(circle,var(--color-primary-txt),transparent_70%)]" />
          <img
            src={item.image}
            alt=""
            className="relative w-[220px] max-w-full h-auto [filter:drop-shadow(0_0_0_rgba(0,0,0,0))] transition-[filter] duration-500 group-hover:[filter:drop-shadow(0_26px_36px_rgba(0,0,0,0.55))]"
          />
          {/* 이미지의 알파 채널로 마스킹된 스페큘러 글레어 — 3D 렌더 오브젝트 표면 위에서만
              빛이 미끄러지고, 투명한 여백에는 새어나가지 않는다. */}
          <motion.span
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{
              background: glareBackground,
              mixBlendMode: "screen",
              WebkitMaskImage: `url(${item.image})`,
              maskImage: `url(${item.image})`,
              WebkitMaskSize: "contain",
              maskSize: "contain",
              WebkitMaskRepeat: "no-repeat",
              maskRepeat: "no-repeat",
              WebkitMaskPosition: "center",
              maskPosition: "center",
            }}
          />
          {/* 오브젝트 실루엣에 마스킹된 대각선 샤인 — 호버가 시작될 때마다 강한 하이라이트
              바가 표면을 한 번 쓸고 지나가는, 눈에 확 띄는 "임팩트" 연출. */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 overflow-hidden"
            style={{
              WebkitMaskImage: `url(${item.image})`,
              maskImage: `url(${item.image})`,
              WebkitMaskSize: "contain",
              maskSize: "contain",
              WebkitMaskRepeat: "no-repeat",
              maskRepeat: "no-repeat",
              WebkitMaskPosition: "center",
              maskPosition: "center",
            }}
          >
            <span className="absolute inset-y-0 -left-2/3 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white to-transparent mix-blend-screen -translate-x-full group-hover:translate-x-[300%] transition-transform duration-700 ease-out" />
          </span>
        </figure>
      </motion.div>
    </li>
  );
}
