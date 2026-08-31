import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import type { WorkItem } from "../../data/works";
import { heroLayoutId, isDetailSlug, slugFromHref } from "../../lib/portfolioNav";
import { lockBackgroundScroll } from "../../lib/scrollLock";
import { usePortfolios } from "../../lib/portfolioApi";

interface WorkCardProps {
  item: WorkItem;
  /** portfoliolist.html / Related Projects처럼 `.subpage ul.work-list.sub-page`
   *  안에 있을 때는 sub 텍스트 색이 #767676로 오버라이드된다. */
  subPage?: boolean;
  /** true면 이 카드의 썸네일 <-> 상세 모달 히어로 이미지가 같은 layoutId를 공유해서
   *  framer-motion이 위치/크기를 자동으로 모프시킨다. Nordune/Goal Check/Prmr처럼 "진짜
   *  상세 콘텐츠"가 있는 슬러그를 가리킬 때만 실제로 적용되고, 아니라면 무시된다. false를
   *  줘도 리스트 위 모달로 열리는 동작 자체는 그대로 동작하고, 이미지가 순간적으로
   *  크로스페이드될 뿐이다.
   */
  shared?: boolean;
  /** 같은 슬러그를 가리키는 카드가 한 화면에 동시에 두 번 이상 렌더될 수 있는 곳(Home의
   *  2번째 줄처럼 1번째 줄과 같은 프로젝트를 다시 보여주는 경우)에서, 이 카드가 어느
   *  인스턴스인지 구분하는 값. 지정하지 않으면 같은 슬러그의 다른 인스턴스와 layoutId가
   *  겹쳐서, 어느 쪽을 클릭하든 모달이 "먼저 마운트된" 인스턴스의 화면 위치를 시작점으로
   *  써버리는 문제가 생긴다(예: 실제로 클릭한 카드가 아니라 화면 밖의 다른 카드 위치에서
   *  애니메이션이 시작됨). 같은 슬러그가 여러 곳에 나오는 화면에서는 각 인스턴스마다 다른
   *  값을 줘야 한다. */
  layoutKey?: string;
  /** li 자체의 너비를 명시적으로 지정해야 할 때(Home의 큰 카드/작은 카드가 섞인 비대칭
   *  행 등) 사용. 비워두면 기존처럼 부모 flex 행에서 암묵적으로 균등 분할된다.
   *  PortfolioList/Related Projects처럼 grid로 배치되는 곳에서는 grid가 너비를
   *  결정하므로 이 값 자체가 무의미하다(전달하지 않으면 됨). */
  widthClassName?: string;
}

