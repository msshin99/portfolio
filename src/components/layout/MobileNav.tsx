import { Link } from "react-router-dom";

interface MobileNavProps {
  open: boolean;
}

export default function MobileNav({ open }: MobileNavProps) {
  return (
    <div
      className={[
        "mo-nav-open hidden max-lg:block fixed w-full h-screen bg-black top-0 left-0 z-50",
        "transition-opacity duration-300 ease-[ease-in-out]",
        open ? "opacity-100 visible" : "opacity-0 invisible",
      ].join(" ")}
    >
      <ul className="blur-siblings-lg absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <li className="font-en text-[48px] leading-[56px] font-bold text-center block mb-7 text-white last:mb-0">
          <Link to="/">Home</Link>
        </li>
        <li className="font-en text-[48px] leading-[56px] font-bold text-center block mb-7 text-white last:mb-0">
          <Link to="/portfolio">Portfolio</Link>
        </li>
        <li className="font-en text-[48px] leading-[56px] font-bold text-center block mb-7 text-white last:mb-0">
          <Link to="/about">About</Link>
        </li>
        <li className="font-en text-[48px] leading-[56px] font-bold text-center block mb-7 text-white last:mb-0">
          <a href="https://www.behance.net/c177644f" target="_blank" rel="noopener noreferrer">
            Behence
          </a>
        </li>
      </ul>
      <div className="email absolute bottom-[14px] left-[14px]">
        <span className="font-en text-sm leading-[22px] font-light text-secondary-txt block">(E-mail)</span>
        <p className="font-en text-base leading-6 font-medium underline text-white">tlsalstjr422@naver.com</p>
      </div>
    </div>
  );
}
