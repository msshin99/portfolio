import { Asterisk } from "lucide-react";
import { useState } from "react";
import StaggerReveal from "../common/StaggerReveal";
import serviceImg1 from "../../assets/service/img-01.jpg";
import serviceImg2 from "../../assets/service/img-02.jpg";
import serviceImg3 from "../../assets/service/img-03.jpg";

/** 실제 서비스 라인업 데이터. marqueeParts는 hover 시 흰 배경 위에서
 *  Asterisk 아이콘을 사이에 두고 번갈아 반복되는 문구 두 개 — 배열
 *  순서 그대로 반복되므로 항목마다 어느 문구가 먼저 나올지가 다르다. */
export interface ClientRowItem {
  category: string;
  title: string;
  meta: string;
  image: string;
  marqueeParts: [string, string];
}

/** 관리자가 site_content에 client_row_{n}_*을 채우면 그 값으로, 비워두면 이
 *  기본값을 그대로 쓴다(Home.tsx의 resolveClientRows 참고). */
export const DEFAULT_CLIENT_ROWS: ClientRowItem[] = [
  {
    category: "Visual Production",
    title: "AI Visual",
    meta: "(25)",
    image: serviceImg1,
    marqueeParts: ["AI Visual", "No Shoot Needed"],
  },
  {
    category: "Cross-Brand Design",
    title: "Multi-Brand",
    meta: "(23–26)",
    image: serviceImg2,
    marqueeParts: ["Multi-Brand", "Every Brand, Every Tone"],
  },
  {
    category: "Full-Cycle",
    title: "One-Stop",
    meta: "(22–26)",
    image: serviceImg3,
    marqueeParts: ["Plan → Design → Build", "One-Stop"],
  },
  {
    category: "Conversion Design",
    title: "SEO Growth",
    meta: "(24–26)",
    image: serviceImg1,
    marqueeParts: ["Design that Converts", "SEO Growth"],
  },
];

/** 마퀴 한 바퀴 안에 이 배열을 몇 번 반복할지 — 화면이 아주 넓어도(4K 모니터 등)
 *  줄 끝에 빈 공간이 보이지 않도록 넉넉히 반복해둔다. */
const MARQUEE_REPEAT = 6;

/** hover 시 나타나는 흰 배경 위 가로 스크롤 마퀴 한 벌. 같은 내용을 두 번
 *  이어붙이고 정확히 절반(-50%)만큼 이동시키면, 첫 벌이 화면 밖으로 완전히
 *  빠져나가는 순간 두 번째 벌이 정확히 그 자리를 이어받아 이음매 없이
 *  반복된다. */
function MarqueeSet({ marqueeParts, image }: { marqueeParts: [string, string]; image: string }) {
  return (
    <div className="flex shrink-0 items-center">
      {Array.from({ length: MARQUEE_REPEAT }).flatMap((_, i) =>
        marqueeParts.map((text, j) => (
          <div key={`${i}-${j}`} className="flex shrink-0 items-center gap-7 pr-20 max-lg:gap-5 max-lg:pr-14 max-sm:gap-4 max-sm:pr-9">
            <Asterisk className="h-9 w-9 shrink-0 text-black max-lg:h-7 max-lg:w-7 max-sm:h-5 max-sm:w-5" strokeWidth={2} />
            <span className="font-en whitespace-nowrap text-6xl font-medium text-black max-lg:text-5xl max-sm:text-3xl">
              {text}
            </span>
            <span className="block h-[136px] w-72 shrink-0 overflow-hidden rounded-full max-lg:h-20 max-lg:w-60 max-sm:h-14 max-sm:w-40">
              <img src={image} alt="" className="h-full w-full object-cover" />
            </span>
          </div>
        ))
      )}
    </div>
  );
}