export default function WorkCard({
  item,
  subPage = false,
  shared = false,
  layoutKey,
  widthClassName = "",
}: WorkCardProps) {
  const subTextClass = subPage ? "text-[#767676]" : "text-secondary-txt";
  const location = useLocation();

  // 클릭한 순간 이 카드는 layoutId 공유 그룹에서 스스로 "이탈"한다 — 배경 리스트는 모달이 뜬
  // 뒤에도 계속 마운트된 채로 남아있는데, framer-motion은 같은 layoutId를 가진 엘리먼트가
  // 화면에 "그대로 남아있는 상태"에서 새 엘리먼트가 나타나면 자동으로 opacity crossfade를
  // 건다(공식적으로 끄는 옵션은 없고, framer-motion 팀도 wontfix로 처리한 동작). 전환
  // 후반부(두 박스 크기가 비슷해지는 순간)에 두 인스턴스가 동시에 부분 투명도로 겹쳐 보이는
  // "잔상"으로 나타났다. 클릭 즉시 이 인스턴스의 layoutId를 떼어내면(undefined) framer는
  // "원본이 페이지를 떠났다"고 인식해서 크로스페이드 없이 마지막으로 측정해둔 위치만 넘겨주고,
  // 모달의 히어로 이미지 혼자 그 위치에서 깔끔하게 FLIP된다.
  //
  // 다만 layoutId를 떼기만 하면 이 썸네일은 더 이상 framer가 관리하지 않는 그냥 평범한
  // div가 되어 opacity 1로 원래 자리에 계속 남아있는다 — 모달 배경이 아직 투명한 초반
  // 구간(PortfolioDetailModal 참고) 동안 이 "가만히 남아있는" 원본 썸네일이 커지는 중인
  // 히어로 이미지 뒤로 비쳐 보여서 여전히 겹쳐 보이는 잔상이 생겼다. 그래서 layoutId를 뗌과
  // 동시에 이 인스턴스 자체를 opacity 0으로 즉시(애니메이션 없이) 완전히 숨긴다.
  // 플레인 style prop으로 opacity를 주면 이미 이 엘리먼트를 추적 중이던 framer의 내부
  // 렌더 루프가 매 프레임 자기 값(opacity:1)으로 덮어써버려서 안 먹힌다 — motion 컴포넌트가
  // 이미 관리 중인 opacity/transform 같은 속성은 반드시 animate prop으로 줘야 framer 자신의
  // 값보다 우선한다. duration:0으로 줘서 페이드 없이 즉시 전환되게 한다.
  //
  // 모달이 닫히는 시점을 이 카드(배경에 계속 남아있는 컴포넌트)가 직접 알 방법이 없으므로,
  // 히어로 모프(PortfolioDetailContent.tsx의 HERO_MORPH_TRANSITION, 1.4초)가 확실히 끝날
  // 만한 시간이 지나면 그냥 되돌린다 — 그 시점엔 이미 모달이 화면 전체를 덮고 있어서(흰
  // 배경 전환은 모프보다 먼저 끝남) 이 카드가 다시 보여도 사용자에게는 안 보인다. 다음에
  // 같은 카드를 다시 클릭할 때도 같은 모프가 정상 동작하게 하기 위함.
  const [handedOff, setHandedOff] = useState(false);

  const { rows } = usePortfolios();
  const knownSlugs = rows?.map((r) => r.slug) ?? [];

  const isExternal = /^https?:\/\//.test(item.href);
  const slug = slugFromHref(item.href);
  // "진짜 상세 콘텐츠(제목/설명/prev-next)"가 있는 slug만 리스트 위 모달로 연다 — Supabase에
  // 등록된(=관리자가 새로 추가한 것 포함) 프로젝트만 해당. chairpdp/cosmeticpdp처럼 이미지
  // 한 장짜리 별도 템플릿은 이 목록에 없으므로 원래대로 풀 페이지 이동.
  const isModalTarget = !isExternal && isDetailSlug(slug, knownSlugs);
  const useSharedImage = shared && isModalTarget;
  const layoutId = useSharedImage ? heroLayoutId(slug, layoutKey) : undefined;

  const figureContent = (
    <figure
      className={[
        "relative overflow-hidden mb-4 rounded-md",
        "max-lg:mb-[14px] max-lg:rounded-sm max-sm:mb-2",
        "group [box-shadow:0_0_0_rgba(0,0,0,0)] hover:shadow-2xl transition-shadow duration-300",
      ].join(" ")}
    >
      {useSharedImage ? (
        // layoutId는 이미지가 아니라 "빈" wrapper div에 건다. 3:2 썸네일 <-> 풀스크린 히어로처럼
        // 가로세로 비율이 달라지는 layoutId 전환에서, <motion.img>에 직접 layoutId를 걸면
        // framer-motion이 이미지 픽셀이 비율에 안 맞게 늘어나 보이는 걸 막으려고 두 인스턴스
        // 사이에 opacity crossfade를 자동으로 걸어버린다 — 전환 후반부(두 박스 크기가 비슷해지는
        // 순간) 두 이미지가 동시에 부분 투명도로 겹쳐 보이는 "잔상"으로 나타났다. 콘텐츠가 없는
        // div가 대신 layoutId를 지므로 크로스페이드가 필요 없다.
        //
        // 안쪽 <img>는 반드시 일반 img여야 한다 — framer-motion의 `layout` prop을 주면 부모
        // div가 시각적으로 작아지는 것과 정확히 반대 방향의 역보정(counter-scale) transform을
        // 자동으로 걸어버려서, 사진 자체는 항상 원래(풀스크린) 크기 그대로 있고 부모 박스가
        // 커지는 만큼만 "구멍"으로 더 보이는 것처럼 되어버린다 — 즉 "사진이 커지는" 게 아니라
        // "이미 꽉 찬 사진을 보는 창이 넓어지는" 것처럼 보여서 핵심 전환 모션 자체가 깨진다.
        // object-cover로 채우는 것만으로 충분하고 별도 framer 추적은 필요 없다.
        <motion.div
          layoutId={handedOff ? undefined : layoutId}
          animate={{ opacity: handedOff ? 0 : 1 }}
          transition={{ duration: 0 }}
          className="w-full aspect-[3/2] max-w-full"
        >
          <img src={item.image} alt={item.title} className="w-full h-full object-cover block" />
        </motion.div>
      ) : (
        <img
          src={item.image}
          alt={item.title}
          className="rounded-md max-lg:rounded-sm w-full aspect-[3/2] object-cover max-w-full"
        />
      )}
      <span
        className={[
          "pointer-events-none absolute inset-0 rounded-md max-lg:rounded-sm max-sm:rounded-sm",
          "backdrop-blur-[30px] bg-black/50 opacity-0 invisible",
          "transition-opacity duration-300 ease-[ease-in-out]",
          "group-hover:opacity-100 group-hover:visible",
        ].join(" ")}
      />
      <span
        className={[
          "pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
          "font-en text-base font-medium text-white opacity-0 invisible",
          "transition-opacity duration-300 ease-[ease-in-out]",
          "group-hover:opacity-100 group-hover:visible",
        ].join(" ")}
      >
        VIEW MORE
      </span>
    </figure>
  );

  const textContent = (
    <>
      <div className="txt-top flex justify-between mb-1 max-lg:mb-0.5 max-sm:mb-0">
        <p className="font-en text-xl leading-7 font-medium max-lg:text-xl max-lg:leading-7 max-sm:text-lg max-sm:leading-[26px]">
          {item.title}
        </p>
        <span className={`font-ko text-base leading-6 font-light ${subTextClass} max-lg:text-[13px]`}>
          {item.date}
        </span>
      </div>
      <span className={`font-en text-sm leading-[22px] font-light ${subTextClass} max-lg:text-[13px]`}>
        {item.sub}
      </span>
    </>
  );

  if (isExternal) {
    return (
      <li className={widthClassName}>
        <a href={item.href} target="_blank" rel="noopener noreferrer" className="block">
          {figureContent}
          {textContent}
        </a>
      </li>
    );
  }

  if (isModalTarget) {
    return (
      <li className={widthClassName}>
        <Link
          to={item.href}
          state={{ backgroundLocation: location, heroLayoutId: layoutId }}
          onClick={() => {
            lockBackgroundScroll();
            if (useSharedImage) {
              setHandedOff(true);
              window.setTimeout(() => setHandedOff(false), 1800);
            }
          }}
          className="block"
        >
          {figureContent}
          {textContent}
        </Link>
      </li>
    );
  }

  return (
    <li className={widthClassName}>
      <Link to={item.href} className="block">
        {figureContent}
        {textContent}
      </Link>
    </li>
  );
}
