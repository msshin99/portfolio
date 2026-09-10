import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import logo from "../../assets/comn/logo.png";
import logoBlack from "../../assets/comn/logo-b.png";
import MobileNav from "./MobileNav";

export type HeaderVariant = "default" | "sub";

interface HeaderProps {
  variant?: HeaderVariant;
}

const MENU_LINKS = [
  { label: "Home", to: "/" },
  { label: "Portfolio", to: "/portfolio" },
  { label: "About", to: "/about" },
];

export default function Header({ variant = "default" }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const isSub = variant === "sub";

  useEffect(() => {
    const scrollThreshold = 50;

    // 보통은 window(document)가 스크롤되지만, PortfolioDetailModal처럼 배경 스크롤을
    // position:fixed로 잠그고 자기 자신의 overflow-y-auto에서 스크롤하는 경우도 있다.
    // 'scroll' 이벤트는 버블링하지 않으므로, window에 캡처 단계로 등록해서 어떤 하위
    // 스크롤 컨테이너에서 발생한 스크롤이든 다 잡아낸 뒤 실제 스크롤된 대상에서
    // scrollTop(또는 window인 경우 scrollY)을 읽는다.
    const checkScroll = (e?: Event) => {
      const target = e?.target;
      const scrollY =
        target && target !== document && "scrollTop" in target
          ? (target as HTMLElement).scrollTop
          : window.scrollY;
      setScrolled(scrollY > scrollThreshold);
    };

    checkScroll();
    window.addEventListener("scroll", checkScroll, true);
    return () => window.removeEventListener("scroll", checkScroll, true);
  }, []);

  useEffect(() => {
    // menuOpen이 false일 때 무조건 overflow=""를 대입하면, Preloader처럼 body 스크롤을
    // 이미 잠가둔 다른 컴포넌트의 잠금을 마운트 시점에 곧바로 풀어버린다(메뉴가 열린 적도
    // 없는데 body.style.overflow가 계속 ""로 리셋됨). 메뉴가 실제로 열릴 때만 이 effect가
    // overflow에 관여하도록 가드한다.
    if (!menuOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <header
      id="header"
      className={[
        "w-full flex items-center justify-between gap-12 font-en z-10",
        "px-10 py-[18px] max-lg:p-10 max-sm:px-5 max-sm:py-[18px]",
        "transition-[background] duration-300 ease-[ease]",
        isSub
          ? "relative"
          : [
              "fixed left-1/2 -translate-x-1/2 top-0",
              scrolled
                ? "bg-black/50 backdrop-blur-[10px] shadow-[0_4px_6px_rgba(0,0,0,0.3)]"
                : "",
            ].join(" "),
      ].join(" ")}
    >
      {/* w-[30%]는 데스크톱 넓은 헤더에서만 의도대로 여유 있게 남는다 — 태블릿/모바일처럼
          헤더 자체가 좁아지면 30%가 로고 이미지의 고정 px 크기보다 작아져서, Tailwind
          preflight의 img{max-width:100%} 때문에 이미지가 그 30% 폭까지 눌려버린다(=아무리
          max-sm:w-[...]를 키워도 실제로는 더 작게 보였던 원인). max-lg부터는 컨테이너를
          내용물(이미지) 크기에 맞게 auto로 풀어서 이미지가 지정한 크기 그대로 보이게 한다. */}
      <h1 className="logo w-[30%] max-lg:relative max-lg:z-[60] max-lg:w-auto">
        <Link to="/">
          <img
            src={isSub ? logoBlack : logo}
            alt="신민석 포트폴리오 로고"
            className="w-[226px] max-lg:w-[186px] max-sm:w-[204px]"
          />
        </Link>
      </h1>

      <ul className="gnb flex justify-between gap-6 w-[70%] max-lg:hidden">
        <li className="max-w-[426px] flex-1">
          <p
            className={[
              "text-base leading-6 font-medium mb-1",
              isSub ? "text-sub-primary-txt" : "text-white",
            ].join(" ")}
          >
            MENU
          </p>
          <ul className="sub-list blur-siblings flex gap-6">
            {MENU_LINKS.map((link) => (
              <li
                key={link.label}
                className={[
                  "text-base leading-6 font-light",
                  isSub
                    ? "text-sub-tertiary-txt hover:text-sub-primary-txt"
                    : "text-secondary-txt hover:text-white",
                ].join(" ")}
              >
                <Link to={link.to}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </li>
        <li className="max-w-[426px] flex-1">
          <p
            className={[
              "text-base leading-6 font-medium mb-1",
              isSub ? "text-sub-primary-txt" : "text-white",
            ].join(" ")}
          >
            CONNECTION
          </p>
          <ul className="sub-list blur-siblings flex gap-6">
            <li
              className={[
                "text-base leading-6 font-light",
                isSub
                  ? "text-sub-tertiary-txt hover:text-sub-primary-txt"
                  : "text-secondary-txt hover:text-white",
              ].join(" ")}
            >
              <a href="https://www.behance.net/c177644f" target="_blank" rel="noopener noreferrer">
                Behance
              </a>
            </li>
          </ul>
        </li>
        <li className="max-w-[426px] flex-1">
          <p
            className={[
              "text-base leading-6 font-medium mb-1",
              isSub ? "text-sub-primary-txt" : "text-white",
            ].join(" ")}
          >
            E-MAIL
          </p>
          <ul className="sub-list blur-siblings flex gap-6">
            <li
              className={[
                "text-base leading-6 font-light",
                isSub
                  ? "text-sub-tertiary-txt hover:text-sub-primary-txt"
                  : "text-secondary-txt hover:text-white",
              ].join(" ")}
            >
              tlsalstjr422@naver.com
            </li>
          </ul>
        </li>
      </ul>

      <button
        type="button"
        aria-label="모바일 메뉴 열기"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((v) => !v)}
        className={[
          "mo-menu hidden max-lg:block relative w-[30px] h-5 border-0 bg-transparent cursor-pointer p-0 z-[100] max-sm:w-[26px]",
          "before:content-[''] before:block before:absolute before:left-0 before:w-full before:h-0.5 before:transition-all before:duration-300 before:ease-[ease]",
          "after:content-[''] after:block after:absolute after:left-0 after:w-full after:h-0.5 after:transition-all after:duration-300 after:ease-[ease]",
          isSub ? "before:bg-sub-tertiary-txt after:bg-sub-tertiary-txt" : "before:bg-white after:bg-white",
          menuOpen
            ? "before:top-1/2 before:-translate-y-1/2 before:rotate-45 after:bottom-1/2 after:translate-y-1/2 after:-rotate-45"
            : "before:top-0 after:bottom-0",
        ].join(" ")}
      >
        <span
          className={[
            "block absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 transition-all duration-300 ease-[ease]",
            isSub ? "bg-sub-tertiary-txt" : "bg-white",
            menuOpen ? "opacity-0" : "opacity-100",
          ].join(" ")}
        />
      </button>

      <MobileNav open={menuOpen} />
    </header>
  );
}