function ClientRow({
  category,
  title,
  meta,
  image,
  marqueeParts,
  active,
  onToggle,
}: ClientRowItem & { active: boolean; onToggle: () => void }) {
  return (
    <li
      className="group relative cursor-pointer overflow-hidden border-t border-white/10 last:border-b"
      role="button"
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle();
        }
      }}
    >
      {/* 평소 상태 — 왼쪽 카테고리 / 가운데 큰 타이틀 / 오른쪽 연도. 좌우 라벨은
          absolute로 빼서 가운데 타이틀이 형제 요소의 폭과 무관하게 항상 컨테이너
          정중앙에 오게 한다(grid-cols-[1fr_auto_1fr] + justify-self-center 방식은
          좁은 화면에서 auto 트랙이 0으로 계산돼 타이틀이 왼쪽으로 쏠리는 문제가
          있었다). */}
      <div
        className={[
          "relative z-10 flex h-[220px] items-center justify-center transition-opacity duration-300 ease-out",
          "group-hover:opacity-0",
          "max-lg:h-[170px]",
          "max-sm:h-[130px]",
        ].join(" ")}
        style={active ? { opacity: 0 } : undefined}
      >
        <span className="font-en absolute left-10 text-base text-white/45 max-lg:left-6 max-sm:hidden">{category}</span>
        <h3 className="font-en text-center text-[76px] font-bold text-white max-lg:text-[46px] max-sm:text-[30px]">
          {title}
        </h3>
        <span className="font-en absolute right-10 text-base text-white/45 max-lg:right-6 max-sm:hidden">{meta}</span>
      </div>

      {/* hover(데스크탑)/tap(모바일) 상태 — 흰 배경 위로 로고 마크 + 브랜드명 +
          원형 이미지가 반복되며 끝없이 흘러가는 마퀴. pointer-events는 끄고,
          실제 클릭 대상은 이 li 자체다. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-20 flex items-center overflow-hidden bg-white opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100"
        style={active ? { opacity: 1 } : undefined}
      >
        <div className="client-marquee-track flex w-max shrink-0 items-center">
          <MarqueeSet marqueeParts={marqueeParts} image={image} />
          <MarqueeSet marqueeParts={marqueeParts} image={image} />
        </div>
      </div>
    </li>
  );
}

/** 포트폴리오(My Works)와 서비스(My Service) 섹션 사이에 들어가는 클라이언트
 *  리스트. 평소엔 카테고리/타이틀/연도만 보이는 담백한 텍스트 줄이지만,
 *  마우스를 올리면 그 줄이 흰 배경으로 바뀌며 브랜드 마크+이름+이미지가
 *  가로로 끝없이 흐르는 마퀴로 전환된다. 검은/흰 밴드가 화면 끝까지
 *  이어져야 해서(참고 이미지처럼) 다른 섹션과 달리 max-width 컨테이너 밖,
 *  화면 전체 폭에 걸쳐 렌더링한다. */
export default function ClientMarqueeList({ rows = DEFAULT_CLIENT_ROWS }: { rows?: ClientRowItem[] }) {
  // 데스크탑은 마우스 hover(group-hover)로 마퀴가 열리지만, 터치 기기는 :hover가
  // 애초에 발생하지 않는다. 탭으로도 같은 효과를 열고 닫을 수 있도록 별도
  // 상태를 두되, 각 행이 자기 상태를 따로 들고 있으면 여러 행을 연달아 탭했을
  // 때 전부 동시에 열린 채로 남아 화면이 지저분해진다 — 이 상태를 부모가 들고
  // "한 번에 하나만" 열리도록(아코디언처럼, 새로 탭한 행이 이전에 열려있던
  // 행을 자동으로 닫는다) 관리한다.
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <StaggerReveal as="ul" className="client-marquee-list w-full" y={30} stagger={0.12}>
      {rows.map((row, i) => (
        <ClientRow
          key={i}
          {...row}
          active={activeIndex === i}
          onToggle={() => setActiveIndex((prev) => (prev === i ? null : i))}
        />
      ))}
    </StaggerReveal>
  );
}
