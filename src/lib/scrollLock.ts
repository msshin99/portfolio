/** 모달을 여는 클릭 시점의 window.scrollY를 담아두는 아주 작은 저장소 — App.tsx가 모달을
 *  닫을 때 이 값으로 window.scrollTo 복원한다. */
export let pendingOpenScrollY = 0;

/**
 * 배경 스크롤 잠금을 클릭 이벤트 핸들러 안에서, 즉 React가 모달 라우트를 커밋하기도 전에
 * 동기적으로 걸어버린다.
 *
 * 원래는 App.tsx의 useEffect에서 라우트가 바뀐 "다음"에 이 스타일을 적용했는데, 그 순서가
 * framer-motion의 layoutId 공유 애니메이션(썸네일 -> 히어로 이미지)과 충돌했다: 새 라우트가
 * 커밋되는 순간 framer-motion은 그 시점의(아직 잠기지 않은, 즉 스크롤된 채로의) 좌표를 기준으로
 * FROM/TO 박스를 측정하고 애니메이션을 시작하는데, 그 직후 useEffect가 body를 position:fixed로
 * 바꿔버리면 페이지 좌표계 자체가 갑자기 달라져 애니메이션 도중 진행 중이던 투영(projection)
 * 좌표가 어긋난다. 스크롤을 많이 내린 상태(예: Home의 My Works 섹션)에서 카드를 클릭하면
 * 히어로 이미지가 뷰포트보다 한참 아래(예: y ≈ 2000px 이상, 즉 화면 밖)에서 시작해 위로
 * 튀어 올라오며 커지는 것처럼 보였다 — 썸네일이 사라졌다가 화면 아래쪽에서 갑자기 나타나
 * 커지는 형태의 버그로 관찰됨(playwright로 프레임별 getBoundingClientRect를 찍어서 확인).
 *
 * 새 라우트가 렌더되기 전에 이미 body가 고정되어 있으면 framer-motion은 처음부터 최종
 * 좌표계를 기준으로 측정하므로 이 어긋남이 생기지 않는다. App.tsx의 useEffect는 그대로 두어도
 * 되는데, 같은 scrollY로 동일한 값을 다시 쓰는 것뿐이라 무해하다 — 모달을 닫을 때 복원하는
 * 역할은 계속 App.tsx가 담당한다.
 */
export function lockBackgroundScroll() {
  const scrollY = window.scrollY;
  pendingOpenScrollY = scrollY;
  document.body.style.position = "fixed";
  document.body.style.top = `-${scrollY}px`;
  document.body.style.left = "0";
  document.body.style.right = "0";
}
