import type { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useSession } from "./useSession";
import { GridIcon, LayoutTextIcon, LogoutIcon } from "./icons";
import { ADMIN_BG } from "./ui";

const NAV_ITEMS = [
  {
    to: "/admin",
    label: "포트폴리오",
    description: "작업물 등록·수정·순서",
    icon: GridIcon,
    match: (path: string) => path === "/admin" || path.startsWith("/admin/portfolios"),
  },
  {
    to: "/admin/site-content",
    label: "사이트 콘텐츠",
    description: "홈·소개 문구 및 이미지",
    icon: LayoutTextIcon,
    match: (path: string) => path.startsWith("/admin/site-content"),
  },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const session = useSession();

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/admin/login");
  }

  return (
    <div className={`min-h-screen ${ADMIN_BG} flex`}>
      <aside className="w-60 shrink-0 bg-[#111116] flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-white/10">
          <span className="text-white font-semibold tracking-tight text-[15px]">Portfolio Admin</span>
        </div>

        <nav className="flex-1 px-3 py-5 flex flex-col gap-1">
          {NAV_ITEMS.map(({ to, label, description, icon: Icon, match }) => {
            const active = match(location.pathname);
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-start gap-2.5 rounded-lg px-3 py-2.5 transition-colors ${
                  active ? "bg-[#4f46e5] text-white" : "text-[#a1a1aa] hover:bg-white/[0.06] hover:text-white"
                }`}
              >
                <Icon className="w-[18px] h-[18px] mt-0.5 shrink-0" />
                <span className="flex flex-col">
                  <span className="text-sm font-medium leading-tight">{label}</span>
                  <span className={`text-[11px] leading-tight mt-0.5 ${active ? "text-white/70" : "text-[#71717a]"}`}>
                    {description}
                  </span>
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-white/10 flex flex-col gap-2">
          {session && (
            <div className="px-3 py-1 text-xs text-[#71717a] truncate" title={session.user.email ?? ""}>
              {session.user.email}
            </div>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-[#a1a1aa] hover:bg-white/[0.06] hover:text-white transition-colors"
          >
            <LogoutIcon className="w-[18px] h-[18px]" />
            로그아웃
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 px-10 py-9">
        <div className="max-w-[1100px] mx-auto">{children}</div>
      </main>
    </div>
  );
}
