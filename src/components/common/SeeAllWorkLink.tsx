import { Link } from "react-router-dom";
import { useMagnetic } from "../../hooks/useMagnetic";

const textClass = [
  "font-en text-[56px] leading-[64px] font-bold block",
  "max-lg:text-[38px] max-lg:leading-[44px] max-sm:text-[30px] max-sm:leading-[34px]",
].join(" ");

/**
 * My Works 세 번째 줄 아래, 오른쪽 정렬로 배치되는 "포트폴리오 전체보기" 텍스트 링크.
 * 아래 밑줄은 hover와 무관하게 항상 고정된 자리에 그대로 있고, 그 위 텍스트만 hover 시
 * 지금 보이는 흰 텍스트가 위로 빠져나가면서 같은 텍스트(주황색)가 뒤이어 올라와 자리를
 * 채우는 2단 리빌 효과. 여기에 더해 GSAP 마그네틱 효과로, 커서가 가까이 오면 링크 전체가
 * 그 방향으로 살짝 끌려간다.
 */
export default function SeeAllWorkLink() {
  const magneticRef = useMagnetic<HTMLAnchorElement>({ strength: 14 });

  return (
    <div className="flex justify-end">
      <Link ref={magneticRef} to="/portfolio" className="group inline-flex flex-col items-end will-change-transform">
        <span className="relative block overflow-hidden">
          <span
            className={[
              textClass,
              "text-white transition-transform duration-500 ease-[ease] will-change-transform",
              "group-hover:-translate-y-full",
            ].join(" ")}
          >
            See all work
          </span>
          <span
            className={[
              textClass,
              "absolute inset-0 translate-y-full text-primary-txt transition-transform duration-500 ease-[ease] will-change-transform",
              "group-hover:translate-y-0",
            ].join(" ")}
            aria-hidden="true"
          >
            See all work
          </span>
        </span>
        <span className="mt-2.5 block h-px w-full bg-white" />
      </Link>
    </div>
  );
}
