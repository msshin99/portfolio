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
    document.body.style.overflow = menuOpen ? "hidden" : "";
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
      <h1 className="logo w-[30%] max-lg:relative max-lg:z-[60]">
        <Link to="/">
          <img
            src={isSub ? logoBlack : logo}
            alt="신민석 포트폴리오 로고"
            className="w-[226px] max-lg:w-[186px] max-sm:w-[160px]"
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
