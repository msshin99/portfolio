import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import IntroTop from "../components/home/IntroTop";
import SectionTitle from "../components/common/SectionTitle";
import Reveal from "../components/common/Reveal";
import { useTilt } from "../hooks/useTilt";
import { useMagnetic } from "../hooks/useMagnetic";
import profileImg from "../assets/portfolio/profile.jpg";
import { useSiteContent, getSiteText, getSiteImage } from "../lib/siteContentApi";

const DEFAULT_ABOUT_HEADING = "모두를 집중시키는 디자이너 신민석입니다";
const DEFAULT_ABOUT_DESCRIPTION =
  "언제나 남들과 다른 시각으로 디자인을 바라보며, 평범함 속에 숨겨진 새로운 가능성을 발견하고, 익숙한 것들에서 비범함을 이끌어냅니다.";

interface InfoRow {
  label: string;
  items: { text: string; date?: string; role?: string }[];
}

const infoRows: InfoRow[] = [
  {
    label: "프로필",
    items: [{ text: "신민석" }, { text: "1999.04.22" }, { text: "010-7558-9904" }, { text: "tlsalstjr422@naver.com" }],
  },
  {
    label: "자격사항",
    items: [
      { text: "생산자동화기능사", date: "2015.06" },
      { text: "자동차운전면허증 2종", date: "2021.01" },
      { text: "웹디자인 기능사", date: "2023.04" },
    ],
  },
  {
    label: "학력사항",
    items: [
      { text: "충북전산기계고등학교", date: "2015.02 ~ 2018.02" },
      { text: "대전과학기술대학교 실내건축디자인학과", date: "2018.02 ~ 2021.02" },
      { text: "국립한국교통대학교 커뮤니케이션디자인학과", date: "2021.02 ~ 2023.08" },
    ],
  },
  {
    label: "수상경력",
    items: [
      { text: "상품문화디자인국제 공모전 학회장상", date: "2020.08" },
      { text: "제5회 충청북도 옥외광고대상 동상", date: "2021.01" },
      { text: "충북미술대전 입상", date: "2020.08" },
    ],
  },
  {
    label: "경력사항",
    items: [
      { text: "위드시스템", date: "2024.03 ~ 2025.05" },
      {
        text: "시그널디코드(SignalDecode)",
        date: "2025.12 ~ 2026.01 · 2개월",
        role: "UI/UX디자인 · 디자인팀 사원",
      },
      {
        text: "주식회사 시그널디코드",
        date: "2026.01 ~ 2026.06 · 6개월",
        role: "UI/UX디자인 · 디자인팀 사원",
      },
      {
        text: "주식회사 헤담",
        date: "2026.06 ~ 2026.08 · 3개월",
        role: "UI/UX디자인 · 마케팅팀 사원",
      },
    ],
  },
];

const EMAIL_RE = /\S+@\S+\.\S+/;
const PHONE_RE = /^\d{2,3}-\d{3,4}-\d{4}$/;

/** 이메일/전화번호처럼 실제로 눌러서 쓸 수 있는 값은 mailto:/tel: 링크로 바꿔준다 —
 *  단순 텍스트 나열이 아니라 실제로 눌러볼 수 있는 항목이 섞여 있어야 "인터랙티브"하다. */
function ItemText({ text }: { text: string }) {
  if (EMAIL_RE.test(text)) {
    return (
      <a href={`mailto:${text}`} className="transition-colors duration-300 hover:text-primary-txt">
        {text}
      </a>
    );
  }
  if (PHONE_RE.test(text)) {
    return (
      <a href={`tel:${text.replace(/-/g, "")}`} className="transition-colors duration-300 hover:text-primary-txt">
        {text}
      </a>
    );
  }
  return <>{text}</>;
}

interface InfoAccordionRowProps {
  row: InfoRow;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
}

/** 자격사항/학력사항 같은 5개 카테고리를 아코디언으로 여닫는 한 행. 토글 아이콘에는
 *  useMagnetic을 걸어, 커서가 다가가면 아이콘 자체가 살짝 끌려오는 미세한 반응을 준다. */
