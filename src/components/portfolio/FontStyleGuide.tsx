import type { ReactNode } from "react";
import type { FontGuide, FontInfoBlock } from "../../data/portfolioDetails";

/** 우측 카드에 표시되는 "Font Weight" 라벨(예: Bold/Medium/Regular)을 실제 굵기 클래스로
 *  변환한다 — guide.variant는 색상 위계(진하기)만 나타낼 뿐 굵기와 무관한 선택 값이라,
 *  variant가 비어 있는 관리자 입력 폰트 블록은 라벨과 무관하게 전부 굵게 보이는 문제가
 *  있었다. 라벨 텍스트 자체에서 굵기를 읽어오면 어떤 값을 입력하든 항상 정확히 반영된다. */
function resolveWeightClass(weight: string): string {
  const w = weight.trim().toLowerCase();
  if (w.includes("thin")) return "font-thin";
  if (w.includes("extralight")) return "font-extralight";
  if (w.includes("light")) return "font-light";
  if (w.includes("regular") || w.includes("normal")) return "font-normal";
  if (w.includes("medium")) return "font-medium";
  if (w.includes("semibold")) return "font-semibold";
  if (w.includes("extrabold") || w.includes("black") || w.includes("heavy")) return "font-extrabold";
  if (w.includes("bold")) return "font-bold";
  return "font-normal";
}

function GuideLeft({ guide }: { guide: FontGuide }) {
  const isPrata = guide.variant === "prmr";
  const weightClass = resolveWeightClass(guide.weight);
  const colorClass =
    guide.variant === "two" ? "text-[#767676]" : guide.variant === "three" ? "text-[#999]" : "text-sub-primary-txt";

  return (
    <div className="left">
      <p
        className={[
          "tit text-[20px] leading-7 mb-0.5",
          isPrata ? "font-prata" : "font-en",
          weightClass,
          colorClass,
          "max-lg:text-lg max-lg:leading-[26px] max-sm:text-base max-sm:leading-6",
        ].join(" ")}
      >
        {guide.title}
      </p>
      <span
        className={["sub text-sm leading-[22px]", isPrata ? "font-prata" : "font-en", weightClass, colorClass].join(" ")}
      >
        {guide.sample}
      </span>
    </div>
  );
}

function GuideRight({ guide, isDark = false }: { guide: FontGuide; isDark?: boolean }) {
  const cards: { tit: ReactNode; sub: string }[] = [
    { tit: <b className="font-medium">{guide.weight}</b>, sub: "Font Weight" },
    {
      tit: guide.sizes.map((size, i) => (
        <b key={i} className="mr-6 last:mr-0 font-medium">
          {size}
        </b>
      )),
      sub: "Font Size",
    },
    { tit: <b className="font-medium">{guide.letterSpacing}</b>, sub: "Letter Spacing" },
    {
      tit: guide.tags.map((tag, i) => (
        <b key={i} className="mr-6 last:mr-0 font-medium">
          {tag}
        </b>
      )),
      sub: "Html Tag",
    },
  ];

  return (
    <ul className="right grid grid-cols-2 gap-5 w-full max-w-[910px] max-lg:gap-x-3 max-lg:gap-y-4 max-lg:max-w-full max-sm:grid-cols-1 max-sm:gap-3">
      {cards.map((card, i) => (
        <li
          key={i}
          className={[
            isDark ? "bg-[#161616]" : "bg-[#f4f5f9]",
            "rounded-[4px] w-full max-w-[445px] p-[16px_18px] max-lg:p-[12px_14px] max-lg:max-w-full max-sm:max-w-full",
            "transition-transform duration-300 ease-[ease] will-change-transform hover:-translate-y-1.5",
            isDark ? "hover:shadow-[0_16px_32px_rgba(255,211,89,0.15)]" : "hover:shadow-[0_16px_32px_rgba(0,0,0,0.12)]",
          ].join(" ")}
        >
          {/* 카드 배경은 페이지 테마에 따라 밝은 회색(#f4f5f9) 또는 어두운 회색(#161616,
              goldenpine 전용)으로 고정되고, 그 배경 자체가 이미 두 값 중 하나로 확정돼 있어
              text-sub-primary/secondary-txt 같은 페이지 테마 변수를 따르는 클래스를 쓰면 안 된다
              (theme 변수가 바뀌어도 이 카드 배경은 안 바뀌므로, 밝은 배경에 흰 글자 또는 어두운
              배경에 검정 글자가 얹혀 안 보이게 될 수 있다). 그래서 글자색도 항상 배경에 맞춰
              리터럴로 고정한다. */}
          <p
            className={[
              "tit font-en text-lg leading-[26px] font-medium max-lg:text-base max-lg:leading-6 max-sm:text-sm max-sm:leading-5",
              isDark ? "text-white" : "text-[#222222]",
            ].join(" ")}
          >
            {card.tit}
          </p>
          <span
            className={[
              "sub font-en text-sm leading-[22px] font-light max-lg:text-xs max-lg:leading-[18px]",
              isDark ? "text-white/60" : "text-[#505050]",
            ].join(" ")}
          >
            {card.sub}
          </span>
        </li>
      ))}
    </ul>
  );
}

interface FontStyleGuideProps {
  block: FontInfoBlock;
  /** true면 우측 스펙 카드를 밝은 회색(#f4f5f9) 대신 어두운 회색(#161616) + 흰 글자로
   *  보여준다. 검정+골드 다크 테마인 goldenpine 상세페이지에서만 전달된다. */
  isDark?: boolean;
}

export default function FontStyleGuide({ block, isDark = false }: FontStyleGuideProps) {
  return (
    <div
      className={`font-info max-w-[1530px] mx-auto ${block.tight ? "mb-10" : "mb-[140px]"} max-lg:mb-[100px] max-sm:mb-[60px]`}
    >
      <figure className="mb-20 max-lg:mb-[60px] max-sm:mb-10">
        <img
          src={block.image}
          alt=""
          className="pc max-w-full h-auto min-w-[400px] max-sm:hidden"
        />
        <img
          src={block.imageMobile}
          alt=""
          className="mo hidden max-w-full h-auto max-sm:block max-sm:min-w-[320px]"
        />
      </figure>

      {block.guides.map((guide, i) => (
        <div
          key={i}
          className={[
            "font-style-guide flex justify-between gap-[60px] mb-[60px]",
            "max-lg:flex-col max-lg:gap-6 max-lg:mb-10",
            "max-sm:gap-3.5 max-sm:mb-7",
            guide.variant === "three" ? "!mb-0" : "",
          ].join(" ")}
        >
          <GuideLeft guide={guide} />
          <GuideRight guide={guide} isDark={isDark} />
        </div>
      ))}
    </div>
  );
}
