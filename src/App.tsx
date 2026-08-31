import { useEffect } from "react";
import { Routes, Route, useLocation, matchPath, type Location } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import ScrollToTop from "./components/common/ScrollToTop";
import { pendingOpenScrollY } from "./lib/scrollLock";
import Home from "./pages/Home";
import PortfolioList from "./pages/PortfolioList";
import PortfolioSlug from "./pages/PortfolioSlug";
import PortfolioDetailModal from "./pages/PortfolioDetailModal";
import About from "./pages/About";
import AdminLogin from "./admin/AdminLogin";
import AdminDashboard from "./admin/AdminDashboard";
import AdminPortfolioForm from "./admin/AdminPortfolioForm";
import AdminSiteContent from "./admin/AdminSiteContent";
import AdminGraphicWorks from "./admin/AdminGraphicWorks";
import RequireAuth from "./admin/RequireAuth";
import AdminLayout from "./admin/AdminLayout";

interface NavState {
  /** WorkCard 등에서 모달로 진입할 때 navigate(to, { state: { backgroundLocation } })로 넘긴,
   *  모달 뒤에 그대로 유지해야 하는 원래(리스트) 위치. */
  backgroundLocation?: Location;
}

export default function App() {
  const location = useLocation();
  const backgroundLocation = (location.state as NavState | null)?.backgroundLocation;

  // 모달(오버레이) 대상 slug는 배경이 아니라 "현재" location(실제 주소창 URL)에서 뽑는다.
  // 별도 <Routes>로 다시 매칭하지 않고 matchPath로 직접 꺼내면, 아래 AnimatePresence가
  // PortfolioDetailModal 하나만 key로 추적할 수 있어 닫힐 때 exit 애니메이션이 정상 동작한다.
  const modalMatch = backgroundLocation ? matchPath("/portfolio/:slug", location.pathname) : null;
  const isModalOpen = Boolean(modalMatch?.params.slug);

  // 모달이 떠 있는 동안 배경(리스트) 스크롤을 잠근다. slug->slug(Prev/Next) 전환처럼 모달이
  // 잠깐 언마운트+재마운트되는 순간에도 계속 잠긴 상태를 유지하도록 각 인스턴스가 아니라
  // 여기 App 레벨에서 한 번만 관리한다.
  //
  // 단순히 body에 overflow:hidden만 주면, 스크롤바가 사라지며 생기는 리플로우 +
  // shared-element(layoutId) 모프 애니메이션이 배경 그리드에 일으키는 순간적인 레이아웃
  // 변화가 겹쳐서 window.scrollY 값 자체가 살짝 어긋나는 문제가 있었다(실측: 400 -> 286).
  // body를 position:fixed로 고정하고 열 때의 scrollY를 top 오프셋으로 박아둔 뒤, 닫을 때
  // 그 값을 그대로 window.scrollTo로 복원하는 표준 스크롤 락 패턴으로 이 어긋남을 없앤다.
  useEffect(() => {
    if (!isModalOpen) return;
    // window.scrollY를 여기서 다시 읽지 않고, 클릭 이벤트 핸들러가 리플로우가 일어나기 전에
    // 미리 캡처해둔 값을 쓴다(자세한 이유는 scrollLock.ts 주석 참고).
    const scrollY = pendingOpenScrollY;
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      window.scrollTo(0, scrollY);
    };
  }, [isModalOpen]);

  return (
    <>
      <ScrollToTop />
      {/* backgroundLocation이 있으면(=모달로 진입한 상태) 항상 리스트 등 "배경" 라우트를 그대로
          렌더링해서, 상세 콘텐츠가 그 위에 오버레이로 뜨는 동안 리스트가 아래에 유지되게 한다.
          새로고침/직접 URL 접속처럼 backgroundLocation이 없을 땐 location을 그대로 써서
          /portfolio/:slug가 진짜 풀 페이지로 정상 렌더된다. */}
      <Routes location={backgroundLocation ?? location}>
        <Route path="/" element={<Home />} />
        <Route path="/portfolio" element={<PortfolioList />} />
        <Route path="/portfolio/:slug" element={<PortfolioSlug />} />
        <Route path="/about" element={<About />} />

        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <RequireAuth>
              <AdminLayout>
                <AdminDashboard />
              </AdminLayout>
            </RequireAuth>
          }
        />
        <Route
          path="/admin/portfolios/new"
          element={
            <RequireAuth>
              <AdminLayout>
                <AdminPortfolioForm />
              </AdminLayout>
            </RequireAuth>
          }
        />
        <Route
          path="/admin/portfolios/:id/edit"
          element={
            <RequireAuth>
              <AdminLayout>
                <AdminPortfolioForm />
              </AdminLayout>
            </RequireAuth>
          }
        />
        <Route
          path="/admin/site-content"
          element={
            <RequireAuth>
              <AdminLayout>
                <AdminSiteContent />
              </AdminLayout>
            </RequireAuth>
          }
        />
        <Route
          path="/admin/graphic-works"
          element={
            <RequireAuth>
              <AdminLayout>
                <AdminGraphicWorks />
              </AdminLayout>
            </RequireAuth>
          }
        />
      </Routes>

      <AnimatePresence>
        {modalMatch?.params.slug && (
          <PortfolioDetailModal key={modalMatch.params.slug} slug={modalMatch.params.slug} />
        )}
      </AnimatePresence>
    </>
  );
}
