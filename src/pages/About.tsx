import Header from "../components/layout/Header";
import profileImg from "../assets/portfolio/profile.jpg";
import { useSiteContent, getSiteText, getSiteImage } from "../lib/siteContentApi";

const DEFAULT_ABOUT_DESCRIPTION =
  "언제나 남들과 다른 시각으로 디자인을 바라보며, 평범함 속에 숨겨진 새로운 가능성을 발견하고, 익숙한 것들에서 비범함을 이끌어냅니다.";

interface InfoRow {
  label: string;
  items: { text: string; date?: string }[];
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
    items: [{ text: "위드시스템", date: "2024.03 ~ 2025.05" }],
  },
];

export default function About() {
  const { rows: siteContent } = useSiteContent();
  const description = getSiteText(siteContent, "about_description", DEFAULT_ABOUT_DESCRIPTION);
  const profilePhoto = getSiteImage(siteContent, "about_profile_image", profileImg);

  return (
    <div className="sub bg-white text-sub-primary-txt min-h-screen">
      <Header variant="sub" />

      <div className="about-page max-w-[1400px] mx-auto px-10 py-20 max-xl:px-10 max-xl:py-15 max-[767px]:px-4 max-[767px]:py-10">
        <div className="profile flex justify-between gap-10 max-[767px]:flex-col">
          <div className="left-info w-full max-w-[370px] max-xl:max-w-[280px] max-[767px]:max-w-full">
            <img
              src={profilePhoto}
              alt="신민석 프로필 사진"
              className="w-full max-w-[260px] mb-5 max-xl:w-[70%] max-xl:mb-3.5 max-[767px]:w-full max-[767px]:max-w-[767px] max-[767px]:mb-2.5"
            />
            <h5 className="tit font-ko text-[26px] leading-9 font-light text-sub-primary-txt relative mb-12 max-xl:text-2xl max-xl:leading-8 max-xl:mb-9 max-[767px]:text-xl max-[767px]:leading-7 max-[767px]:mb-[30px] after:absolute after:content-[''] after:w-[60px] after:h-0.5 after:bg-[#e5e5ec] after:left-0 after:bottom-[-18px] max-[767px]:after:bottom-[-14px]">
              모두를 <b className="font-bold">집중시키는 디자이너</b>
              <br className="max-[767px]:hidden" />
              신민석입니다
            </h5>
            <p className="desc font-ko text-base leading-6 font-light text-sub-secondary-txt max-xl:text-sm max-xl:leading-5">
              {description}
            </p>
          </div>

          <ul className="right-info grid grid-cols-2 gap-x-[30px] gap-y-0 max-xl:gap-[30px]">
            {infoRows.map((row) => (
              <li
                key={row.label}
                className="flex items-start gap-8 font-ko text-base leading-[22px] max-xl:flex-col max-xl:gap-4 max-xl:text-[15px] max-[767px]:text-sm max-[767px]:leading-5 max-[767px]:gap-2.5"
              >
                <div className="left-tit text-sub-primary-txt font-medium">{row.label}</div>
                <div className="list-desc">
                  {row.items.map((item) => (
                    <p key={item.text} className="font-light text-sub-primary-txt mb-4 last:mb-0 max-xl:mb-3">
                      {item.text}
                      {item.date ? (
                        <span className="block text-sm leading-5 text-sub-tertiary-txt w-full">{item.date}</span>
                      ) : null}
                    </p>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