function InfoAccordionRow({ row, index, isOpen, onToggle }: InfoAccordionRowProps) {
  const magneticRef = useMagnetic<HTMLSpanElement>({ strength: 10 });

  return (
    <li className="border-b border-white/10">
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={onToggle}
        className="group/row flex w-full items-center justify-between gap-6 py-8 text-left transition-colors duration-300 hover:bg-white/[0.03] max-lg:py-6 max-sm:py-5"
      >
        <span className="flex items-center gap-6 max-sm:gap-3">
          <span
            className={[
              "font-en text-sm font-medium transition-colors duration-300",
              isOpen ? "text-primary-txt" : "text-tertiary-txt group-hover/row:text-secondary-txt",
            ].join(" ")}
          >
            {String(index + 1).padStart(2, "0")}
          </span>
          <span
            className={[
              "font-ko text-2xl font-medium transition-colors duration-300 max-lg:text-xl max-sm:text-lg",
              isOpen ? "text-white" : "text-secondary-txt group-hover/row:text-white",
            ].join(" ")}
          >
            {row.label}
          </span>
        </span>

        <span ref={magneticRef} className="relative h-4 w-4 shrink-0 will-change-transform">
          <span
            className={[
              "absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-white transition-transform duration-300",
              isOpen ? "rotate-45" : "rotate-0",
            ].join(" ")}
          />
          <span
            className={[
              "absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-white transition-transform duration-300",
              isOpen ? "-rotate-45" : "rotate-0",
            ].join(" ")}
          />
        </span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 pb-8 pl-[52px] max-lg:pl-10 max-sm:grid-cols-1 max-sm:gap-3 max-sm:pb-5 max-sm:pl-8">
              {row.items.map((item) => (
                <p key={item.text} className="font-ko text-base font-light leading-6 text-secondary-txt max-sm:text-sm">
                  <ItemText text={item.text} />
                  {item.date ? <span className="mt-1 block text-sm leading-5 text-tertiary-txt">{item.date}</span> : null}
                  {item.role ? <span className="mt-0.5 block text-sm leading-5 text-tertiary-txt">{item.role}</span> : null}
                </p>
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </li>
  );
}

export default function About() {
  const { rows: siteContent } = useSiteContent();
  const description = getSiteText(siteContent, "about_description", DEFAULT_ABOUT_DESCRIPTION);
  const profilePhoto = getSiteImage(siteContent, "about_profile_image", profileImg);

  // 다른 비주얼 요소(키워드 카드, 섹션 타이틀)와 같은 톤의 인터랙션을 프로필 사진에도 준다 —
  // 다만 실사 인물 사진이라 아이콘만큼 과감하진 않게 각도/확대를 절제했다.
  const tiltRef = useTilt<HTMLElement>({ max: 10, scale: 1.04 });

  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="wrap relative bg-black text-white min-h-screen">
      <Header variant="default" />

      <main>
        <div className="about-page max-w-[1400px] mx-auto px-10 pt-[180px] pb-[160px] max-lg:px-10 max-lg:pt-[140px] max-lg:pb-[100px] max-sm:px-5 max-sm:pt-[100px] max-sm:pb-[60px]">
          <Reveal duration={3000} className="about-hero mb-[140px] max-lg:mb-20 max-sm:mb-14">
            <IntroTop heading={DEFAULT_ABOUT_HEADING} description={description} />
          </Reveal>

          <Reveal duration={3000}>
            <SectionTitle subTxt="(Profile)" title="Info" description="항목을 눌러 자세한 내용을 펼쳐보세요." />

            <div className="profile flex gap-[80px] max-lg:flex-col max-lg:gap-10">
              <figure
                ref={tiltRef}
                className="group relative sticky top-[160px] w-full max-w-[300px] shrink-0 self-start will-change-transform max-lg:static max-lg:max-w-[220px] max-sm:mx-auto max-sm:max-w-[180px]"
              >
                <span className="pointer-events-none absolute -inset-6 rounded-2xl opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-[0.15] [background:radial-gradient(circle,var(--color-primary-txt),transparent_70%)]" />
                <img
                  src={profilePhoto}
                  alt="신민석 프로필 사진"
                  className="relative w-full rounded-md [filter:drop-shadow(0_0_0_rgba(0,0,0,0))] transition-[filter] duration-500 group-hover:[filter:drop-shadow(0_20px_28px_rgba(0,0,0,0.5))] max-lg:rounded-sm"
                />
              </figure>

              <ul className="flex-1 border-t border-white/10">
                {infoRows.map((row, index) => (
                  <InfoAccordionRow
                    key={row.label}
                    row={row}
                    index={index}
                    isOpen={openIndex === index}
                    onToggle={() => setOpenIndex((prev) => (prev === index ? null : index))}
                  />
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </main>

      <Footer theme="dark" revealDuration={3000} />
    </div>
  );
}
