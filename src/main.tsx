import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import "./styles/index.css";

// 새로고침/직접 URL 접속처럼 완전히 새로 불러온 페이지에서도, 브라우저는 이전 세션에서
// react-router가 남긴 history.state(backgroundLocation 등 SPA 내부 네비게이션 상태)를
// 그대로 들고 있다. 이 상태가 남아있으면 App.tsx가 지금 URL(/portfolio/:slug)을 "리스트
// 위에 뜬 상세 모달"로 착각해서, 리스트를 배경으로 렌더링하고 그 위에 모달을 얹는 방식으로
// 처리해버린다 — 그 결과 모달의 히어로 모프 애니메이션이 실제 클릭 이벤트 없이 재생되면서
// 불안정하게 동작해 새로고침하면 리스트만 보이는 것처럼 보이는 버그가 생겼다. main.tsx는
// 완전히 새로 로드될 때 딱 한 번만 실행되고 SPA 내부 이동으로는 재실행되지 않으므로, 여기서
// 한 번 정리해두면 이후 App은 항상 "직접 접속"과 동일한 깨끗한 상태로 시작한다.
if (window.history.state?.usr?.backgroundLocation) {
  window.history.replaceState(null, "", window.location.href);
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
