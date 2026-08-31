import footerTxt from "../../assets/comn/footer-txt.png";
import footerTxtBlack from "../../assets/comn/footer-txt-black.png";
import Reveal from "../common/Reveal";

interface FooterProps {
  theme?: "dark" | "sub";
  /** AOS가 걸려있던 페이지(Home, PortfolioList)만 지정. 없으면 애니메이션 없이 렌더링. */
  revealDuration?: number;
}

const badgeBase =
  "absolute font-en text-[18px] leading-[26px] font-medium px-[22px] py-4 rounded-[50px] text-white " +
  "max-lg:text-base max-lg:leading-6 max-lg:px-[14px] max-lg:py-[10px] " +
  "max-sm:text-xs max-sm:leading-5 max-sm:px-[10px] max-sm:py-1.5";

function FooterContent({ theme }: { theme: "dark" | "sub" }) {
  return (
    <div className="relative flex justify-center items-center">
      <figure>
        <img
          src={theme === "sub" ? footerTxtBlack : footerTxt}
          alt=""
          className="max-w-full h-auto max-sm:min-w-[320px]"
        />
      </figure>
      <span
        className={[
          badgeBase,
          "bg-[#6f47db] top-[-14%] left-[20.2%] animate-[float_2.7s_ease-in-out_infinite_alternate]",
          "max-sm:top-[-22%] max-sm:left-[17.2%]",
        ].join(" ")}
      >
        Grapic design
      </span>
      <span
        className={[
          badgeBase,
          "bg-[#6f47db] top-[32%] left-[80%] animate-[float_2.5s_ease-in-out_infinite_alternate]",
          "max-lg:top-[98%] max-lg:left-[18%] max-sm:hidden",
        ].join(" ")}
      >
        Grapic design
      </span>
      <span
        className={[
          badgeBase,
          "bg-[#0ecb7b] top-[-5%] right-[20%] [animation-delay:0.5s] animate-[float_2.3s_ease-in-out_infinite_alternate]",
          "max-lg:top-[-8%] max-sm:top-[28%] max-sm:right-[2%]",
        ].join(" ")}
      >
        Web design
      </span>
      <span
        className={[
          badgeBase,
          "bg-[#f56214] bottom-[26%] left-[3.1%] [animation-delay:0.2s] animate-[float_1.6s_ease-in-out_infinite_alternate]",
          "max-lg:left-[-2%] max-sm:bottom-[-10%] max-sm:left-0",
        ].join(" ")}
      >
        Publishing
      </span>
      <span
        className={[
          badgeBase,
          "bg-[#f56214] bottom-[-1.8%] left-[64.4%] animate-[float_2.5s_ease-in-out_infinite_alternate]",
          "max-lg:bottom-[-10%] max-lg:left-[64%] max-sm:hidden",
        ].join(" ")}
      >
        Publishing
      </span>
    </div>
  );
}

export default function Footer({ theme = "dark", revealDuration }: FooterProps) {
  // 마지막 요소의 아래 여백은 margin이 아니라 padding으로 준다 — margin-bottom은 부모/body에
  // border·padding·overflow가 없으면 그대로 밖으로 collapse되어(margin collapsing) body
  // 바깥(html)까지 스크롤 영역을 늘려버리는데, 그 늘어난 부분은 .wrap의 배경색(bg-black)이
  // 칠해지는 범위 밖이라 브라우저 기본 배경(흰색)이 그대로 드러나 페이지 맨 아래에 흰 여백이
  // 남는 문제가 있었다. padding은 collapse되지 않고 박스 안쪽 여백으로 남아 배경색 범위에
  // 포함되므로 이 문제가 생기지 않는다.
  if (revealDuration != null) {
    return (
      <Reveal as="footer" duration={revealDuration} className="max-w-[1880px] px-10 mx-auto pb-[180px] max-lg:px-5 max-lg:pb-[140px] max-sm:px-[10px] max-sm:pb-[46px]">
        <FooterContent theme={theme} />
      </Reveal>
    );
  }

  return (
    <footer className="max-w-[1880px] px-10 mx-auto pb-[180px] max-lg:px-5 max-lg:pb-[140px] max-sm:px-[10px] max-sm:pb-[46px]">
      <FooterContent theme={theme} />
    </footer>
  );
}
