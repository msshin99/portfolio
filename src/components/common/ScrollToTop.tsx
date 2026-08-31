import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

/**
 * 원본 정적 사이트는 페이지 이동마다 풀 리로드가 일어나 항상 스크롤이 맨 위에서
 * 시작했다. React Router의 클라이언트 사이드 전환은 스크롤 위치를 유지하므로,
 * 그 동작을 재현하기 위해 라우트가 바뀔 때마다 맨 위로 이동시킨다.
 *
 * 단, 포트폴리오 상세를 리스트 위 모달로 여닫는 전환은 예외다 — 리스트가 배경으로 계속
 * 유지돼야 클릭한 썸네일이 원래 있던 화면 위치에서 그대로 모달 이미지로 모프되는
 * shared-element 효과가 성립한다. 이건 두 방향 모두 막아야 한다:
 *  - 모달을 여는 이동(destination location.state에 backgroundLocation이 실림)
 *  - 모달을 닫는 이동(Close/ESC로 backgroundLocation.pathname으로 돌아가는 것 — 이 경우
 *    destination에는 이미 state가 없지만, "바로 직전에 모달이 떠 있던 배경 경로"로 돌아가는
 *    것이므로 마찬가지로 스크롤을 건드리면 안 된다)
 */
export default function ScrollToTop() {
  const location = useLocation();
  const prevBackgroundPathnameRef = useRef<string | null>(null);

  useEffect(() => {
    const backgroundLocation = (location.state as { backgroundLocation?: { pathname: string } } | null)
      ?.backgroundLocation;
    const isOpeningModal = Boolean(backgroundLocation);
    const isClosingModalBackToSameBackground = prevBackgroundPathnameRef.current === location.pathname;

    if (!isOpeningModal && !isClosingModalBackToSameBackground) {
      window.scrollTo(0, 0);
    }

    prevBackgroundPathnameRef.current = backgroundLocation ? backgroundLocation.pathname : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  return null;
}
